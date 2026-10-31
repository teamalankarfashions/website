// Alankar Fashions — store API (Supabase Edge Function)
// One function, routed by `action`. All prices are recomputed on the server.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND = Deno.env.get("RESEND_API_KEY") ?? "";
const SITE = Deno.env.get("SITE_URL") ?? "https://alankarfashions.com";
const FROM = Deno.env.get("MAIL_FROM") ?? "Alankar Fashions <orders@alankarfashions.com>";
const LOGO = "https://cdn.jsdelivr.net/gh/teamalankarfashions/website@main/public/brand/logo-red.png";

const db = createClient(SB_URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fail = (error: string, status = 400) => json({ ok: false, error }, status);

const emailOk = (e: unknown): e is string => typeof e === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && e.length < 200;
const inr = (n: number) => "₹" + Number(n).toLocaleString("en-IN");
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function setting<T = Record<string, unknown>>(key: string): Promise<T> {
  const { data } = await db.from("settings").select("value").eq("key", key).maybeSingle();
  return (data?.value ?? {}) as T;
}
async function secret(key: string) {
  const { data } = await db.rpc("service_get_secret", { p_key: key });
  return (data as string | null) ?? "";
}
async function userFromReq(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || token.split(".").length !== 3) return null;
  const { data } = await db.auth.getUser(token);
  return data.user ?? null;
}
async function adminFromReq(req: Request, min: "staff" | "manager" | "owner" = "staff") {
  const user = await userFromReq(req);
  if (!user?.email) return null;
  const { data } = await db.from("admin_users").select("email,role,active").eq("email", user.email.toLowerCase()).maybeSingle();
  if (!data?.active) return null;
  const rank = { staff: 1, manager: 2, owner: 3 } as const;
  return rank[data.role as keyof typeof rank] >= rank[min] ? { email: data.email, role: data.role } : null;
}

