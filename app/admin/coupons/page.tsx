"use client";
import { useEffect, useState } from "react";
import { Field, sb, useAdmin } from "../ui";
import { fmtDay, inr } from "@/lib/format";

type C = { code: string; kind: "percent" | "flat"; value: number; min_order: number; max_uses: number | null; used: number; starts_at: string | null; ends_at: string | null; active: boolean; _new?: boolean };

export default function Coupons() {
  const { notify } = useAdmin();
  const [rows, setRows] = useState<C[]>([]);
  const [edit, setEdit] = useState<C | null>(null);
  const load = () => sb().from("coupons").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows((data ?? []) as C[]));
  useEffect(() => { load(); }, []);
  async function save() {
    if (!edit) return;
    const code = edit.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 3) return notify("Code needs at least 3 letters or numbers", true);
    if (!edit.value || edit.value <= 0 || (edit.kind === "percent" && edit.value > 90)) return notify("Enter a valid discount", true);
    const { _new, ...row } = { ...edit, code, ends_at: edit.ends_at || null, starts_at: edit.starts_at || null, max_uses: edit.max_uses || null };
    const r = _new ? await sb().from("coupons").insert(row) : await sb().from("coupons").update(row).eq("code", edit.code);
    if (r.error) return notify(r.error.message.includes("duplicate") ? "That code already exists" : r.error.message, true);
    notify("Saved"); setEdit(null); load();
  }
  return (
    <>
      <div className="adm-top"><h1>Coupons</h1><button className="abtn pri" onClick={() => setEdit({ code: "", kind: "percent", value: 10, min_order: 0, max_uses: null, used: 0, starts_at: null, ends_at: null, active: true, _new: true })}>+ New coupon</button></div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Code</th><th>Discount</th><th>Min. order</th><th>Used</th><th>Ends</th><th>Status</th><th /></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={7} className="muted">No coupons yet.</td></tr> : rows.map((c) => (
            <tr key={c.code}>
              <td><b style={{ letterSpacing: ".06em" }}>{c.code}</b></td>
              <td>{c.kind === "percent" ? `${c.value}% off` : `${inr(c.value)} off`}</td>
              <td>{c.min_order ? inr(c.min_order) : "—"}</td>
              <td>{c.used}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
              <td>{c.ends_at ? fmtDay(c.ends_at) : "No end"}</td>
              <td>{c.active ? <span className="pill delivered">Active</span> : <span className="pill pending">Off</span>}</td>
              <td style={{ display: "flex", gap: 6 }}><button className="abtn sm" onClick={() => setEdit(c)}>Edit</button><button className="abtn sm danger" onClick={async () => { await sb().from("coupons").delete().eq("code", c.code); load(); }}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {edit && (
        <div className="modal-bg" onClick={() => setEdit(null)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="sec-title" style={{ margin: 0 }}>{edit._new ? "New coupon" : `Edit ${edit.code}`}</h2>
          <Field label="Code" hint="Customers type this at checkout."><input value={edit.code} disabled={!edit._new} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} placeholder="DIWALI15" /></Field>
          <div className="acols">
            <Field label="Type"><select value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as C["kind"] })}><option value="percent">Percent off</option><option value="flat">Flat ₹ off</option></select></Field>
            <Field label={edit.kind === "percent" ? "Percent" : "Amount (₹)"}><input type="number" min={1} value={edit.value} onChange={(e) => setEdit({ ...edit, value: Number(e.target.value) })} /></Field>
          </div>
          <div className="acols">
            <Field label="Minimum order (₹)"><input type="number" min={0} value={edit.min_order} onChange={(e) => setEdit({ ...edit, min_order: Number(e.target.value) })} /></Field>
            <Field label="Max uses (blank = unlimited)"><input type="number" min={1} value={edit.max_uses ?? ""} onChange={(e) => setEdit({ ...edit, max_uses: e.target.value ? Number(e.target.value) : null })} /></Field>
          </div>
          <div className="acols">
            <Field label="Starts"><input type="date" value={edit.starts_at?.slice(0, 10) ?? ""} onChange={(e) => setEdit({ ...edit, starts_at: e.target.value ? new Date(e.target.value + "T00:00:00+05:30").toISOString() : null })} /></Field>
            <Field label="Ends"><input type="date" value={edit.ends_at?.slice(0, 10) ?? ""} onChange={(e) => setEdit({ ...edit, ends_at: e.target.value ? new Date(e.target.value + "T23:59:59+05:30").toISOString() : null })} /></Field>
          </div>
          <label className="check"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Active</label>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button className="abtn" onClick={() => setEdit(null)}>Cancel</button><button className="abtn pri" onClick={save}>Save coupon</button></div>
        </div></div>
      )}
    </>
  );
}
