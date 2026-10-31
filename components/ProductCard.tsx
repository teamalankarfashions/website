"use client";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { inr, pctOff } from "@/lib/format";
import { useStore } from "./Store";
import { IconHeart } from "./Icons";

export default function ProductCard({ p, catName }: { p: Product; catName?: string }) {
  const { add, wish, toggleWish } = useStore();
  const img = p.images?.[0]?.url, alt = p.images?.[1]?.url;
  const out = p.track_stock && p.stock <= 0;
  const off = pctOff(p.price, p.compare_at_price);
  const small = (u: string) => u.replace("w=1200", "w=700");
  return (
    <article className="card">
      <Link className="ph" href={`/products/${p.slug}`} aria-label={p.name}>
        {img && <img src={small(img)} alt={p.images[0].alt || p.name} loading="lazy" />}
        {alt && <img className="alt" src={small(alt)} alt="" loading="lazy" />}
      </Link>
      {out ? <span className="badge out">Sold out</span> : p.badge ? <span className={`badge ${p.badge === "Bestseller" ? "red" : ""}`}>{p.badge}</span> : null}
      <button className="wish" aria-label={`Save ${p.name} to wishlist`} aria-pressed={wish.includes(p.id)} onClick={() => toggleWish(p.id)}><IconHeart /></button>
      <div className="meta">
        {catName && <span className="cat-n">{catName}</span>}
        <h3><Link href={`/products/${p.slug}`}>{p.name}</Link></h3>
        <div className="price"><b>{inr(p.price)}</b>{off > 0 && <><s>{inr(p.compare_at_price!)}</s><i>{off}% off</i></>}</div>
      </div>
      {!out && (
        <button className="btn btn-dark" style={{ padding: "12px", fontSize: 11 }} onClick={() => add({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: img ?? null, stock: p.track_stock ? p.stock : 20 })}>Add to bag</button>
      )}
    </article>
  );
}
