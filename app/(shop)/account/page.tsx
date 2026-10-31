"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import OtpLogin from "@/components/OtpLogin";
import { fmtDay, inr, PAY_LABEL, STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function Account() {
  const sb = browserClient();
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prof, setProf] = useState({ name: "", phone: "" });
  const [saved, setSaved] = useState(false);

  async function load() {
    const { data } = await sb.auth.getSession();
    const u = data.session?.user;
    setEmail(u?.email ?? null);
    if (!u) return;
    const [{ data: o }, { data: p }] = await Promise.all([
      sb.from("orders").select("*").eq("user_id", u.id).order("created_at", { ascending: false }),
      sb.from("profiles").select("name,phone").eq("id", u.id).maybeSingle(),
    ]);
    setOrders((o ?? []) as Order[]); if (p) setProf({ name: p.name ?? "", phone: p.phone ?? "" });
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  if (email === undefined) return <div className="wrap" style={{ minHeight: "50vh" }} />;
  if (!email) return <div className="wrap"><OtpLogin purpose="customer" onDone={load} title="Sign in" subtitle="Enter your email and we'll send you a one-time code. No password needed." /></div>;

  return (
    <>
      <div className="phead"><div className="wrap"><h1>My account</h1><p>Signed in as {email}. <button style={{ textDecoration: "underline" }} onClick={async () => { await sb.auth.signOut(); setEmail(null); }}>Sign out</button></p></div></div>
      <div className="wrap two">
        <div>
          <h2 style={{ fontSize: 26, marginBottom: 18 }}>Orders</h2>
          {orders.length === 0 ? <div className="panel"><p style={{ margin: 0 }}>No orders yet. Orders placed with this email while signed in will appear here.</p><p><Link className="link-u" href="/collections/all">Start shopping</Link></p></div> : (
            <div className="olist">
              {orders.map((o) => (
                <div className="orow" key={o.id}>
                  <div>
                    <b>{o.order_no}</b> <span className="muted">· {fmtDay(o.created_at)}</span>
                    <div className="muted" style={{ fontSize: 14 }}>{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}><span className={`pill ${o.status}`}>{STATUS_LABEL[o.status]}</span><span className={`pill ${o.payment_status}`}>{PAY_LABEL[o.payment_status]}</span></div>
                  </div>
                  <div style={{ textAlign: "right" }}><b>{inr(o.total)}</b><br /><Link className="link-u" href={`/track-order?order=${o.order_no}&c=${encodeURIComponent(o.email)}`}>Track</Link></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <aside className="summary">
          <h3 style={{ fontSize: 22 }}>Your details</h3>
          <div className="field"><label htmlFor="pn">Name</label><input id="pn" className="input" value={prof.name} onChange={(e) => setProf({ ...prof, name: e.target.value })} /></div>
          <div className="field"><label htmlFor="pp">Mobile</label><input id="pp" className="input" value={prof.phone} onChange={(e) => setProf({ ...prof, phone: e.target.value })} /></div>
          <button className="btn btn-dark" onClick={async () => { const { data } = await sb.auth.getUser(); if (data.user) { await sb.from("profiles").update(prof).eq("id", data.user.id); setSaved(true); setTimeout(() => setSaved(false), 2000); } }}>{saved ? "Saved" : "Save details"}</button>
        </aside>
      </div>
    </>
  );
}
