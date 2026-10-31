"use client";
import { useEffect, useState } from "react";
import { Field, SingleImage, sb, useAdmin } from "../ui";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";

export default function Categories() {
  const { notify } = useAdmin();
  const [cats, setCats] = useState<Category[]>([]);
  const [edit, setEdit] = useState<Partial<Category> | null>(null);
  const load = () => sb().from("categories").select("*").order("sort").then(({ data }) => setCats((data ?? []) as Category[]));
  useEffect(() => { load(); }, []);

  async function save() {
    if (!edit?.name?.trim()) return notify("Add a name", true);
    const row = { ...edit, slug: edit.slug || slugify(edit.name), parent_id: edit.parent_id || null };
    delete (row as any).created_at;
    const r = row.id ? await sb().from("categories").update(row).eq("id", row.id) : await sb().from("categories").insert(row);
    if (r.error) return notify(r.error.message.includes("duplicate") ? "That web address is already used." : r.error.message, true);
    notify("Saved"); setEdit(null); load();
  }
  async function remove(c: Category) {
    const { count } = await sb().from("products").select("id", { count: "exact", head: true }).eq("category_id", c.id);
    if (count) return notify(`Move or delete its ${count} products first, or just hide the category.`, true);
    const { error } = await sb().from("categories").delete().eq("id", c.id);
    if (error) notify(error.message, true); else { notify("Deleted"); setEdit(null); load(); }
  }
  const parents = cats.filter((c) => !c.parent_id);

  return (
    <>
      <div className="adm-top"><h1>Categories</h1><button className="abtn pri" onClick={() => setEdit({ name: "", active: true, sort: cats.length + 1, parent_id: null })}>+ Add category</button></div>
      <p className="muted" style={{ marginTop: -12 }}>Top-level categories appear in the main menu and homepage. Subcategories appear inside them.</p>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th /><th>Name</th><th>Marathi</th><th>Web address</th><th>Order</th><th>Status</th><th /></tr></thead>
        <tbody>
          {parents.flatMap((p) => [p, ...cats.filter((c) => c.parent_id === p.id)]).map((c) => (
            <tr key={c.id}>
              <td style={{ width: 56 }}>{c.image_url && <img className="thumb" src={c.image_url} alt="" />}</td>
              <td style={{ paddingLeft: c.parent_id ? 34 : 14 }}>{c.parent_id ? "↳ " : ""}<b>{c.name}</b></td>
              <td className="mr">{c.name_mr}</td>
              <td><small>/collections/{c.slug}</small></td>
              <td>{c.sort}</td>
              <td>{c.active ? <span className="pill delivered">Live</span> : <span className="pill pending">Hidden</span>}</td>
              <td><button className="abtn sm" onClick={() => setEdit(c)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {edit && (
        <div className="modal-bg" onClick={() => setEdit(null)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="sec-title" style={{ margin: 0 }}>{edit.id ? "Edit category" : "New category"}</h2>
          <div className="acols">
            <Field label="Name"><input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value, ...(edit.id ? {} : { slug: slugify(e.target.value) }) })} /></Field>
            <Field label="Name in Marathi"><input value={edit.name_mr ?? ""} onChange={(e) => setEdit({ ...edit, name_mr: e.target.value })} /></Field>
          </div>
          <Field label="Inside (parent)"><select value={edit.parent_id ?? ""} onChange={(e) => setEdit({ ...edit, parent_id: e.target.value || null })}><option value="">Top level (main menu)</option>{parents.filter((p) => p.id !== edit.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Web address" hint={`/collections/${edit.slug ?? ""}`}><input value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} /></Field>
          <Field label="Description" hint="Shown at the top of the category page and used by Google."><textarea value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} style={{ minHeight: 70 }} /></Field>
          {!edit.parent_id && <Field label="Cover image (homepage tile)"><SingleImage url={edit.image_url ?? ""} folder="categories" onChange={(u) => setEdit({ ...edit, image_url: u })} /></Field>}
          <div className="acols">
            <Field label="SEO title"><input value={edit.seo_title ?? ""} onChange={(e) => setEdit({ ...edit, seo_title: e.target.value })} maxLength={70} /></Field>
            <Field label="Order"><input type="number" value={edit.sort ?? 0} onChange={(e) => setEdit({ ...edit, sort: Number(e.target.value) })} /></Field>
          </div>
          <Field label="SEO description"><textarea value={edit.seo_description ?? ""} onChange={(e) => setEdit({ ...edit, seo_description: e.target.value })} maxLength={170} style={{ minHeight: 60 }} /></Field>
          <label className="check"><input type="checkbox" checked={!!edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Show on website</label>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            {edit.id ? <button className="abtn danger" onClick={() => remove(edit as Category)}>Delete</button> : <span />}
            <div style={{ display: "flex", gap: 8 }}><button className="abtn" onClick={() => setEdit(null)}>Cancel</button><button className="abtn pri" onClick={save}>Save</button></div>
          </div>
        </div></div>
      )}
    </>
  );
}
