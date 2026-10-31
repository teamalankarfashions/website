"use client";
import "./admin.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import OtpLogin from "@/components/OtpLogin";
import { AdminCtx, sb, useNotify, type Role } from "./ui";
import { LOGO_LIGHT } from "@/lib/supabase";

const NAV: { href: string; label: string; min: Role }[] = [
  { href: "/admin", label: "Dashboard", min: "staff" },
  { href: "/admin/orders", label: "Orders", min: "staff" },
  { href: "/admin/products", label: "Products", min: "staff" },
  { href: "/admin/categories", label: "Categories", min: "manager" },
  { href: "/admin/coupons", label: "Coupons", min: "manager" },
  { href: "/admin/customers", label: "Customers & messages", min: "staff" },
  { href: "/admin/content", label: "Homepage & banners", min: "manager" },
  { href: "/admin/pages", label: "Pages & policies", min: "manager" },
  { href: "/admin/settings", label: "Store settings", min: "manager" },
  { href: "/admin/team", label: "Team & access", min: "owner" },
];
const rank = { staff: 1, manager: 2, owner: 3 };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ email: string; role: Role } | null | "none" | "denied">(null);
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  const { notify, node } = useNotify();

  async function check() {
    const { data } = await sb().auth.getSession();
    const email = data.session?.user.email;
    if (!email) return setState("none");
    const { data: role } = await sb().rpc("admin_role");
    setState(role ? { email, role: role as Role } : "denied");
  }
  useEffect(() => { document.title = "Admin | Alankar Fashions"; check(); }, []);
  useEffect(() => setMenu(false), [path]);

  if (state === null) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }} className="muted">Loading…</div>;
  if (state === "none") return <div className="wrap"><meta name="robots" content="noindex" /><OtpLogin purpose="admin" onDone={check} title="Admin sign in" subtitle="Enter your admin email. We'll send a 6-digit code." /></div>;
  if (state === "denied") return (
    <div className="wrap"><div className="login-box"><h1 style={{ fontSize: 30 }}>No admin access</h1><p className="muted">This email isn&apos;t on the store team. Ask the owner to add you under Team &amp; access.</p>
      <button className="btn btn-dark" onClick={async () => { await sb().auth.signOut(); setState("none"); }}>Sign in with another email</button></div></div>
  );
  const can = (min: Role) => rank[state.role] >= rank[min];
  return (
    <AdminCtx.Provider value={{ ...state, can, notify }}>
      <meta name="robots" content="noindex" />
      <div className="adm-mbar"><img src={LOGO_LIGHT} alt="Alankar" /><button onClick={() => setMenu(true)} style={{ color: "#fff" }}>☰ Menu</button></div>
      <div className="adm">
        <aside className={`adm-side${menu ? " on" : ""}`}>
          <Link href="/admin" className="logo"><img src={LOGO_LIGHT} alt="Alankar admin" /></Link>
          {NAV.filter((n) => can(n.min)).map((n) => <Link key={n.href} href={n.href} className={(n.href === "/admin" ? path === "/admin" : path.startsWith(n.href)) ? "on" : ""}>{n.label}</Link>)}
          <div className="grow" />
          <Link href="/" target="_blank">View store ↗</Link>
          <small>{state.email} · {state.role}</small>
          <a href="#" onClick={async (e) => { e.preventDefault(); await sb().auth.signOut(); setState("none"); }}>Sign out</a>
        </aside>
        {menu && <div className="modal-bg" style={{ zIndex: 75, background: "rgba(0,0,0,.3)" }} onClick={() => setMenu(false)} />}
        <main className="adm-main">{children}</main>
      </div>
      {node}
    </AdminCtx.Provider>
  );
}
