"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./Store";
import { IconWhatsApp } from "./Icons";
import { inr } from "@/lib/format";
import type { CartLine } from "@/lib/types";

export default function BuyBox({ p, out, lowAt, whatsapp }: { p: Omit<CartLine, "qty">; out: boolean; lowAt: number; whatsapp: string }) {
  const { add, wish, toggleWish } = useStore();
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const max = Math.max(1, Math.min(10, p.stock ?? 10));
  useEffect(() => { document.body.classList.add("has-sticky"); return () => document.body.classList.remove("has-sticky"); }, []);
  const stock = p.stock ?? 99;
  return (
    <>
      {out ? <span className="stockline out">Sold out. WhatsApp us to be told when it&apos;s back.</span>
        : stock <= lowAt ? <span className="stockline low">Only {stock} left</span> : <span className="stockline" style={{ color: "var(--ok)" }}>In stock, ready to ship</span>}
      {!out && (
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="muted" style={{ fontSize: 13 }}>Quantity</span>
          <span className="qty" style={{ marginTop: 0 }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Increase quantity">+</button>
          </span>
        </div>
      )}
      <div className="row">
        {!out && <button className="btn btn-dark" onClick={() => add(p, qty)}>Add to bag</button>}
        {!out && <button className="btn btn-red" onClick={() => { add(p, qty, false); router.push("/checkout"); }}>Buy now</button>}
      </div>
      <div className="row">
        <a className="btn btn-wa" href={whatsapp} target="_blank" rel="noopener"><span style={{ width: 18, height: 18, display: "inline-flex" }}><IconWhatsApp /></span> Ask on WhatsApp</a>
        <button className="btn btn-ghost" aria-pressed={wish.includes(p.id)} onClick={() => toggleWish(p.id)}>{wish.includes(p.id) ? "♥ Saved" : "♡ Save to wishlist"}</button>
      </div>
      {!out && (
        <div className="sticky-buy">
          <div style={{ display: "grid" }}><b style={{ color: "var(--sindoor)" }}>{inr(p.price)}</b><small className="muted">COD available</small></div>
          <button className="btn btn-red" onClick={() => add(p, qty)}>Add to bag</button>
        </div>
      )}
    </>
  );
}
