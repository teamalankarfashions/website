"use client";
import { useEffect, useState } from "react";
import { Field, sb, useAdmin } from "../ui";

type U = { id: string; email: string; name: string | null; role: "owner" | "manager" | "staff"; active: boolean };
const ROLE_HELP = { owner: "Everything, including payment keys and team", manager: "Products, orders, content, coupons, settings", staff: "Orders and stock only" };

export default function Team() {
  const { notify, email: me, can } = useAdmin();
  const [rows, setRows] = useState<U[]>([]);
  const [f, setF] = useState({ email: "", name: "", role: "staff" as U["role"] });
  const load = () => sb().from("admin_users").select("*").order("created_at").then(({ data }) => setRows((data ?? []) as U[]));
  useEffect(() => { load(); }, []);
  if (!can("owner")) return <p className="muted">Only the store owner can manage the team.</p>;
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const email = f.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return notify("Enter a valid email", true);
    const { error } = await sb().from("admin_users").insert({ email, name: f.name || null, role: f.role });
    if (error) return notify(error.message.includes("duplicate") ? "Already on the team" : error.message, true);
    setF({ email: "", name: "", role: "staff" }); notify("Added. They can sign in at /admin with this email."); load();
  }
  async function patch(u: U, p: Partial<U>) {
    if (u.email === me && (p.role && p.role !== "owner" || p.active === false)) return notify("You can't remove your own owner access", true);
    const { error } = await sb().from("admin_users").update(p).eq("id", u.id);
    error ? notify(error.message, true) : load();
  }
  return (
    <>
      <div className="adm-top"><h1>Team &amp; access</h1></div>
      <div className="agrid">
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Person</th><th>Role</th><th>Access</th><th /></tr></thead>
          <tbody>{rows.map((u) => (
            <tr key={u.id}>
              <td><b>{u.name || u.email}</b><br /><small className="muted">{u.email}</small></td>
              <td><select value={u.role} onChange={(e) => patch(u, { role: e.target.value as U["role"] })} style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 8px" }}><option value="owner">Owner</option><option value="manager">Manager</option><option value="staff">Staff</option></select></td>
              <td>{u.active ? <span className="pill delivered">Active</span> : <span className="pill pending">Disabled</span>}</td>
              <td><button className="abtn sm" onClick={() => patch(u, { active: !u.active })}>{u.active ? "Disable" : "Enable"}</button></td>
            </tr>
          ))}</tbody>
        </table></div>
        <form className="card2 aform" onSubmit={add}>
          <h2 className="sec-title" style={{ margin: 0 }}>Add a team member</h2>
          <Field label="Email"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
          <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Role" hint={ROLE_HELP[f.role]}><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as U["role"] })}><option value="staff">Staff</option><option value="manager">Manager</option><option value="owner">Owner</option></select></Field>
          <button className="abtn pri">Add member</button>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>They sign in at alankarfashions.com/admin with a one-time code sent to this email. No passwords to share.</p>
        </form>
      </div>
    </>
  );
}
