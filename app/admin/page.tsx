"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { sb, useAdmin } from "./ui";
import { fmtDate, inr, PAY_LABEL, STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";

type Stats = { today_revenue: number; month_revenue: number; month_orders: number; to_ship: number; unpaid: number; customers: number; low_stock: { id: string; name: string; stock: number }[]; daily: { day: string; revenue: number }[]; top: { name: string; qty: number }[] };

export default function Dashboard() {
  const { email } = useAdmin();
  const [s, setS] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [setup, setSetup] = useState<{ razorpay: boolean; sample: number }>({ razorpay: true, sample: 0 });
  useEffect(() => {
    sb().rpc("admin_stats").then(({ data }) => setS(data as Stats));
    sb().from("orders").select("*").order("created_at", { ascending: false }).limit(8).then(({ data }) => setRecent((data ?? []) as Order[]));
    Promise.all([sb().rpc("secret_status"), sb().from("products").select("id", { count: "exact", head: true }).contains("tags", ["sample"])]).then(([a, b]) =>
      setSetup({ razorpay: !!(a.data as any)?.razorpay_key_secret, sample: b.count ?? 0 }));
  }, []);
  const max = Math.max(1, ...(s?.daily ?? []).map((d) => d.revenue));
  return (
    <>
      <div className="adm-top"><h1>Namaskar 🙏</h1><span className="muted">{email}</span></div>
      {(!setup.razorpay || setup.sample > 0) && (
        <div className="note" style={{ marginBottom: 20, display: "grid", gap: 6 }}>
          <b>Finish setting up your store</b>
          {!setup.razorpay && <span>• Add your Razorpay keys to accept online payments. <Link href="/admin/settings" style={{ textDecoration: "underline" }}>Open settings</Link></span>}
          {setup.sample > 0 && <span>• {setup.sample} sample products are live. Replace them with your own. <Link href="/admin/products?tag=sample" style={{ textDecoration: "underline" }}>Review samples</Link></span>}
        </div>
      )}
      <div className="kpis">
        <div className="kpi"><span>Today&apos;s sales</span><b>{s ? inr(s.today_revenue) : "—"}</b></div>
        <div className="kpi"><span>Last 30 days</span><b>{s ? inr(s.month_revenue) : "—"}</b></div>
        <div className="kpi"><span>Orders (30 days)</span><b>{s?.month_orders ?? "—"}</b></div>
        <Link href="/admin/orders?status=to_ship" className={`kpi${s && s.to_ship ? " alert" : ""}`}><span>To pack &amp; ship</span><b>{s?.to_ship ?? "—"}</b></Link>
        <div className="kpi"><span>Customers</span><b>{s?.customers ?? "—"}</b></div>
      </div>
      <div className="agrid">
        <div className="card2">
          <h2 className="sec-title">Sales, last 14 days</h2>
          <div className="chart">{(s?.daily ?? []).map((d) => <div key={d.day} style={{ height: `${(d.revenue / max) * 100}%` }}><span>{inr(d.revenue)}</span></div>)}</div>
          <div className="chart-x">{(s?.daily ?? []).map((d, i) => <span key={d.day}>{i % 2 === 0 ? new Date(d.day).getDate() : ""}</span>)}</div>
          <h2 className="sec-title" style={{ marginTop: 28 }}>Recent orders</h2>
          {recent.length === 0 ? <p className="muted">No orders yet. They&apos;ll appear here the moment a customer checks out.</p> : (
            <div className="tbl-wrap"><table className="tbl"><tbody>
              {recent.map((o) => (
                <tr key={o.id} className="click" onClick={() => (location.href = `/admin/orders/${o.id}`)}>
                  <td><b>{o.order_no}</b><br /><small className="muted">{fmtDate(o.created_at)}</small></td>
                  <td>{o.name}</td>
                  <td><span className={`pill ${o.status}`}>{STATUS_LABEL[o.status]}</span> <span className={`pill ${o.payment_status}`}>{PAY_LABEL[o.payment_status]}</span></td>
                  <td className="num">{inr(o.total)}</td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </div>
        <div style={{ display: "grid", gap: 20 }}>
          <div className="card2">
            <h2 className="sec-title">Low stock</h2>
            {s?.low_stock?.length ? s.low_stock.map((p) => <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><Link href={`/admin/products/${p.id}`}>{p.name}</Link><b style={{ color: p.stock ? "var(--warn)" : "var(--bad)" }}>{p.stock}</b></div>) : <p className="muted" style={{ margin: 0 }}>All products are well stocked.</p>}
          </div>
          <div className="card2">
            <h2 className="sec-title">Top sellers (30 days)</h2>
            {s?.top?.length ? s.top.map((t) => <div key={t.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>{t.name}</span><b>{t.qty}</b></div>) : <p className="muted" style={{ margin: 0 }}>No sales yet.</p>}
          </div>
          <div className="card2" style={{ display: "grid", gap: 10 }}>
            <h2 className="sec-title" style={{ margin: 0 }}>Quick actions</h2>
            <Link className="abtn pri" href="/admin/products/new">+ Add product</Link>
            <Link className="abtn" href="/admin/coupons">Create a coupon</Link>
            <Link className="abtn" href="/admin/content">Change homepage banners</Link>
          </div>
        </div>
      </div>
    </>
  );
}
