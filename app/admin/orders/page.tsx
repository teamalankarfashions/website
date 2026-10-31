"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sb } from "../ui";
import { fmtDate, inr, PAY_LABEL, STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";

function Inner() {
  const sp = useSearchParams();
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [pay, setPay] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Order[] | null>(null);
  useEffect(() => {
    let query = sb().from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (status === "to_ship") query = query.in("status", ["confirmed", "packed"]);
    else if (status) query = query.eq("status", status);
    if (pay) query = query.eq("payment_status", pay);
    if (q.trim()) { const t = q.trim().replace(/[%,()]/g, ""); query = query.or(`order_no.ilike.%${t}%,name.ilike.%${t}%,phone.ilike.%${t}%,email.ilike.%${t}%`); }
    const h = setTimeout(() => query.then(({ data }) => setRows((data ?? []) as Order[])), 250);
    return () => clearTimeout(h);
  }, [status, pay, q]);

  function exportCsv() {
    if (!rows?.length) return;
    const head = ["Order", "Date", "Name", "Phone", "Email", "City", "Pincode", "Items", "Total", "Payment", "Status", "Tracking"];
    const lines = rows.map((o) => [o.order_no, fmtDate(o.created_at), o.name, o.phone, o.email, o.address.city, o.address.pincode, o.items.map((i) => `${i.name} x${i.qty}`).join("; "), o.total, PAY_LABEL[o.payment_status], STATUS_LABEL[o.status], o.tracking_number ?? ""]);
    const csv = [head, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `alankar-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  return (
    <>
      <div className="adm-top"><h1>Orders</h1><button className="abtn" onClick={exportCsv}>Export CSV</button></div>
      <div className="filters">
        <input placeholder="Search order no, name, phone, email" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: "1 1 260px" }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option><option value="to_ship">To pack &amp; ship</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Payment">
          <option value="">All payments</option>{Object.entries(PAY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Status</th><th>Payment</th><th className="num">Total</th></tr></thead>
          <tbody>
            {rows === null ? <tr><td colSpan={6} className="muted">Loading…</td></tr> : rows.length === 0 ? <tr><td colSpan={6} className="muted">No orders match.</td></tr> :
              rows.map((o) => (
                <tr key={o.id} className="click" onClick={() => (location.href = `/admin/orders/${o.id}`)}>
                  <td><b>{o.order_no}</b><br /><small className="muted">{fmtDate(o.created_at)}</small></td>
                  <td>{o.name}<br /><small className="muted">{o.phone} · {o.address.city}</small></td>
                  <td style={{ maxWidth: 260 }}><small>{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</small></td>
                  <td><span className={`pill ${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                  <td><span className={`pill ${o.payment_status}`}>{PAY_LABEL[o.payment_status]}</span></td>
                  <td className="num"><b>{inr(o.total)}</b></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
export default function Orders() { return <Suspense><Inner /></Suspense>; }
