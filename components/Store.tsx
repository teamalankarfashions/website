"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/lib/types";

type Ctx = {
  lines: CartLine[]; count: number; subtotal: number;
  add: (l: Omit<CartLine, "qty">, qty?: number, open?: boolean) => void;
  setQty: (id: string, qty: number) => void; remove: (id: string) => void; clear: () => void;
  wish: string[]; toggleWish: (id: string) => void;
  drawer: "bag" | "menu" | null; setDrawer: (d: "bag" | "menu" | null) => void;
  toast: (msg: string) => void; toastMsg: string;
  freeAbove: number;
};
const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => useContext(StoreCtx)!;

function load<T>(k: string, d: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
}
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export default function StoreProvider({ children, freeAbove }: { children: React.ReactNode; freeAbove: number }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [drawer, setDrawer] = useState<"bag" | "menu" | null>(null);
  const [toastMsg, setToast] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => { setLines(load("alk-cart", [])); setWish(load("alk-wish", [])); setReady(true); }, []);
  useEffect(() => { if (ready) save("alk-cart", lines); }, [lines, ready]);
  useEffect(() => { if (ready) save("alk-wish", wish); }, [wish, ready]);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    const k = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(null);
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [drawer]);

  const toast = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(""), 2400); }, []);
  const add = useCallback((l: Omit<CartLine, "qty">, qty = 1, open = true) => {
    setLines((cur) => {
      const ex = cur.find((x) => x.id === l.id);
      const max = l.stock ?? 20;
      if (ex) return cur.map((x) => (x.id === l.id ? { ...x, ...l, qty: Math.min(max, x.qty + qty) } : x));
      return [...cur, { ...l, qty: Math.min(max, qty) }];
    });
    if (open) setDrawer("bag"); else toast("Added to bag");
  }, [toast]);
  const setQty = useCallback((id: string, qty: number) => setLines((c) => qty < 1 ? c.filter((x) => x.id !== id) : c.map((x) => (x.id === id ? { ...x, qty: Math.min(x.stock ?? 20, qty) } : x))), []);
  const remove = useCallback((id: string) => setLines((c) => c.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);
  const toggleWish = useCallback((id: string) => {
    setWish((w) => { const has = w.includes(id); toast(has ? "Removed from wishlist" : "Saved to wishlist"); return has ? w.filter((x) => x !== id) : [...w, id]; });
  }, [toast]);

  const value = useMemo(() => ({
    lines, count: lines.reduce((a, l) => a + l.qty, 0), subtotal: lines.reduce((a, l) => a + l.qty * l.price, 0),
    add, setQty, remove, clear, wish, toggleWish, drawer, setDrawer, toast, toastMsg, freeAbove,
  }), [lines, add, setQty, remove, clear, wish, toggleWish, drawer, toast, toastMsg, freeAbove]);

  return <StoreCtx.Provider value={value}>{children}<div className={`toast${toastMsg ? " on" : ""}`} role="status" aria-live="polite">{toastMsg}</div></StoreCtx.Provider>;
}
