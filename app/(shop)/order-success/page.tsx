import Link from "next/link";
import type { Metadata } from "next";
import { IconCheck } from "@/components/Icons";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function Success({ searchParams }: { searchParams: Promise<{ no?: string; m?: string }> }) {
  const { no, m } = await searchParams;
  return (
    <div className="wrap">
      <div className="success">
        <div className="tick"><IconCheck /></div>
        <h1 style={{ fontSize: "clamp(30px,4vw,44px)" }}>Thank you! Your order is confirmed.</h1>
        {no && <p style={{ fontSize: 18, margin: 0 }}>Order number <b>{no}</b></p>}
        <p className="muted" style={{ margin: 0 }}>
          {m === "cod" ? "Please keep the amount ready in cash or UPI when your order arrives." : "Your payment was successful."} We&apos;ve emailed you the details and will send a tracking link when it ships.
        </p>
        <div className="ctas" style={{ justifyContent: "center" }}>
          {no && <Link className="btn btn-dark" href={`/track-order?order=${no}`}>Track order</Link>}
          <Link className="btn btn-ghost" href="/collections/all">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
