"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, ImageList, sb, useAdmin } from "../../ui";
import { slugify } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const TAGS = ["bridal", "wedding", "festive", "daily", "gifting", "party"];
const blank: Partial<Product> = {
  name: "", name_mr: "", slug: "", category_id: null, short_description: "", description: "", price: 0, compare_at_price: null, sku: "",
  stock: 10, track_stock: true, images: [], tags: [], badge: null, is_featured: false, is_new: true, material: "Brass alloy with gold-tone plating",
  finish: "", care: "Keep away from water, perfume and sweat. Wipe with a soft dry cloth and store in the box provided.", seo_title: "", seo_description: "", sort: 0, active: true,
};

export default function ProductEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const { notify, can } = useAdmin();
  const [p, setP] = useState<Partial<Product> | null>(isNew ? blank : null);
  const [cats, setCats] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [del, setDel] = useState(false);

  useEffect(() => {
    sb().from("categories").select("*").order("sort").then(({ data }) => setCats((data ?? []) as Category[]));
    if (!isNew) sb().from("products").select("*").eq("id", id).single().then(({ data }) => setP(data as Product));
  }, [id, isNew]);
  if (!p) return <p className="muted">Loading…</p>;
  const ro = !can("manager");
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP({ ...p, [k]: v });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!p!.name?.trim()) return notify("Add a product name", true);
    if (!p!.price || p!.price <= 0) return notify("Add a price", true);
    if (!p!.images?.length) return notify("Add at least one photo", true);
    setBusy(true);
    const row = { ...p, slug: p!.slug || slugify(p!.name!), tags: (p!.tags ?? []).filter((t) => t !== "sample" || !isNew), compare_at_price: p!.compare_at_price || null, badge: p!.badge || null };
    delete (row as any).id; delete (row as any).created_at; delete (row as any).updated_at;
    const res = isNew ? await sb().from("products").insert(row).select().single() : await sb().from("products").update(row).eq("id", id).select().single();
    setBusy(false);
    if (res.error) return notify(res.error.message.includes("duplicate") ? "That web address (slug) is already used. Change it." : res.error.message, true);
    notify("Saved");
    if (isNew) router.replace(`/admin/products/${res.data.id}`); else setP(res.data as Product);
  }
  async function remove() {
    const { error } = await sb().from("products").delete().eq("id", id);
    if (error) return notify(error.message, true);
    router.replace("/admin/products");
  }

  return (
    <form onSubmit={save}>
      <div className="adm-top">
        <div><Link href="/admin/products" className="muted">← Products</Link><h1>{isNew ? "New product" : p.name}</h1></div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && p.active && <Link className="abtn" href={`/products/${p.slug}`} target="_blank">View on site ↗</Link>}
          {!ro && <button className="abtn pri" disabled={busy}>{busy ? "Saving…" : "Save product"}</button>}
        </div>
      </div>
      <fieldset disabled={ro} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="agrid">
          <div style={{ display: "grid", gap: 20 }}>
            <div className="card2 aform">
              <Field label="Product name"><input value={p.name ?? ""} onChange={(e) => { const name = e.target.value; setP({ ...p, name, ...(slugTouched ? {} : { slug: slugify(name) }) }); }} required /></Field>
              <Field label="Name in Marathi (optional)" hint="Shown under the name, helps Marathi searches."><input value={p.name_mr ?? ""} onChange={(e) => set("name_mr", e.target.value)} placeholder="उदा. कोल्हापुरी साज" /></Field>
              <Field label="Short description" hint="One line shown near the price."><input value={p.short_description ?? ""} onChange={(e) => set("short_description", e.target.value)} maxLength={200} /></Field>
              <Field label="Full description"><textarea value={p.description ?? ""} onChange={(e) => set("description", e.target.value)} style={{ minHeight: 140 }} /></Field>
            </div>
            <div className="card2">
              <h2 className="sec-title">Photos</h2>
              <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>The first photo is the main one. Use a square or portrait photo on a plain background; photos are compressed automatically.</p>
              <ImageList images={p.images ?? []} onChange={(v) => set("images", v)} />
            </div>
            <div className="card2 aform">
              <h2 className="sec-title" style={{ margin: 0 }}>Details</h2>
              <div className="acols">
                <Field label="Material"><input value={p.material ?? ""} onChange={(e) => set("material", e.target.value)} /></Field>
                <Field label="Finish / colour"><input value={p.finish ?? ""} onChange={(e) => set("finish", e.target.value)} placeholder="Gold-tone, antique polish" /></Field>
              </div>
              <Field label="Care instructions"><textarea value={p.care ?? ""} onChange={(e) => set("care", e.target.value)} style={{ minHeight: 70 }} /></Field>
            </div>
            <div className="card2 aform">
              <h2 className="sec-title" style={{ margin: 0 }}>Search engines (SEO)</h2>
              <Field label="Web address" hint={`alankarfashions.com/products/${p.slug || "…"}`}><input value={p.slug ?? ""} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
              <Field label="Page title (optional)" hint="Leave blank to use the product name."><input value={p.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value)} maxLength={70} /></Field>
              <Field label="Meta description (optional)" hint="About 150 characters shown in Google results."><textarea value={p.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value)} maxLength={170} style={{ minHeight: 70 }} /></Field>
            </div>
          </div>
          <div style={{ display: "grid", gap: 20 }}>
            <div className="card2 aform">
              <label className="check"><input type="checkbox" checked={!!p.active} onChange={(e) => set("active", e.target.checked)} /> Show on website</label>
              <Field label="Category">
                <select value={p.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}>
                  <option value="">Choose…</option>
                  {cats.filter((c) => !c.parent_id).map((c) => (
                    <optgroup key={c.id} label={c.name}><option value={c.id}>{c.name} (all)</option>{cats.filter((k) => k.parent_id === c.id).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</optgroup>
                  ))}
                </select>
              </Field>
            </div>
            <div className="card2 aform">
              <h2 className="sec-title" style={{ margin: 0 }}>Price &amp; stock</h2>
              <div className="acols">
                <Field label="Selling price (₹)"><input type="number" min={1} value={p.price || ""} onChange={(e) => set("price", Number(e.target.value))} required /></Field>
                <Field label="MRP / compare price (₹)" hint="Shown struck out."><input type="number" min={0} value={p.compare_at_price ?? ""} onChange={(e) => set("compare_at_price", e.target.value ? Number(e.target.value) : null)} /></Field>
              </div>
              <div className="acols">
                <Field label="Stock"><input type="number" min={0} value={p.stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} /></Field>
                <Field label="SKU / code"><input value={p.sku ?? ""} onChange={(e) => set("sku", e.target.value)} /></Field>
              </div>
              <label className="check"><input type="checkbox" checked={!!p.track_stock} onChange={(e) => set("track_stock", e.target.checked)} /> Track stock (show &ldquo;sold out&rdquo; at 0)</label>
            </div>
            <div className="card2 aform">
              <h2 className="sec-title" style={{ margin: 0 }}>Highlight</h2>
              <label className="check"><input type="checkbox" checked={!!p.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Bestseller (homepage)</label>
              <label className="check"><input type="checkbox" checked={!!p.is_new} onChange={(e) => set("is_new", e.target.checked)} /> New arrival</label>
              <Field label="Badge on photo"><select value={p.badge ?? ""} onChange={(e) => set("badge", e.target.value || null)}><option value="">None</option><option>Bestseller</option><option>New</option><option>Bridal</option><option>Limited</option><option>Sale</option></select></Field>
              <Field label="Occasion tags" hint="Used for 'Shop by occasion' filters.">
                <div className="toggle-list">{TAGS.map((t) => <label key={t} className="check"><input type="checkbox" checked={(p.tags ?? []).includes(t)} onChange={(e) => set("tags", e.target.checked ? [...(p.tags ?? []), t] : (p.tags ?? []).filter((x) => x !== t))} /> {t}</label>)}</div>
              </Field>
              <Field label="Sort order" hint="Lower numbers show first."><input type="number" value={p.sort ?? 0} onChange={(e) => set("sort", Number(e.target.value))} /></Field>
            </div>
            {!isNew && !ro && <button type="button" className="abtn danger" onClick={() => setDel(true)}>Delete product</button>}
          </div>
        </div>
      </fieldset>
      {del && (
        <div className="modal-bg" onClick={() => setDel(false)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="sec-title" style={{ margin: 0 }}>Delete &ldquo;{p.name}&rdquo;?</h2>
          <p style={{ margin: 0 }}>This can&apos;t be undone. To keep it but remove it from the store, untick &ldquo;Show on website&rdquo; instead.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button type="button" className="abtn" onClick={() => setDel(false)}>Keep it</button><button type="button" className="abtn pri" onClick={remove}>Delete permanently</button></div>
        </div></div>
      )}
    </form>
  );
}
