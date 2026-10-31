"use client";
import Link from "next/link";
import { useStore } from "./Store";
import { inr } from "@/lib/format";

export function ShipBar({ subtotal, freeAbove }: { subtotal: number; freeAbove: number }) {
  const left = Math.max(0, freeAbove - subtotal);
  return (
    <div className="ship-bar">
      {left ? <>Add <b>{inr(left)}</b> more for free shipping</> : <b>You&apos;ve unlocked free shipping</b>}
      <div className="bar"><i style={{ width: `${Math.min(100, (subtotal / Math.max(1, freeAbove)) * 100)}%` }} /></div>
    </div>
  );
}

export function Lines() {
  const { lines, setQty, remove } = useStore();
  return (
    <>
      {lines.map((l) => (
        <div className="line" key={l.id}>
          <Link href={`/products/${l.slug}`}>{l.image ? <img src={l.image.replace("w=1200", "w=200")} alt="" /> : <div style={{ width: 72, aspectRatio: "4/5", background: "var(--pearl-2)" }} />}</Link>
          <div>
            <h4><Link href={`/products/${l.slug}`}>{l.name}</Link></h4>
            <small>{inr(l.price)}</small>
            <div>
              <span className="qty">
                <button onClick={() => setQty(l.id, l.qty - 1)} aria-label={`Decrease ${l.name}`}>−</button>
                <span>{l.qty}</span>
                <button onClick={() => setQty(l.id, l.qty + 1)} aria-label={`Increase ${l.name}`}>+</button>
              </span>
              <button className="rm" onClick={() => remove(l.id)}>Remove</button>
            </div>
          </div>
          <b style={{ fontVariantNumeric: "tabular-nums" }}>{inr(l.qty * l.price)}</b>
        </div>
      ))}
    </>
  );
}

export default function CartDrawer() {
  const { lines, subtotal, drawer, setDrawer, freeAbove } = useStore();
  return (
    <aside className={`drawer${drawer === "bag" ? " on" : ""}`} aria-label="Shopping bag" aria-hidden={drawer !== "bag"}>
      <div className="dh"><h3>Your Bag</h3><button aria-label="Close bag" onClick={() => setDrawer(null)}>✕</button></div>
      <div className="db">
        {lines.length ? <><ShipBar subtotal={subtotal} freeAbove={freeAbove} /><Lines /></> : (
          <div className="empty"><p>Your bag is empty.</p><Link className="btn btn-dark" href="/collections/all" onClick={() => setDrawer(null)}>Shop bestsellers</Link></div>
        )}
      </div>
      {lines.length > 0 && (
        <div className="df">
          <div className="total"><span>Subtotal</span><b>{inr(subtotal)}</b></div>
          <small className="muted">Shipping and coupons are applied at checkout. Cash on Delivery available.</small>
          <Link className="btn btn-red" href="/checkout" onClick={() => setDrawer(null)}>Checkout securely</Link>
          <Link className="btn btn-ghost" href="/cart" onClick={() => setDrawer(null)}>View bag</Link>
        </div>
      )}
    </aside>
  );
}
