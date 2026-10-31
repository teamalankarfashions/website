"use client";
import { useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ProductTabs({ products, catNames }: { products: Product[]; catNames: Record<string, string> }) {
  const tabs = [
    { k: "best", label: "Bestsellers", f: (p: Product) => p.is_featured },
    { k: "new", label: "New in", f: (p: Product) => p.is_new },
    { k: "u999", label: "Under ₹999", f: (p: Product) => p.price < 1000 },
  ];
  const [t, setT] = useState("best");
  const list = products.filter(tabs.find((x) => x.k === t)!.f).slice(0, 8);
  return (
    <>
      <div className="shead">
        <div className="l"><h2 id="best-h">Bestsellers</h2></div>
        <div className="tabs" role="tablist">
          {tabs.map((x) => <button key={x.k} role="tab" aria-selected={t === x.k} onClick={() => setT(x.k)}>{x.label}</button>)}
        </div>
      </div>
      <div className="pgrid">{list.map((p) => <ProductCard key={p.id} p={p} catName={catNames[p.category_id ?? ""]} />)}</div>
    </>
  );
}
