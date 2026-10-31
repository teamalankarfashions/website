"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Field, sb, useAdmin } from "../../ui";
import { api } from "@/lib/supabase";
import { fmtDate, inr, PAY_LABEL, STATUS_LABEL, waLink } from "@/lib/format";
import type { Order } from "@/lib/types";

const NEXT: Record<string, string[]> = { pending: ["confirmed", "cancelled"], confirmed: ["packed", "shipped", "cancelled"], packed: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [] };

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { notify, can } = useAdmin();
  const [o, setO] = useState<Order | null>(null);
  const [events, setEvents] = useState<{ status: string; note: string | null; actor: string | null; created_at: string }[]>([]);
  const [ship, setShip] = useState({ courier: "", tracking_number: "", tracking_url: "", admin_notes: "" });
  const [notifyCust, setNotifyCust] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [{ data }, { data: ev }] = await Promise.all([sb().from("orders").select("*").eq("id", id).single(), sb().from("order_events").select("*").eq("order_id", id).order("created_at")]);
    if (data) { setO(data as Order); setShip({ courier: data.courier ?? "", tracking_number: data.tracking_number ?? "", tracking_url: data.tracking_url ?? "", admin_notes: data.admin_notes ?? "" }); }
    setEvents(ev ?? []);
  }
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  async function update(patch: Record<string, unknown>, msg: string) {
    setBusy(true);
    const r = await api("admin-order-update", { order_id: id, notify: notifyCust, ...ship, ...patch });
    setBusy(false);
    if (r.ok) { notify(msg); load(); } else notify(r.error ?? "Update failed", true);
  }
  if (!o) return <p className="muted">Loading…</p>;
  const a = o.address;
  const fullAddr = `${o.name}\n${a.line1}${a.line2 ? ", " + a.line2 : ""}\n${a.city}, ${a.state} ${a.pincode}\n${o.phone}`;
  return (
    <>
      <div className="adm-top">
        <div><Link href="/admin/orders" className="muted">← Orders</Link><h1>{o.order_no}</h1><span className="muted">{fmtDate(o.created_at)}</span></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className={`pill ${o.status}`}>{STATUS_LABEL[o.status]}</span><span className={`pill ${o.payment_status}`}>{PAY_LABEL[o.payment_status]}</span>
        </div>
      </div>
      <div className="agrid">
        <div style={{ display: "grid", gap: 20 }}>
          <div className="card2">
            <h2 className="sec-title">Items</h2>
            <div className="tbl-wrap" style={{ border: 0 }}><table className="tbl"><tbody>
              {o.items.map((i) => (
                <tr key={i.id}><td style={{ width: 56 }}>{i.image && <img className="thumb" src={i.image} alt="" />}</td><td><Link href={`/products/${i.slug}`} target="_blank">{i.name}</Link><br /><small className="muted">{i.sku}</small></td><td className="num">{inr(i.price)} × {i.qty}</td><td className="num"><b>{inr(i.price * i.qty)}</b></td></tr>
              ))}
              <tr><td colSpan={3}>Subtotal</td><td className="num">{inr(o.subtotal)}</td></tr>
              {o.discount > 0 && <tr><td colSpan={3}>Discount ({o.coupon_code})</td><td className="num">−{inr(o.discount)}</td></tr>}
              <tr><td colSpan={3}>Shipping</td><td className="num">{o.shipping ? inr(o.shipping) : "Free"}</td></tr>
              {o.cod_fee > 0 && <tr><td colSpan={3}>COD fee</td><td className="num">{inr(o.cod_fee)}</td></tr>}
              <tr><td colSpan={3}><b>Total</b> · {o.payment_method === "cod" ? "Cash on Delivery" : "Razorpay"}</td><td className="num"><b>{inr(o.total)}</b></td></tr>
            </tbody></table></div>
            {o.notes && <p className="note" style={{ marginTop: 12 }}><b>Customer note:</b> {o.notes}</p>}
          </div>

          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Update order</h2>
            <div className="acols">
              <Field label="Courier"><input value={ship.courier} onChange={(e) => setShip({ ...ship, courier: e.target.value })} placeholder="e.g. Delhivery, India Post" /></Field>
              <Field label="Tracking number"><input value={ship.tracking_number} onChange={(e) => setShip({ ...ship, tracking_number: e.target.value })} /></Field>
            </div>
            <Field label="Tracking link" hint="Paste the courier's tracking page link. It's included in the 'shipped' email."><input value={ship.tracking_url} onChange={(e) => setShip({ ...ship, tracking_url: e.target.value })} placeholder="https://" /></Field>
            <Field label="Internal note (only your team sees this)"><textarea value={ship.admin_notes} onChange={(e) => setShip({ ...ship, admin_notes: e.target.value })} style={{ minHeight: 70 }} /></Field>
            <label className="check"><input type="checkbox" checked={notifyCust} onChange={(e) => setNotifyCust(e.target.checked)} /> Email the customer about status changes</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {NEXT[o.status].map((s) => (
                <button key={s} className={`abtn ${s === "cancelled" ? "danger" : "pri"}`} disabled={busy} onClick={() => update({ status: s }, `Marked ${STATUS_LABEL[s].toLowerCase()}`)}>
                  {s === "cancelled" ? "Cancel order" : `Mark ${STATUS_LABEL[s].toLowerCase()}`}
                </button>
              ))}
              <button className="abtn" disabled={busy} onClick={() => update({}, "Saved")}>Save details</button>
            </div>
            {can("manager") && o.payment_method === "cod" && o.payment_status !== "paid" && o.status === "delivered" && (
              <button className="abtn" onClick={() => update({ payment_status: "paid" }, "COD marked as collected")}>Mark COD cash collected</button>
            )}
            {can("manager") && o.payment_status === "paid" && o.status === "cancelled" && (
              <button className="abtn" onClick={() => update({ payment_status: "refunded" }, "Marked refunded")}>Mark refunded (after refunding in Razorpay)</button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div className="card2" style={{ display: "grid", gap: 8 }}>
            <h2 className="sec-title" style={{ margin: 0 }}>Customer</h2>
            <b>{o.name}</b>
            <span style={{ userSelect: "all" }}>{o.phone}</span>
            <span style={{ userSelect: "all", wordBreak: "break-all" }}>{o.email}</span>
            <a className="abtn sm" href={waLink(o.phone.replace(/\D/g, "").slice(-10).padStart(12, "91"), `Hi ${o.name.split(" ")[0]}, this is Alankar Fashions about your order ${o.order_no}.`)} target="_blank" rel="noopener">WhatsApp customer</a>
          </div>
          <div className="card2" style={{ display: "grid", gap: 8 }}>
            <h2 className="sec-title" style={{ margin: 0 }}>Shipping address</h2>
            <pre style={{ margin: 0, font: "inherit", whiteSpace: "pre-wrap", userSelect: "all" }}>{fullAddr}</pre>
            <button className="abtn sm" onClick={() => navigator.clipboard?.writeText(fullAddr).then(() => notify("Address copied"), () => notify("Select the address and copy it", true))}>Copy address</button>
          </div>
          <div className="card2">
            <h2 className="sec-title">History</h2>
            <ol className="timeline">{events.map((e, i) => <li key={i} className="done"><span /><div><b>{STATUS_LABEL[e.status] ?? e.status}</b><div className="muted" style={{ fontSize: 13 }}>{fmtDate(e.created_at)}{e.actor ? ` · ${e.actor}` : ""}</div>{e.note && <div style={{ fontSize: 13 }}>{e.note}</div>}</div></li>)}</ol>
            {o.razorpay_payment_id && <small className="muted">Razorpay payment: {o.razorpay_payment_id}</small>}
          </div>
        </div>
      </div>
    </>
  );
}
