"use client";
import { useState } from "react";
import { api } from "@/lib/supabase";

export default function ContactForm() {
  const [done, setDone] = useState(false); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  if (done) return <div className="panel"><h2 style={{ fontSize: 26 }}>Message sent</h2><p className="muted">Thank you. We usually reply within a few hours on working days.</p></div>;
  return (
    <form className="panel" style={{ display: "grid", gap: 14 }} onSubmit={async (e) => {
      e.preventDefault(); setErr("");
      const fd = Object.fromEntries(new FormData(e.currentTarget));
      setBusy(true); const r = await api("contact", fd); setBusy(false);
      if (r.ok) setDone(true); else setErr(r.error ?? "Could not send. Try WhatsApp instead.");
    }}>
      <div className="field"><label htmlFor="cn">Name</label><input id="cn" name="name" className="input" required /></div>
      <div className="grid2">
        <div className="field"><label htmlFor="cp">Mobile</label><input id="cp" name="phone" className="input" inputMode="tel" /></div>
        <div className="field"><label htmlFor="ce">Email</label><input id="ce" name="email" type="email" className="input" /></div>
      </div>
      <div className="field"><label htmlFor="cm">Message</label><textarea id="cm" name="message" className="textarea" required maxLength={4000} /></div>
      <input name="website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: -9999 }} aria-hidden="true" />
      {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
      <button className="btn btn-red" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
    </form>
  );
}
