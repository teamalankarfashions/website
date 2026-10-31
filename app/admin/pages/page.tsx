"use client";
import { useEffect, useState } from "react";
import { Field, sb, useAdmin } from "../ui";
import { fmtDay, slugify } from "@/lib/format";

type Pg = { slug: string; title: string; body: string; seo_description: string | null; updated_at: string; _new?: boolean };

export default function Pages() {
  const { notify } = useAdmin();
  const [rows, setRows] = useState<Pg[]>([]);
  const [edit, setEdit] = useState<Pg | null>(null);
  const load = () => sb().from("pages").select("*").order("slug").then(({ data }) => setRows((data ?? []) as Pg[]));
  useEffect(() => { load(); }, []);
  async function save() {
    if (!edit) return;
    const { _new, ...row } = { ...edit, slug: slugify(edit.slug || edit.title), updated_at: new Date().toISOString() };
    const r = await sb().from("pages").upsert(row);
    if (r.error) return notify(r.error.message, true);
    notify("Page saved"); setEdit(null); load();
  }
  return (
    <>
      <div className="adm-top"><h1>Pages &amp; policies</h1><button className="abtn pri" onClick={() => setEdit({ slug: "", title: "", body: "", seo_description: "", updated_at: "", _new: true })}>+ New page</button></div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Page</th><th>Address</th><th>Updated</th><th /></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.slug}><td><b>{p.title}</b></td><td><a href={`/${p.slug}`} target="_blank">/{p.slug} ↗</a></td><td>{fmtDay(p.updated_at)}</td><td><button className="abtn sm" onClick={() => setEdit(p)}>Edit</button></td></tr>
        ))}</tbody>
      </table></div>
      {edit && (
        <div className="modal-bg" onClick={() => setEdit(null)}><div className="modal" style={{ width: "min(820px,100%)" }} onClick={(e) => e.stopPropagation()}>
          <h2 className="sec-title" style={{ margin: 0 }}>{edit._new ? "New page" : edit.title}</h2>
          <div className="acols">
            <Field label="Title"><input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Address" hint={`alankarfashions.com/${edit.slug}`}><input value={edit.slug} disabled={!edit._new} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} /></Field>
          </div>
          <Field label="Content" hint={edit.slug === "faq" ? "Start each question with ## on its own line, then the answer below it." : "Use ## for a heading, - for a list item, **text** for bold. Leave a blank line between paragraphs."}>
            <textarea value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} style={{ minHeight: 320, fontFamily: "ui-monospace,monospace", fontSize: 14 }} />
          </Field>
          <Field label="Google description" hint="About 150 characters."><input value={edit.seo_description ?? ""} onChange={(e) => setEdit({ ...edit, seo_description: e.target.value })} maxLength={170} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            {!edit._new && !["about", "faq", "shipping-policy", "return-policy", "refund-policy", "privacy-policy", "terms-and-conditions"].includes(edit.slug)
              ? <button className="abtn danger" onClick={async () => { await sb().from("pages").delete().eq("slug", edit.slug); setEdit(null); load(); }}>Delete page</button> : <span />}
            <div style={{ display: "flex", gap: 8 }}><button className="abtn" onClick={() => setEdit(null)}>Cancel</button><button className="abtn pri" onClick={save}>Save page</button></div>
          </div>
        </div></div>
      )}
    </>
  );
}
