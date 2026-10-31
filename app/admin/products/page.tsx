"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sb, useAdmin } from "../ui";
import { inr } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

function Inner() {
  const { can, notify } = useAdmin();
  const sp = useSearchParams();
  const [rows, setRows] = useState<Product[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [tag, setTag] = useState(sp.get("tag") ?? ""); const [show, setShow] = useState("all");
  const [sel, setSel] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);

  async function load() {
    let query = sb().from("products").select("*").order("sort").order("created_at", { ascending: false });
    if (cat) query = query.eq("category_id", cat);
    if (tag) query = query.contains("tags", [tag]);
    if (show === "live") query = query.eq("active", true);
    if (show === "hidden") query = query.eq("active", false);
    if (show === "out") query = query.lte("stock", 0);
    if (q.trim()) query = query.ilike("name", `%${q.trim().replace(/[%,]/g, "")}%`);
    const { data } = await query.limit(500);
    setRows((data ?? []) as Product[]); setSel([]);
  }
  useEffect(() => { sb().from("categories").select("*").order("sort").then(({ data }) => setCats((data ?? []) as Category[])); }, []);
  useEffect(() => { const h = setTimeout(load, 250); return () => clearTimeout(h); }, [q, cat, tag, show]); // eslint-disable-line

  async function setStock(p: Product, stock: number) {
    const { error } = await sb().from("products").update({ stock: Math.max(0, stock) }).eq("id", p.id);
    if (error) notify(error.message, true); else setRows((r) => r!.map((x) => (x.id === p.id ? { ...x, stock: Math.max(0, stock) } : x)));
  }
  async function bulk(action: "show" | "hide" | "delete") {
    const qb = sb().from("products");
    const { error } = action === "delete" ? await qb.delete().in("id", sel) : await qb.update({ active: action === "show" }).in("id", sel);
    setConfirm(false);
    if (error) return notify(error.message, true);
    notify(action === "delete" ? `Deleted ${sel.length} products` : "Updated"); load();
  }
  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name ?? "—";

  return (
    <>
      <div className="adm-top"><h1>Products</h1>{can("manager") && <Link className="abtn pri" href="/admin/products/new">+ Add product</Link>}</div>
      <div className="filters">
        <input placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: "1 1 220px" }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "— " : ""}{c.name}</option>)}</select>
        <select value={show} onChange={(e) => setShow(e.target.value)} aria-label="Visibility"><option value="all">All</option><option value="live">Live</option><option value="hidden">Hidden</option><option value="out">Out of stock</option></select>
        <select value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag"><option value="">Any tag</option>{["sample", "bridal", "wedding", "festive", "daily", "gifting", "party"].map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      {sel.length > 0 && can("manager") && (
        <div className="note" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <b>{sel.length} selected</b>
          <button className="abtn sm" onClick={() => bulk("show")}>Show on site</button>
          <button className="abtn sm" onClick={() => bulk("hide")}>Hide</button>
          <button className="abtn sm danger" onClick={() => setConfirm(true)}>Delete</button>
        </div>
      )}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr>
            {can("manager") && <th style={{ width: 36 }}><input type="checkbox" aria-label="Select all" checked={!!rows?.length && sel.length === rows.length} onChange={(e) => setSel(e.target.checked ? rows!.map((r) => r.id) : [])} /></th>}
            <th /><th>Product</th><th>Category</th><th className="num">Price</th><th>Stock</th><th>Status</th>
          </tr></thead>
          <tbody>
            {rows === null ? <tr><td colSpan={7} className="muted">Loading…</td></tr> : rows.length === 0 ? <tr><td colSpan={7} className="muted">No products. {can("manager") && <Link href="/admin/products/new" style={{ textDecoration: "underline" }}>Add your first one</Link>}</td></tr> :
              rows.map((p) => (
                <tr key={p.id}>
                  {can("manager") && <td><input type="checkbox" aria-label={`Select ${p.name}`} checked={sel.includes(p.id)} onChange={(e) => setSel(e.target.checked ? [...sel, p.id] : sel.filter((x) => x !== p.id))} /></td>}
                  <td style={{ width: 56 }}>{p.images[0] && <img className="thumb" src={p.images[0].url.replace("w=1200", "w=120")} alt="" />}</td>
                  <td><Link href={`/admin/products/${p.id}`}><b>{p.name}</b></Link><br /><small className="muted">{p.sku}{p.tags.includes("sample") ? " · sample" : ""}</small></td>
                  <td>{catName(p.category_id)}</td>
                  <td className="num">{inr(p.price)}</td>
                  <td>
                    <span className="qty" style={{ marginTop: 0, background: "#fff" }}>
                      <button onClick={() => setStock(p, p.stock - 1)} aria-label="Decrease stock">−</button>
                      <span style={{ color: p.stock <= 0 ? "var(--bad)" : p.stock <= 3 ? "var(--warn)" : undefined }}>{p.stock}</span>
                      <button onClick={() => setStock(p, p.stock + 1)} aria-label="Increase stock">+</button>
                    </span>
                  </td>
                  <td>{p.active ? <span className="pill delivered">Live</span> : <span className="pill pending">Hidden</span>}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {confirm && (
        <div className="modal-bg" onClick={() => setConfirm(false)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="sec-title" style={{ margin: 0 }}>Delete {sel.length} products?</h2>
          <p style={{ margin: 0 }}>This can&apos;t be undone. Past orders keep their item details. To keep a product but remove it from the store, choose Hide instead.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button className="abtn" onClick={() => setConfirm(false)}>Keep them</button><button className="abtn pri" onClick={() => bulk("delete")}>Delete permanently</button></div>
        </div></div>
      )}
    </>
  );
}
export default function Products() { return <Suspense><Inner /></Suspense>; }
