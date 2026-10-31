"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import { fmtDate, inr, STATUS_LABEL } from "@/lib/format";

type T = { order_no: string; status: string; payment_status: string; payment_method: string; total: number; created_at: string; courier: string | null; tracking_number: string | null; tracking_url: string | null; items: { name: string; qty: number; image: string | null }[]; events: { status: string; at: string }[] | null };
const STEPS = ["confirmed", "packed", "shipped", "delivered"];

function Inner() {
  const sp = useSearchParams();
  const [no, setNo] = useState(sp.get("order") ?? ""); const [c, setC] = useState(sp.get("c") ?? "");
  const [res, setRes] = useState<T | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function look(e?: React.FormEvent) {
    e?.preventDefault(); setErr(""); setRes(null);
    if (!no.trim() || !c.trim()) return setErr("Enter your order number and the email or mobile number used for the order.");
    setBusy(true);
    const { data, error } = await browserClient().rpc("track_order", { p_order_no: no, p_contact: c });
    setBusy(false);
    if (error || !data) return setErr("We couldn't find that order. Check the order number and email or phone.");
    setRes(data as T);
  }
  useEffect(() => { if (sp.get("order") && sp.get("c")) look(); }, []); // eslint-disable-line
  const reached = (s: string) => res && (res.status === s || STEPS.indexOf(res.status) > STEPS.indexOf(s));
  const when = (s: string) => res?.events?.find((e) => e.status === s)?.at;
  return (
    <>
      <div className="phead"><div className="wrap"><h1>Track your order</h1><p>Your order number starts with ALK and is in your confirmation email.</p></div></div>
      <div className="wrap two">
        <div>
          {res ? (
            <div className="panel" style={{ display: "grid", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div><b style={{ fontSize: 20 }}>{res.order_no}</b><div className="muted" style={{ fontSize: 14 }}>Placed {fmtDate(res.created_at)} · {inr(res.total)} · {res.payment_method === "cod" ? "Cash on Delivery" : "Paid online"}</div></div>
                <span className={`pill ${res.status}`}>{STATUS_LABEL[res.status]}</span>
              </div>
              {res.status === "cancelled" ? <p className="err">This order was cancelled.</p> : res.status === "pending" ? <p>We&apos;re waiting for your payment to go through. If money was deducted, WhatsApp us with your order number.</p> : (
                <ol className="timeline">
                  {STEPS.map((s) => <li key={s} className={reached(s) ? "done" : ""}><span /><div><b>{STATUS_LABEL[s]}</b>{when(s) && <div className="muted" style={{ fontSize: 13 }}>{fmtDate(when(s)!)}</div>}</div></li>)}
                </ol>
              )}
              {(res.tracking_number || res.tracking_url) && (
                <div className="panel" style={{ background: "var(--pearl)" }}>
                  <b>{res.courier ?? "Courier"}</b> · Tracking no. <span style={{ userSelect: "all" }}>{res.tracking_number}</span>
                  {res.tracking_url && <p style={{ margin: "10px 0 0" }}><a className="btn btn-dark" href={res.tracking_url} target="_blank" rel="noopener">Track with courier</a></p>}
                </div>
              )}
              <div>{res.items.map((i, k) => <div key={k} className="muted" style={{ fontSize: 14 }}>{i.name} × {i.qty}</div>)}</div>
            </div>
          ) : <div className="panel"><p style={{ margin: 0 }} className="muted">Enter your details to see the latest status of your order.</p></div>}
        </div>
        <form className="summary" onSubmit={look}>
          <div className="field"><label htmlFor="ono">Order number</label><input id="ono" className="input" value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} placeholder="ALK1001" /></div>
          <div className="field"><label htmlFor="oc">Email or mobile</label><input id="oc" className="input" value={c} onChange={(e) => setC(e.target.value)} /></div>
          {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
          <button className="btn btn-red" disabled={busy}>{busy ? "Looking up…" : "Track order"}</button>
        </form>
      </div>
    </>
  );
}
export default function Track() { return <Suspense><Inner /></Suspense>; }
