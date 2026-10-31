"use client";
import { useEffect, useState } from "react";
import { api, browserClient } from "@/lib/supabase";

export default function OtpLogin({ purpose, onDone, title, subtitle }: { purpose: "admin" | "customer"; onDone: () => void; title: string; subtitle: string }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(""); const [code, setCode] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);

  async function send() {
    setErr(""); if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address.");
    setBusy(true); const r = await api("send-otp", { email, purpose }); setBusy(false);
    if (!r.ok) return setErr(r.error ?? "Could not send code.");
    setStep("code"); setWait(30);
  }
  async function verify() {
    setErr(""); if (code.length !== 6) return setErr("Enter the 6-digit code.");
    setBusy(true);
    const r = await api<{ token_hash: string }>("verify-otp", { email, code, purpose });
    if (!r.ok) { setBusy(false); return setErr(r.error ?? "That code is not correct."); }
    const { error } = await browserClient().auth.verifyOtp({ token_hash: r.token_hash, type: "email" });
    setBusy(false);
    if (error) return setErr("Sign-in failed. Request a new code.");
    onDone();
  }
  return (
    <div className="login-box">
      <h1 style={{ fontSize: 34 }}>{title}</h1>
      <p className="muted" style={{ margin: 0 }}>{step === "email" ? subtitle : <>We sent a 6-digit code to <b>{email}</b>. It expires in 5 minutes.</>}</p>
      <form onSubmit={(e) => { e.preventDefault(); step === "email" ? send() : verify(); }} style={{ display: "grid", gap: 14 }}>
        {step === "email" ? (
          <div className="field"><label htmlFor="em">Email</label><input id="em" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value.trim())} autoComplete="email" autoFocus required /></div>
        ) : (
          <div className="field"><label htmlFor="otp">Login code</label><input id="otp" className="input otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus /></div>
        )}
        {err && <p className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
        <button className="btn btn-red" disabled={busy}>{busy ? "Please wait…" : step === "email" ? "Email me a code" : "Sign in"}</button>
        {step === "code" && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <button type="button" className="muted" onClick={() => { setStep("email"); setCode(""); }} style={{ textDecoration: "underline" }}>Change email</button>
            <button type="button" disabled={wait > 0 || busy} onClick={send} style={{ textDecoration: wait ? "none" : "underline", color: wait ? "var(--muted)" : undefined }}>{wait ? `Resend in ${wait}s` : "Resend code"}</button>
          </div>
        )}
      </form>
    </div>
  );
}
