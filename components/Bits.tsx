"use client";
import { useState } from "react";
import { api } from "@/lib/supabase";
import { IconWhatsApp } from "./Icons";
import { useStore } from "./Store";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");
  return state === "done" ? <p className="okmsg">You&apos;re on the list. Check your inbox for a welcome code.</p> : (
    <form onSubmit={async (e) => {
      e.preventDefault(); setErr("");
      const email = String(new FormData(e.currentTarget).get("email") ?? "");
      if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address.");
      setState("busy"); const r = await api("subscribe", { email, source });
      if (r.ok) setState("done"); else { setErr(r.error ?? "Try again."); setState("idle"); }
    }} noValidate>
      <label htmlFor={`nl-${source}`} className="sr">Email address</label>
      <input id={`nl-${source}`} name="email" type="email" placeholder="Your email address" autoComplete="email" required />
      <button className="link-u" type="submit" disabled={state === "busy"} style={{ border: 0 }}>{state === "busy" ? "…" : "Subscribe"}</button>
      {err && <span className="err" style={{ position: "absolute", marginTop: 56 }}>{err}</span>}
    </form>
  );
}

export function WhatsAppFab({ number }: { number: string }) {
  return (
    <a className="wa" href={`https://wa.me/${number}?text=${encodeURIComponent("Hi Alankar Fashions!")}`} target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
      <IconWhatsApp />
    </a>
  );
}

export function WishButton({ id, name }: { id: string; name: string }) {
  const { wish, toggleWish } = useStore();
  const on = wish.includes(id);
  return <button className="btn btn-ghost" aria-pressed={on} onClick={() => toggleWish(id)}>{on ? "♥ Saved" : "♡ Save"}<span className="sr"> {name}</span></button>;
}
