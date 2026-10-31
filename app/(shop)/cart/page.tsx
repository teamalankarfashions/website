"use client";
import Link from "next/link";
import { useStore } from "@/components/Store";
import { Lines, ShipBar } from "@/components/CartDrawer";
import { inr } from "@/lib/format";

export default function CartPage() {
  const { lines, subtotal, freeAbove } = useStore();
  return (
    <>
      <div className="phead"><div className="wrap"><h1>Your Bag</h1></div></div>
      <div className="wrap">
        {lines.length === 0 ? (
          <div className="empty"><p>Your bag is empty.</p><Link className="btn btn-dark" href="/collections/all">Shop jewellery</Link></div>
        ) : (
          <div className="two">
            <div><ShipBar subtotal={subtotal} freeAbove={freeAbove} /><Lines /></div>
            <aside className="summary">
              <div className="r"><span>Subtotal</span><b>{inr(subtotal)}</b></div>
              <div className="r"><span>Shipping</span><span>{subtotal >= freeAbove ? "Free" : "Calculated at checkout"}</span></div>
              <small className="muted">Have a coupon? Apply it at checkout.</small>
              <Link className="btn btn-red" href="/checkout">Checkout securely</Link>
              <Link className="btn btn-ghost" href="/collections/all">Continue shopping</Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
