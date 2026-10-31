import { Fragment } from "react";

/** Minimal, safe markdown: "## heading", "- list item", **bold**, blank-line paragraphs. No HTML passthrough. */
function inline(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part}</Fragment>);
}
export default function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        const out: React.ReactNode[] = [];
        let list: string[] = [];
        const flush = () => { if (list.length) { out.push(<ul key={`u${out.length}`}>{list.map((l, j) => <li key={j}>{inline(l)}</li>)}</ul>); list = []; } };
        let para: string[] = [];
        const flushP = () => { if (para.length) { out.push(<p key={`p${out.length}`}>{inline(para.join(" "))}</p>); para = []; } };
        for (const l of lines) {
          if (l.startsWith("## ")) { flushP(); flush(); out.push(<h2 key={`h${out.length}`}>{inline(l.slice(3))}</h2>); }
          else if (/^[-*] /.test(l)) { flushP(); list.push(l.slice(2)); }
          else if (l.trim()) { flush(); para.push(l.trim()); }
        }
        flushP(); flush();
        return <Fragment key={i}>{out}</Fragment>;
      })}
    </>
  );
}
