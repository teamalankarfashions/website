"use client";
import { useEffect, useState } from "react";
import { Field, sb, useAdmin } from "../ui";
import { api, SB_URL } from "@/lib/supabase";
import type { Commerce, Store } from "@/lib/types";

export default function Settings() {
  const { notify, can } = useAdmin();
  const [store, setStore] = useState<Store | null>(null);
  const [com, setCom] = useState<Commerce | null>(null);
  const [seo, setSeo] = useState({ title: "", description: "" });
  const [keys, setKeys] = useState<{ razorpay_key_id: string | null; razorpay_key_secret: boolean; razorpay_webhook_secret: boolean } | null>(null);
  const [kf, setKf] = useState({ id: "", secret: "", webhook: "" });
  const [busy, setBusy] = useState(false);
  const webhookUrl = `${SB_URL}/functions/v1/api?action=razorpay-webhook`;

  useEffect(() => {
    sb().from("settings").select("key,value").in("key", ["store", "commerce", "seo"]).then(({ data }) => {
      for (const r of data ?? []) { if (r.key === "store") setStore(r.value); if (r.key === "commerce") setCom(r.value); if (r.key === "seo") setSeo(r.value); }
    });
    sb().rpc("secret_status").then(({ data }) => setKeys(data as any));
  }, []);
  if (!store || !com) return <p className="muted">Loading…</p>;

  async function save() {
    setBusy(true);
    const now = new Date().toISOString();
    const r = await sb().from("settings").upsert([{ key: "store", value: store, updated_at: now }, { key: "commerce", value: com, updated_at: now }, { key: "seo", value: seo, updated_at: now }]);
    setBusy(false);
    r.error ? notify(r.error.message, true) : notify("Settings saved");
  }
  async function saveKeys() {
    const jobs: [string, string][] = [];
    if (kf.id.trim()) jobs.push(["razorpay_key_id", kf.id.trim()]);
    if (kf.secret.trim()) jobs.push(["razorpay_key_secret", kf.secret.trim()]);
    if (kf.webhook.trim()) jobs.push(["razorpay_webhook_secret", kf.webhook.trim()]);
    if (!jobs.length) return notify("Enter at least one key", true);
    if (kf.id && !/^rzp_(live|test)_/.test(kf.id.trim())) return notify("Key ID should start with rzp_live_ or rzp_test_", true);
    for (const [k, v] of jobs) { const { error } = await sb().rpc("set_secret", { p_key: k, p_value: v }); if (error) return notify(error.message, true); }
    setKf({ id: "", secret: "", webhook: "" });
    const { data } = await sb().rpc("secret_status"); setKeys(data as any);
    notify("Payment keys saved securely");
  }
  const S = (k: keyof Store) => ({ value: store[k] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setStore({ ...store, [k]: e.target.value }) });

  return (
    <>
      <div className="adm-top"><h1>Store settings</h1><button className="abtn pri" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</button></div>
      <div className="agrid">
        <div style={{ display: "grid", gap: 20 }}>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Shop details</h2>
            <div className="acols">
              <Field label="Shop name"><input {...S("name")} /></Field>
              <Field label="Tagline"><input {...S("tagline")} /></Field>
              <Field label="Phone (shown on site)"><input {...S("phone")} /></Field>
              <Field label="WhatsApp number" hint="With country code, digits only: 919657093006"><input {...S("whatsapp")} /></Field>
              <Field label="Email"><input {...S("email")} /></Field>
              <Field label="Opening hours" hint="e.g. Mon–Sun, 10:30 am – 9 pm"><input {...S("hours")} /></Field>
            </div>
            <Field label="Address"><textarea {...S("address")} style={{ minHeight: 60 }} /></Field>
            <div className="acols">
              <Field label="Google Maps link"><input {...S("map_url")} /></Field>
              <Field label="Instagram link"><input {...S("instagram")} /></Field>
              <Field label="Facebook link"><input {...S("facebook")} /></Field>
            </div>
          </div>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Shipping &amp; payment rules</h2>
            <div className="acols">
              <Field label="Free shipping above (₹)"><input type="number" value={com.free_shipping_above} onChange={(e) => setCom({ ...com, free_shipping_above: Number(e.target.value) })} /></Field>
              <Field label="Shipping fee below that (₹)"><input type="number" value={com.shipping_fee} onChange={(e) => setCom({ ...com, shipping_fee: Number(e.target.value) })} /></Field>
              <Field label="Extra COD fee (₹)"><input type="number" value={com.cod_fee} onChange={(e) => setCom({ ...com, cod_fee: Number(e.target.value) })} /></Field>
              <Field label="Max order value for COD (₹)"><input type="number" value={com.cod_max_order} onChange={(e) => setCom({ ...com, cod_max_order: Number(e.target.value) })} /></Field>
              <Field label="Low-stock warning at"><input type="number" value={com.low_stock_alert} onChange={(e) => setCom({ ...com, low_stock_alert: Number(e.target.value) })} /></Field>
              <Field label="Send new-order emails to"><input type="email" value={com.order_notify_email} onChange={(e) => setCom({ ...com, order_notify_email: e.target.value })} /></Field>
            </div>
            <label className="check"><input type="checkbox" checked={com.cod_enabled} onChange={(e) => setCom({ ...com, cod_enabled: e.target.checked })} /> Accept Cash on Delivery</label>
            <label className="check"><input type="checkbox" checked={com.online_enabled} onChange={(e) => setCom({ ...com, online_enabled: e.target.checked })} /> Accept online payments (Razorpay)</label>
          </div>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Google &amp; sharing</h2>
            <Field label="Homepage title" hint="Shown in Google and browser tabs. About 60 characters."><input value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} maxLength={70} /></Field>
            <Field label="Homepage description" hint="About 155 characters."><textarea value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} maxLength={170} style={{ minHeight: 70 }} /></Field>
          </div>
        </div>
        <div style={{ display: "grid", gap: 20 }}>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Razorpay keys</h2>
            <div style={{ fontSize: 14, display: "grid", gap: 4 }}>
              <span>Key ID: {keys?.razorpay_key_id ? <b>{keys.razorpay_key_id}</b> : <span className="muted">not set</span>}</span>
              <span>Key secret: {keys?.razorpay_key_secret ? <b style={{ color: "var(--ok)" }}>saved ✓</b> : <span className="muted">not set</span>}</span>
              <span>Webhook secret: {keys?.razorpay_webhook_secret ? <b style={{ color: "var(--ok)" }}>saved ✓</b> : <span className="muted">not set</span>}</span>
            </div>
            {can("owner") ? (
              <>
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>Find these in Razorpay Dashboard → Account &amp; Settings → API Keys. Secrets are stored privately on the server and never shown again.</p>
                <Field label="Key ID"><input value={kf.id} onChange={(e) => setKf({ ...kf, id: e.target.value })} placeholder="rzp_live_…" autoComplete="off" /></Field>
                <Field label="Key secret"><input type="password" value={kf.secret} onChange={(e) => setKf({ ...kf, secret: e.target.value })} autoComplete="new-password" /></Field>
                <Field label="Webhook secret (optional, recommended)" hint="In Razorpay → Webhooks, add the URL below with events payment.captured, order.paid, payment.failed, and set a secret."><input type="password" value={kf.webhook} onChange={(e) => setKf({ ...kf, webhook: e.target.value })} autoComplete="new-password" /></Field>
                <div className="note" style={{ wordBreak: "break-all", fontSize: 12.5 }}>Webhook URL: <b style={{ userSelect: "all" }}>{webhookUrl}</b></div>
                <button className="abtn dark" onClick={saveKeys}>Save keys</button>
              </>
            ) : <p className="muted" style={{ margin: 0 }}>Only the store owner can change payment keys.</p>}
          </div>
          <div className="card2 aform">
            <h2 className="sec-title" style={{ margin: 0 }}>Emails</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Order confirmations, shipping updates, login codes and welcome emails are sent automatically from orders@alankarfashions.com.</p>
            <button className="abtn" onClick={async () => { const r = await api("admin-test-email"); r.ok ? notify("Test email sent to your inbox") : notify(r.error ?? "Failed", true); }}>Send me a test email</button>
          </div>
        </div>
      </div>
    </>
  );
}
