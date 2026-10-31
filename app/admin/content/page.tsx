"use client";
import { useEffect, useState } from "react";
import { Field, ImageList, SingleImage, sb, useAdmin } from "../ui";
import type { Home } from "@/lib/types";

const SECTIONS: [string, string][] = [["trust", "Trust strip (shipping, COD…)"], ["categories", "Shop by collection"], ["marquee", "Marathi names band"], ["heritage", "Kolhapuri Saj story"], ["bestsellers", "Bestsellers"], ["bridal", "Bridal banner"], ["occasions", "Budget & occasion"], ["video", "Video section"], ["gift", "Gifting"], ["instagram", "Instagram grid"], ["visit", "Visit our shop"], ["faq", "FAQ preview"], ["newsletter", "Newsletter signup"]];

export default function Content() {
  const { notify } = useAdmin();
  const [h, setH] = useState<Home | null>(null);
  const [ann, setAnn] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    sb().from("settings").select("key,value").in("key", ["home", "announcements"]).then(({ data }) => {
      for (const r of data ?? []) { if (r.key === "home") setH(r.value as Home); if (r.key === "announcements") setAnn(r.value as string[]); }
    });
  }, []);
  if (!h) return <p className="muted">Loading…</p>;
  const up = <K extends keyof Home>(k: K, patch: Partial<Home[K]>) => setH({ ...h, [k]: { ...(h[k] as object), ...patch } as Home[K] });
  async function save() {
    setBusy(true);
    const r = await sb().from("settings").upsert([{ key: "home", value: h, updated_at: new Date().toISOString() }, { key: "announcements", value: ann.filter((a) => a.trim()), updated_at: new Date().toISOString() }]);
    setBusy(false);
    r.error ? notify(r.error.message, true) : notify("Homepage updated. Refresh the store to see it.");
  }
  return (
    <>
      <div className="adm-top"><h1>Homepage &amp; banners</h1><div style={{ display: "flex", gap: 8 }}><a className="abtn" href="/" target="_blank">Preview ↗</a><button className="abtn pri" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div></div>
      <div className="agrid">
        <div style={{ display: "grid", gap: 20 }}>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Top announcement bar</h2>
            {ann.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input className="input" style={{ borderRadius: 8 }} value={a} onChange={(e) => setAnn(ann.map((x, k) => (k === i ? e.target.value : x)))} aria-label={`Announcement ${i + 1}`} />
                <button className="abtn sm danger" onClick={() => setAnn(ann.filter((_, k) => k !== i))} aria-label="Remove">✕</button>
              </div>
            ))}
            <button className="abtn sm" onClick={() => setAnn([...ann, ""])} style={{ justifySelf: "start" }}>+ Add message</button>
          </div>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Hero banner</h2>
            <Field label="Small line above title (Marathi works)"><input value={h.hero.tag} onChange={(e) => up("hero", { tag: e.target.value })} /></Field>
            <Field label="Main title"><input value={h.hero.title} onChange={(e) => up("hero", { title: e.target.value })} /></Field>
            <Field label="Subtitle"><textarea value={h.hero.subtitle} onChange={(e) => up("hero", { subtitle: e.target.value })} style={{ minHeight: 70 }} /></Field>
            <Field label="Hero photo" hint="Portrait or landscape, at least 1600px wide."><SingleImage url={h.hero.image} onChange={(u) => up("hero", { image: u })} /></Field>
            <div className="acols">
              <Field label="Button 1 text"><input value={h.hero.cta1_label} onChange={(e) => up("hero", { cta1_label: e.target.value })} /></Field>
              <Field label="Button 1 link"><input value={h.hero.cta1_href} onChange={(e) => up("hero", { cta1_href: e.target.value })} placeholder="/collections/traditionals" /></Field>
              <Field label="Button 2 text"><input value={h.hero.cta2_label} onChange={(e) => up("hero", { cta2_label: e.target.value })} /></Field>
              <Field label="Button 2 link"><input value={h.hero.cta2_href} onChange={(e) => up("hero", { cta2_href: e.target.value })} /></Field>
            </div>
          </div>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Kolhapuri Saj story</h2>
            <Field label="Title"><input value={h.heritage.title} onChange={(e) => up("heritage", { title: e.target.value })} /></Field>
            <Field label="Text" hint="Leave a blank line between paragraphs."><textarea value={h.heritage.text} onChange={(e) => up("heritage", { text: e.target.value })} style={{ minHeight: 140 }} /></Field>
            <Field label="Photo"><SingleImage url={h.heritage.image} onChange={(u) => up("heritage", { image: u })} /></Field>
          </div>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Bridal banner</h2>
            <div className="acols">
              <Field label="Small line"><input value={h.bridal.tag} onChange={(e) => up("bridal", { tag: e.target.value })} /></Field>
              <Field label="Title"><input value={h.bridal.title} onChange={(e) => up("bridal", { title: e.target.value })} /></Field>
            </div>
            <Field label="Text"><textarea value={h.bridal.text} onChange={(e) => up("bridal", { text: e.target.value })} style={{ minHeight: 70 }} /></Field>
            <Field label="Button link"><input value={h.bridal.href} onChange={(e) => up("bridal", { href: e.target.value })} /></Field>
            <Field label="Wide photo"><SingleImage url={h.bridal.image} onChange={(u) => up("bridal", { image: u })} /></Field>
          </div>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Video section</h2>
            <Field label="Vimeo video ID" hint="The number in your Vimeo link, e.g. vimeo.com/1209327159 → 1209327159"><input value={h.video.vimeo_id} onChange={(e) => up("video", { vimeo_id: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Title"><input value={h.video.title} onChange={(e) => up("video", { title: e.target.value })} /></Field>
            <Field label="Text"><textarea value={h.video.text} onChange={(e) => up("video", { text: e.target.value })} style={{ minHeight: 60 }} /></Field>
            <Field label="Cover photo (shown while video loads)"><SingleImage url={h.video.poster} onChange={(u) => up("video", { poster: u })} /></Field>
          </div>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Gifting</h2>
            <div className="acols">
              <Field label="Small line"><input value={h.gift.tag} onChange={(e) => up("gift", { tag: e.target.value })} /></Field>
              <Field label="Title"><input value={h.gift.title} onChange={(e) => up("gift", { title: e.target.value })} /></Field>
            </div>
            <Field label="Text"><textarea value={h.gift.text} onChange={(e) => up("gift", { text: e.target.value })} style={{ minHeight: 60 }} /></Field>
            <Field label="Points (one per line)"><textarea value={(h.gift.points ?? []).join("\n")} onChange={(e) => up("gift", { points: e.target.value.split("\n") })} style={{ minHeight: 80 }} /></Field>
            <Field label="Button link"><input value={h.gift.href} onChange={(e) => up("gift", { href: e.target.value })} /></Field>
            <Field label="Photo"><SingleImage url={h.gift.image} onChange={(u) => up("gift", { image: u })} /></Field>
          </div>
          <div className="card2">
            <h2 className="sec-title">Instagram grid (6 photos)</h2>
            <ImageList images={(h.instagram ?? []).map((url) => ({ url }))} max={6} folder="instagram" onChange={(v) => setH({ ...h, instagram: v.map((x) => x.url) })} />
          </div>
        </div>
        <div className="card2" style={{ position: "sticky", top: 20 }}>
          <h2 className="sec-title">Show or hide sections</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {SECTIONS.map(([k, label]) => <label key={k} className="check"><input type="checkbox" checked={h.sections?.[k] !== false} onChange={(e) => setH({ ...h, sections: { ...h.sections, [k]: e.target.checked } })} /> {label}</label>)}
          </div>
          <button className="abtn pri" style={{ marginTop: 18, width: "100%", justifyContent: "center" }} onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </>
  );
}
