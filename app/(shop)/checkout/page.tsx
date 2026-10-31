"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/Store";
import { api, browserClient } from "@/lib/supabase";
import { inr, INDIAN_STATES } from "@/lib/format";

type Quote = { subtotal: number; discount: number; shipping: number; cod_fee: number; total: number; coupon: string | null };
declare global { interface Window { Razorpay?: any } }

function loadRazorpay() {
  return new Promise<boolean>((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { lines, clear } = useStore();
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "Maharashtra", pincode: "", notes: "" });
  const [method, setMethod] = useState<"cod" | "razorpay">("cod");
  const [coupon, setCoupon] = useState(""); const [applied, setApplied] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [qErr, setQErr] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const items = useMemo(() => lines.map((l) => ({ id: l.id, qty: l.qty })), [lines]);

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem("alk-addr") || "null"); if (saved) setF((x) => ({ ...x, ...saved, notes: "" })); } catch {}
    browserClient().auth.getSession().then(async ({ data }) => {
      const u = data.session?.user; if (!u) return;
      setF((x) => ({ ...x, email: x.email || u.email || "" }));
      const { data: prof } = await browserClient().from("profiles").select("name,phone,address").eq("id", u.id).maybeSingle();
      if (prof) setF((x) => ({ ...x, name: x.name || prof.name || "", phone: x.phone || prof.phone || "", ...(prof.address && !x.line1 ? prof.address : {}) }));
    });
  }, []);

  useEffect(() => {
    if (!items.length) return;
    let alive = true;
    api<Quote>("quote", { items, coupon: applied || null, method }).then((r) => {
      if (!alive) return;
      if (r.ok) { setQuote(r); setQErr(""); } else { setQErr(r.error ?? ""); if (applied) { setApplied(""); } }
    });
    return () => { alive = false; };
  }, [items, applied, method]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function place(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, "").slice(-10))) return setErr("Enter a valid 10-digit mobile number.");
    if (!/^\d{6}$/.test(f.pincode)) return setErr("Enter a valid 6-digit pincode.");
    setBusy(true);
    try { localStorage.setItem("alk-addr", JSON.stringify({ ...f, notes: undefined })); } catch {}
    const r = await api<any>("checkout", {
      items, method, coupon: applied || null, notes: f.notes,
      customer: { name: f.name, email: f.email, phone: f.phone },
      address: { line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode },
    });
    if (!r.ok) { setBusy(false); return setErr(r.error ?? "Could not place the order."); }
    if (r.method === "cod") { clear(); router.push(`/order-success?no=${r.order_no}&m=cod`); return; }
    if (!(await loadRazorpay())) { setBusy(false); return setErr("Couldn't load the payment window. Check your connection and try again."); }
    const rz = new window.Razorpay({
      key: r.razorpay.key, order_id: r.razorpay.order_id, amount: r.razorpay.amount, currency: "INR",
      name: "Alankar Fashions", description: `Order ${r.order_no}`, image: "/brand/icon.png",
      prefill: { name: f.name, email: f.email, contact: f.phone }, theme: { color: "#5C0A12" },
      handler: async (resp: any) => {
        const v = await api("verify-payment", { order_id: r.order_id, ...resp });
        if (v.ok) { clear(); router.push(`/order-success?no=${r.order_no}&m=paid`); }
        else { setBusy(false); setErr(`Payment received but not verified yet. Please WhatsApp us with order ${r.order_no}.`); }
      },
      modal: { ondismiss: () => { setBusy(false); setErr("Payment was cancelled. You can try again or choose Cash on Delivery."); } },
    });
    rz.on("payment.failed", () => { setBusy(false); setErr("Payment failed. Try again or choose Cash on Delivery."); });
    rz.open();
  }

  if (!lines.length) return (
    <div className="wrap"><div className="empty"><h1 style={{ fontSize: 32 }}>Your bag is empty</h1><Link className="btn btn-dark" href="/collections/all">Shop jewellery</Link></div></div>
  );

  return (
    <>
      <div className="phead"><div className="wrap"><nav className="crumbs"><Link href="/cart">Bag</Link><span>/</span><span>Checkout</span></nav><h1>Checkout</h1></div></div>
      <form className="wrap two" onSubmit={place} noValidate={false}>
        <div>
          <fieldset className="fs">
            <legend>Contact</legend>
            <div className="field"><label htmlFor="name">Full name</label><input id="name" className="input" required value={f.name} onChange={set("name")} autoComplete="name" /></div>
            <div className="grid2">
              <div className="field"><label htmlFor="phone">Mobile number</label><input id="phone" className="input" required inputMode="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="10-digit mobile" /></div>
              <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" className="input" required value={f.email} onChange={set("email")} autoComplete="email" placeholder="For order updates" /></div>
            </div>
          </fieldset>
          <fieldset className="fs">
            <legend>Delivery address</legend>
            <div className="field"><label htmlFor="line1">House / flat, street</label><input id="line1" className="input" required value={f.line1} onChange={set("line1")} autoComplete="address-line1" /></div>
            <div className="field"><label htmlFor="line2">Area, landmark (optional)</label><input id="line2" className="input" value={f.line2} onChange={set("line2")} autoComplete="address-line2" /></div>
            <div className="grid2">
              <div className="field"><label htmlFor="city">City</label><input id="city" className="input" required value={f.city} onChange={set("city")} autoComplete="address-level2" /></div>
              <div className="field"><label htmlFor="pincode">Pincode</label><input id="pincode" className="input" required inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value.replace(/\D/g, "") })} autoComplete="postal-code" /></div>
            </div>
            <div className="field"><label htmlFor="state">State</label><select id="state" className="select" value={f.state} onChange={set("state")}>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label htmlFor="notes">Gift note or delivery instructions (optional)</label><textarea id="notes" className="textarea" maxLength={500} value={f.notes} onChange={set("notes")} /></div>
          </fieldset>
          <fieldset className="fs">
            <legend>Payment</legend>
            <div className="paybox">
              <label className="payopt"><input type="radio" name="pay" checked={method === "cod"} onChange={() => setMethod("cod")} /><span><b>Cash on Delivery</b><small>Pay in cash or UPI when your order arrives.</small></span></label>
              <label className="payopt"><input type="radio" name="pay" checked={method === "razorpay"} onChange={() => setMethod("razorpay")} /><span><b>Pay online</b><small>UPI, cards, net banking and wallets, secured by Razorpay.</small></span></label>
            </div>
          </fieldset>
        </div>
        <aside className="summary">
          <h3 style={{ fontSize: 22 }}>Order summary</h3>
          {lines.map((l) => (
            <div key={l.id} className="r" style={{ gap: 12 }}><span>{l.name} <span className="muted">× {l.qty}</span></span><span>{inr(l.price * l.qty)}</span></div>
          ))}
          <div className="coupon">
            <label htmlFor="coupon" className="sr">Coupon code</label>
            <input id="coupon" className="input" placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
            <button type="button" className="btn btn-ghost" style={{ padding: "0 16px" }} onClick={() => setApplied(coupon.trim())}>Apply</button>
          </div>
          {qErr && <span className="err">{qErr}</span>}
          {quote && (
            <>
              <div className="r"><span>Subtotal</span><span>{inr(quote.subtotal)}</span></div>
              {quote.discount > 0 && <div className="r" style={{ color: "var(--ok)" }}><span>Discount ({quote.coupon})</span><span>−{inr(quote.discount)}</span></div>}
              <div className="r"><span>Shipping</span><span>{quote.shipping ? inr(quote.shipping) : "Free"}</span></div>
              {quote.cod_fee > 0 && <div className="r"><span>COD fee</span><span>{inr(quote.cod_fee)}</span></div>}
              <div className="r big"><span>Total</span><span>{inr(quote.total)}</span></div>
            </>
          )}
          {err && <p className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
          <button className="btn btn-red" type="submit" disabled={busy || !quote}>{busy ? "Placing order…" : method === "cod" ? `Place order${quote ? " · " + inr(quote.total) : ""}` : `Pay ${quote ? inr(quote.total) : ""}`}</button>
          <small className="muted">By placing this order you agree to our <Link href="/terms-and-conditions" style={{ textDecoration: "underline" }}>terms</Link> and <Link href="/return-policy" style={{ textDecoration: "underline" }}>returns policy</Link>.</small>
        </aside>
      </form>
    </>
  );
}
