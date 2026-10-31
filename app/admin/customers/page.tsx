"use client";
import { useEffect, useState } from "react";
import { sb } from "../ui";
import { fmtDate, fmtDay, inr, waLink } from "@/lib/format";

type Cust = { email: string; name: string; phone: string; city: string; orders: number; spent: number; last: string };

export default function Customers() {
  const [tab, setTab] = useState<"customers" | "messages" | "subscribers">("customers");
  const [cust, setCust] = useState<Cust[]>([]);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    sb().from("orders").select("email,name,phone,address,total,status,payment_status,created_at").order("created_at", { ascending: false }).limit(2000).then(({ data }) => {
      const m = new Map<string, Cust>();
      for (const o of data ?? []) {
        const k = o.email.toLowerCase();
        const c = m.get(k) ?? { email: k, name: o.name, phone: o.phone, city: o.address?.city ?? "", orders: 0, spent: 0, last: o.created_at };
        if (o.status !== "cancelled" && ["paid", "cod"].includes(o.payment_status)) { c.orders++; c.spent += o.total; }
        m.set(k, c);
      }
      setCust([...m.values()]);
    });
    sb().from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setMsgs(data ?? []));
    sb().from("newsletter").select("*").order("created_at", { ascending: false }).limit(2000).then(({ data }) => setSubs(data ?? []));
  }, []);
  const csv = (rows: (string | number)[][], name: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }));
    a.download = name; a.click();
  };
  const filtered = cust.filter((c) => !q || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="adm-top"><h1>Customers &amp; messages</h1></div>
      <div className="tabs" style={{ marginBottom: 16, width: "max-content", maxWidth: "100%" }}>
        <button aria-selected={tab === "customers"} onClick={() => setTab("customers")}>Customers ({cust.length})</button>
        <button aria-selected={tab === "messages"} onClick={() => setTab("messages")}>Messages ({msgs.filter((m) => !m.handled).length} new)</button>
        <button aria-selected={tab === "subscribers"} onClick={() => setTab("subscribers")}>Subscribers ({subs.length})</button>
      </div>
      {tab === "customers" && (
        <>
          <div className="filters"><input placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: "1 1 260px" }} /><button className="abtn" onClick={() => csv([["Name", "Email", "Phone", "City", "Orders", "Spent", "Last order"], ...filtered.map((c) => [c.name, c.email, c.phone, c.city, c.orders, c.spent, fmtDay(c.last)])], "alankar-customers.csv")}>Export CSV</button></div>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Customer</th><th>City</th><th className="num">Orders</th><th className="num">Spent</th><th>Last order</th><th /></tr></thead>
            <tbody>{filtered.length === 0 ? <tr><td colSpan={6} className="muted">Customers appear here after their first order.</td></tr> : filtered.map((c) => (
              <tr key={c.email}><td><b>{c.name}</b><br /><small className="muted">{c.email} · {c.phone}</small></td><td>{c.city}</td><td className="num">{c.orders}</td><td className="num">{inr(c.spent)}</td><td>{fmtDay(c.last)}</td>
                <td><a className="abtn sm" href={waLink(c.phone.replace(/\D/g, "").slice(-10).padStart(12, "91"), `Hi ${c.name.split(" ")[0]}, this is Alankar Fashions.`)} target="_blank" rel="noopener">WhatsApp</a></td></tr>
            ))}</tbody>
          </table></div>
        </>
      )}
      {tab === "messages" && (
        <div style={{ display: "grid", gap: 12 }}>
          {msgs.length === 0 ? <p className="muted">No messages yet.</p> : msgs.map((m) => (
            <div key={m.id} className="card2" style={{ opacity: m.handled ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><b>{m.name}</b><small className="muted">{fmtDate(m.created_at)}</small></div>
              <small className="muted">{m.phone} {m.email}</small>
              <p style={{ whiteSpace: "pre-wrap" }}>{m.message}</p>
              <div style={{ display: "flex", gap: 8 }}>
                {m.phone && <a className="abtn sm" href={waLink(m.phone.replace(/\D/g, "").slice(-10).padStart(12, "91"), `Hi ${m.name}, thank you for contacting Alankar Fashions.`)} target="_blank" rel="noopener">Reply on WhatsApp</a>}
                <button className="abtn sm" onClick={async () => { await sb().from("contact_messages").update({ handled: !m.handled }).eq("id", m.id); setMsgs(msgs.map((x) => (x.id === m.id ? { ...x, handled: !x.handled } : x))); }}>{m.handled ? "Mark as new" : "Mark done"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === "subscribers" && (
        <>
          <div className="filters"><button className="abtn" onClick={() => csv([["Email", "Joined", "Source"], ...subs.map((s) => [s.email, fmtDay(s.created_at), s.source ?? ""])], "alankar-subscribers.csv")}>Export CSV</button></div>
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Email</th><th>Joined</th><th>From</th></tr></thead>
            <tbody>{subs.length === 0 ? <tr><td colSpan={3} className="muted">No subscribers yet.</td></tr> : subs.map((s) => <tr key={s.email}><td>{s.email}</td><td>{fmtDay(s.created_at)}</td><td>{s.source}</td></tr>)}</tbody></table></div>
        </>
      )}
    </>
  );
}