// ---------------- EMAIL ----------------
function shell(title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#F3ECE7;font-family:Helvetica,Arial,sans-serif;color:#1E1416">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3ECE7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBF7F4;border:1px solid #E2D4CC">
<tr><td style="background:#5C0A12;height:6px;font-size:0">&nbsp;</td></tr>
<tr><td align="center" style="padding:28px 24px 8px"><img src="${LOGO}" alt="Alankar Fashions" width="180" style="display:block;width:180px;height:auto"></td></tr>
<tr><td style="padding:8px 32px 8px"><h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:16px 0 8px;color:#1E1416">${title}</h1></td></tr>
<tr><td style="padding:0 32px 28px;font-size:15px;line-height:1.6">${inner}</td></tr>
<tr><td style="background:#1E1416;color:#CDBFB8;padding:20px 32px;font-size:12px;line-height:1.6">Alankar Fashions · Mangalwar Peth, Kolhapur 416012<br>WhatsApp +91 96570 93006 · hello@alankarfashions.com</td></tr>
</table></td></tr></table></body></html>`;
}
const btn = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="background:#B0141E;color:#fff;text-decoration:none;padding:13px 22px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;display:inline-block">${label}</a></p>`;

function orderTable(o: Record<string, any>) {
  const rows = (o.items as any[]).map((i) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #E2D4CC">${esc(i.name)} <span style="color:#6E5E5F">× ${i.qty}</span></td><td align="right" style="padding:10px 0;border-bottom:1px solid #E2D4CC">${inr(i.price * i.qty)}</td></tr>`).join("");
  const line = (k: string, v: string, b = false) => `<tr><td style="padding:4px 0;${b ? "font-weight:bold" : "color:#6E5E5F"}">${k}</td><td align="right" style="padding:4px 0;${b ? "font-weight:bold" : ""}">${v}</td></tr>`;
  const a = o.address ?? {};
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0">${rows}
${line("Subtotal", inr(o.subtotal))}${o.discount ? line(`Discount${o.coupon_code ? " (" + esc(o.coupon_code) + ")" : ""}`, "−" + inr(o.discount)) : ""}
${line("Shipping", o.shipping ? inr(o.shipping) : "Free")}${o.cod_fee ? line("COD fee", inr(o.cod_fee)) : ""}${line("Total", inr(o.total), true)}</table>
<p style="font-size:14px;color:#6E5E5F;margin:0">Payment: ${o.payment_method === "cod" ? "Cash on Delivery" : "Paid online (Razorpay)"}<br>
Deliver to: ${esc(o.name)}, ${esc(a.line1)}${a.line2 ? ", " + esc(a.line2) : ""}, ${esc(a.city)}, ${esc(a.state)} ${esc(a.pincode)} · ${esc(o.phone)}</p>`;
}

async function sendMail(to: string | string[], subject: string, html: string, replyTo = "hello@alankarfashions.com") {
  if (!RESEND) { console.warn("RESEND_API_KEY missing; email skipped:", subject); return false; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html, reply_to: replyTo }),
  });
  if (!r.ok) console.error("Resend error", r.status, await r.text());
  return r.ok;
}

const STATUS_COPY: Record<string, [string, string]> = {
  confirmed: ["Your order is confirmed", "We've received your order and are getting it ready."],
  packed: ["Your order is packed", "Your jewellery is packed in its gift box and will ship soon."],
  shipped: ["Your order is on its way", "Your order has left our shop in Kolhapur."],
  delivered: ["Your order has been delivered", "We hope you love it. Share a photo with us on Instagram @alankar_fashions_kop."],
  cancelled: ["Your order was cancelled", "Your order has been cancelled. If you paid online, the refund will reach your original payment method in 5–7 working days."],
};

async function mailOrderPlaced(o: Record<string, any>) {
  const track = `${SITE}/track-order?order=${encodeURIComponent(o.order_no)}`;
  await sendMail(o.email, `Order ${o.order_no} confirmed · Alankar Fashions`,
    shell(`Thank you, ${esc(o.name.split(" ")[0])}!`,
      `<p>Your order <b>${o.order_no}</b> is confirmed. We'll email you again when it ships.</p>${orderTable(o)}${btn(track, "Track your order")}`));
  const c = await setting<{ order_notify_email?: string }>("commerce");
  if (c.order_notify_email) {
    await sendMail(c.order_notify_email, `New order ${o.order_no} · ${inr(o.total)} · ${o.payment_method === "cod" ? "COD" : "Paid"}`,
      shell(`New order ${o.order_no}`, `<p>${esc(o.name)} · ${esc(o.phone)} · ${esc(o.email)}</p>${orderTable(o)}${o.notes ? `<p><b>Customer note:</b> ${esc(o.notes)}</p>` : ""}${btn(`${SITE}/admin/orders/${o.id}`, "Open in admin")}`), o.email);
  }
}

// ---------------- ACTIONS ----------------
async function sendOtp(body: any) {
  const email = String(body.email ?? "").trim().toLowerCase();
  const purpose = body.purpose === "admin" ? "admin" : "customer";
  if (!emailOk(email)) return fail("Enter a valid email address.");
  if (purpose === "admin") {
    const { data } = await db.from("admin_users").select("active").eq("email", email).maybeSingle();
    if (!data?.active) return json({ ok: true }); // don't reveal who is an admin
  }
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
  const { data: r } = await db.rpc("service_otp", { p_action: "create", p_email: email, p_purpose: purpose, p_hash: await sha256(code + email + SERVICE.slice(-16)) });
  if (!(r as any)?.ok) return fail((r as any)?.error ?? "Could not send code.", 429);
  const sent = await sendMail(email, `${code} is your Alankar login code`,
    shell("Your login code", `<p>Use this code to sign in${purpose === "admin" ? " to the Alankar admin panel" : ""}:</p>
<p style="font-family:Georgia,serif;font-size:36px;letter-spacing:.3em;margin:20px 0;color:#5C0A12">${code}</p>
<p style="color:#6E5E5F;font-size:13px">The code expires in 5 minutes. If you didn't ask for it, you can ignore this email.</p>`));
  if (!sent) return fail("Email service isn't set up yet. Please try again later.", 503);
  return json({ ok: true });
}

async function verifyOtp(body: any) {
  const email = String(body.email ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").replace(/\D/g, "");
  const purpose = body.purpose === "admin" ? "admin" : "customer";
  if (!emailOk(email) || code.length !== 6) return fail("Enter the 6-digit code from your email.");
  const { data: r } = await db.rpc("service_otp", { p_action: "verify", p_email: email, p_purpose: purpose, p_hash: await sha256(code + email + SERVICE.slice(-16)) });
  if (!(r as any)?.ok) return fail((r as any)?.error ?? "That code is not correct.");
  await db.auth.admin.createUser({ email, email_confirm: true }).catch(() => null);
  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.properties?.hashed_token) return fail("Could not sign you in. Try again.", 500);
  return json({ ok: true, token_hash: data.properties.hashed_token });
}

type Priced = { lines: any[]; subtotal: number; discount: number; shipping: number; cod_fee: number; total: number; coupon: string | null };
async function priceCart(items: any[], couponCode: string | null, method: "cod" | "razorpay"): Promise<Priced | string> {
  if (!Array.isArray(items) || !items.length || items.length > 50) return "Your bag is empty.";
  const ids = [...new Set(items.map((i) => String(i.id)))];
  const { data: prods } = await db.from("products").select("id,name,slug,price,stock,track_stock,images,active,sku").in("id", ids);
  const lines: any[] = [];
  for (const it of items) {
    const p = prods?.find((x) => x.id === String(it.id));
    const qty = Math.max(1, Math.min(20, parseInt(it.qty) || 1));
    if (!p || !p.active) return "One of the items in your bag is no longer available.";
    if (p.track_stock && p.stock < qty) return `Only ${p.stock} left of "${p.name}". Please update your bag.`;
    lines.push({ id: p.id, name: p.name, slug: p.slug, sku: p.sku, price: p.price, qty, image: p.images?.[0]?.url ?? null });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  let discount = 0, coupon: string | null = null;
  if (couponCode) {
    const code = String(couponCode).trim().toUpperCase();
    const { data: c } = await db.from("coupons").select("*").eq("code", code).maybeSingle();
    const now = Date.now();
    if (!c || !c.active || (c.starts_at && Date.parse(c.starts_at) > now) || (c.ends_at && Date.parse(c.ends_at) < now) || (c.max_uses && c.used >= c.max_uses))
      return "This coupon is not valid.";
    if (subtotal < c.min_order) return `This coupon needs a minimum order of ${inr(c.min_order)}.`;
    discount = c.kind === "percent" ? Math.floor((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
    coupon = code;
  }
  const cfg = await setting<any>("commerce");
  const after = subtotal - discount;
  const shipping = after >= (cfg.free_shipping_above ?? 999) ? 0 : (cfg.shipping_fee ?? 79);
  const cod_fee = method === "cod" ? (cfg.cod_fee ?? 0) : 0;
  return { lines, subtotal, discount, shipping, cod_fee, total: after + shipping + cod_fee, coupon };
}

async function quote(body: any) {
  const r = await priceCart(body.items, body.coupon || null, body.method === "razorpay" ? "razorpay" : "cod");
  if (typeof r === "string") return fail(r);
  return json({ ok: true, ...r, lines: undefined });
}

async function checkout(req: Request, body: any) {
  const method = body.method === "razorpay" ? "razorpay" : "cod";
  const c = body.customer ?? {}, a = body.address ?? {};
  const name = String(c.name ?? "").trim().slice(0, 100), email = String(c.email ?? "").trim().toLowerCase(), phone = String(c.phone ?? "").replace(/[^\d+]/g, "");
  if (name.length < 2) return fail("Enter your full name.");
  if (!emailOk(email)) return fail("Enter a valid email address.");
  if (phone.replace(/\D/g, "").length < 10) return fail("Enter a valid 10-digit mobile number.");
  const address = { line1: String(a.line1 ?? "").trim().slice(0, 200), line2: String(a.line2 ?? "").trim().slice(0, 200), city: String(a.city ?? "").trim().slice(0, 80), state: String(a.state ?? "").trim().slice(0, 80), pincode: String(a.pincode ?? "").replace(/\D/g, "").slice(0, 6) };
  if (!address.line1 || !address.city || !address.state || address.pincode.length !== 6) return fail("Enter your complete address with a 6-digit pincode.");

  const cfg = await setting<any>("commerce");
  const priced = await priceCart(body.items, body.coupon || null, method);
  if (typeof priced === "string") return fail(priced);
  if (method === "cod" && (!cfg.cod_enabled || priced.total > (cfg.cod_max_order ?? 15000))) return fail("Cash on Delivery isn't available for this order. Please pay online.");
  let keyId = "", keySecret = "";
  if (method === "razorpay") {
    [keyId, keySecret] = await Promise.all([secret("razorpay_key_id"), secret("razorpay_key_secret")]);
    if (!cfg.online_enabled || !keyId || !keySecret) return fail("Online payment isn't available right now. Please choose Cash on Delivery.");
  }
  const user = await userFromReq(req);
  const { data: order, error } = await db.from("orders").insert({
    user_id: user?.id ?? null, email, phone, name, address, items: priced.lines,
    subtotal: priced.subtotal, discount: priced.discount, shipping: priced.shipping, cod_fee: priced.cod_fee, total: priced.total,
    coupon_code: priced.coupon, payment_method: method, payment_status: method === "cod" ? "cod" : "pending",
    status: method === "cod" ? "confirmed" : "pending", notes: String(body.notes ?? "").slice(0, 500) || null,
  }).select().single();
  if (error || !order) { console.error(error); return fail("Could not place your order. Please try again.", 500); }

  if (user) await db.from("profiles").update({ name, phone, address }).eq("id", user.id);

  if (method === "cod") {
    await db.rpc("service_commit_order", { p_order: order.id });
    await db.from("order_events").insert({ order_id: order.id, status: "confirmed", note: "Cash on Delivery order placed", actor: "customer" });
    await mailOrderPlaced(order);
    return json({ ok: true, order_id: order.id, order_no: order.order_no, method });
  }
  const r = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${keyId}:${keySecret}`), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: priced.total * 100, currency: "INR", receipt: order.order_no, notes: { order_id: order.id } }),
  });
  const rz = await r.json();
  if (!r.ok || !rz.id) { console.error("Razorpay", rz); await db.from("orders").update({ payment_status: "failed" }).eq("id", order.id); return fail("Payment gateway error. Please try again or choose COD.", 502); }
  await db.from("orders").update({ razorpay_order_id: rz.id }).eq("id", order.id);
  await db.from("order_events").insert({ order_id: order.id, status: "pending", note: "Awaiting online payment", actor: "customer" });
  return json({ ok: true, order_id: order.id, order_no: order.order_no, method, razorpay: { key: keyId, order_id: rz.id, amount: rz.amount, currency: "INR", name, email, phone } });
}

async function markPaid(orderId: string, paymentId: string, via: string) {
  const { data: o } = await db.from("orders").select("*").eq("id", orderId).single();
  if (!o || o.payment_status === "paid") return o;
  const { data: up } = await db.from("orders").update({ payment_status: "paid", status: "confirmed", razorpay_payment_id: paymentId }).eq("id", orderId).eq("payment_status", "pending").select().maybeSingle();
  if (!up) return o; // another request already confirmed it
  await db.rpc("service_commit_order", { p_order: orderId });
  await db.from("order_events").insert({ order_id: orderId, status: "confirmed", note: `Payment received (${via})`, actor: "system" });
  await mailOrderPlaced(up);
  return up;
}

async function verifyPayment(body: any) {
  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};
  if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return fail("Missing payment details.");
  const { data: o } = await db.from("orders").select("id,razorpay_order_id,order_no").eq("id", order_id).maybeSingle();
  if (!o || o.razorpay_order_id !== razorpay_order_id) return fail("Order not found.", 404);
  const expected = await hmacHex(await secret("razorpay_key_secret"), `${razorpay_order_id}|${razorpay_payment_id}`);
  if (!safeEqual(expected, String(razorpay_signature))) return fail("Payment could not be verified.", 400);
  await markPaid(o.id, razorpay_payment_id, "checkout");
  return json({ ok: true, order_no: o.order_no });
}

async function webhook(req: Request) {
  const raw = await req.text();
  const ws = await secret("razorpay_webhook_secret");
  if (!ws) return fail("Webhook not configured", 400);
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!safeEqual(await hmacHex(ws, raw), sig)) return fail("Bad signature", 401);
  const ev = JSON.parse(raw);
  const pay = ev?.payload?.payment?.entity;
  if (["payment.captured", "order.paid"].includes(ev.event) && pay?.order_id) {
    const { data: o } = await db.from("orders").select("id").eq("razorpay_order_id", pay.order_id).maybeSingle();
    if (o) await markPaid(o.id, pay.id, "webhook");
  }
  if (ev.event === "payment.failed" && pay?.order_id) {
    await db.from("orders").update({ payment_status: "failed" }).eq("razorpay_order_id", pay.order_id).eq("payment_status", "pending");
  }
  return json({ ok: true });
}

async function adminOrderUpdate(req: Request, body: any) {
  const admin = await adminFromReq(req, "staff");
  if (!admin) return fail("Not allowed", 403);
  const allowed = ["confirmed", "packed", "shipped", "delivered", "cancelled"];
  const patch: Record<string, unknown> = {};
  if (body.status) { if (!allowed.includes(body.status)) return fail("Unknown status"); patch.status = body.status; }
  for (const k of ["courier", "tracking_number", "tracking_url", "admin_notes"]) if (k in body) patch[k] = body[k] ? String(body[k]).slice(0, 500) : null;
  if (body.payment_status && ["paid", "refunded", "cod", "failed", "pending"].includes(body.payment_status)) patch.payment_status = body.payment_status;
  const { data: o, error } = await db.from("orders").update(patch).eq("id", body.order_id).select().single();
  if (error || !o) return fail("Could not update order", 500);
  if (body.status) await db.from("order_events").insert({ order_id: o.id, status: body.status, note: body.note ?? null, actor: admin.email });
  if (body.status && body.notify !== false && STATUS_COPY[body.status]) {
    const [title, text] = STATUS_COPY[body.status];
    const trackLine = body.status === "shipped" && (o.tracking_number || o.tracking_url)
      ? `<p><b>Courier:</b> ${esc(o.courier ?? "")} &nbsp; <b>Tracking no:</b> ${esc(o.tracking_number ?? "")}</p>${o.tracking_url ? btn(o.tracking_url, "Track with courier") : ""}` : "";
    await sendMail(o.email, `${title} · ${o.order_no}`, shell(title, `<p>${text}</p><p>Order <b>${o.order_no}</b></p>${trackLine}${orderTable(o)}${btn(`${SITE}/track-order?order=${o.order_no}`, "View order status")}`));
  }
  return json({ ok: true, order: o });
}

async function subscribe(body: any) {
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!emailOk(email)) return fail("Enter a valid email address.");
  const { error } = await db.from("newsletter").insert({ email, source: String(body.source ?? "site").slice(0, 40) });
  if (!error) await sendMail(email, "Welcome to Alankar Fashions", shell("You're on the list", `<p>Thank you for subscribing. You'll hear about new designs and festive collections before anyone else.</p><p>Here's 10% off your first order above ₹999: <b style="font-size:18px;color:#5C0A12">WELCOME10</b></p>${btn(SITE, "Shop now")}`));
  return json({ ok: true });
}

async function contact(body: any) {
  if (body.website) return json({ ok: true }); // honeypot
  const name = String(body.name ?? "").trim().slice(0, 100), message = String(body.message ?? "").trim().slice(0, 4000);
  const email = String(body.email ?? "").trim().toLowerCase(), phone = String(body.phone ?? "").trim().slice(0, 20);
  if (name.length < 2 || message.length < 5) return fail("Please add your name and a message.");
  if (email && !emailOk(email)) return fail("Enter a valid email address.");
  await db.from("contact_messages").insert({ name, email: email || null, phone: phone || null, message });
  const c = await setting<any>("commerce");
  if (c.order_notify_email) await sendMail(c.order_notify_email, `New enquiry from ${name}`, shell("New website enquiry", `<p><b>${esc(name)}</b> · ${esc(phone)} · ${esc(email)}</p><p style="white-space:pre-wrap">${esc(message)}</p>`), email || undefined);
  return json({ ok: true });
}

async function reminders(req: Request) {
  const secretHeader = req.headers.get("x-cron-secret") ?? "";
  if (!secretHeader || !safeEqual(await sha256(secretHeader), await sha256(SERVICE.slice(-24)))) return fail("Not allowed", 403);
  const since = new Date(Date.now() - 24 * 3600e3).toISOString(), until = new Date(Date.now() - 3600e3).toISOString();
  const { data: list } = await db.from("orders").select("*").eq("payment_status", "pending").eq("status", "pending").eq("reminder_sent", false).gte("created_at", since).lte("created_at", until).limit(50);
  for (const o of list ?? []) {
    await sendMail(o.email, `Your Alankar order ${o.order_no} is waiting`, shell("Still thinking it over?", `<p>Your order <b>${o.order_no}</b> wasn't completed because the payment didn't go through. Your pieces are still available.</p>${orderTable(o)}<p>Prefer to pay when it arrives? Reply to this email or WhatsApp us and we'll switch it to Cash on Delivery.</p>${btn(`${SITE}/cart`, "Complete your order")}`));
    await db.from("orders").update({ reminder_sent: true }).eq("id", o.id);
  }
  return json({ ok: true, sent: list?.length ?? 0 });
}

async function adminTestEmail(req: Request) {
  const admin = await adminFromReq(req, "manager");
  if (!admin) return fail("Not allowed", 403);
  const ok = await sendMail(admin.email, "Test email from your Alankar store", shell("Emails are working", "<p>This is a test email from your store's admin panel. Order confirmations and login codes will look like this.</p>"));
  return ok ? json({ ok: true }) : fail("Email service isn't set up yet (missing Resend API key).", 503);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return fail("Method not allowed", 405);
  const url = new URL(req.url);
  try {
    if (url.searchParams.get("action") === "razorpay-webhook" || url.pathname.endsWith("/razorpay-webhook")) return await webhook(req);
    if (url.searchParams.get("action") === "cron-reminders") return await reminders(req);
    const body = await req.json().catch(() => ({}));
    switch (body.action) {
      case "send-otp": return await sendOtp(body);
      case "verify-otp": return await verifyOtp(body);
      case "quote": return await quote(body);
      case "checkout": return await checkout(req, body);
      case "verify-payment": return await verifyPayment(body);
      case "admin-order-update": return await adminOrderUpdate(req, body);
      case "admin-test-email": return await adminTestEmail(req);
      case "subscribe": return await subscribe(body);
      case "contact": return await contact(body);
      default: return fail("Unknown action", 404);
    }
  } catch (e) {
    console.error(e);
    return fail("Something went wrong. Please try again.", 500);
  }
});
