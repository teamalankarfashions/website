"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/components/Store";
import ProductCard from "@/components/ProductCard";
import { browserClient } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export default function Wishlist() {
  const { wish } = useStore();
  const [items, setItems] = useState<Product[] | null>(null);
  useEffect(() => {
    if (!wish.length) { setItems([]); return; }
    browserClient().from("products").select("*").in("id", wish).eq("active", true).then(({ data }) => setItems((data ?? []) as Product[]));
  }, [wish]);
  return (
    <>
      <div className="phead"><div className="wrap"><h1>Wishlist</h1><p>Pieces you&apos;ve saved on this device.</p></div></div>
      <div className="wrap" style={{ paddingBlock: "32px 80px" }}>
        {items === null ? null : items.length === 0 ? (
          <div className="empty"><p>Nothing saved yet. Tap the heart on any design to keep it here.</p><Link className="btn btn-dark" href="/collections/all">Browse jewellery</Link></div>
        ) : <div className="pgrid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </div>
    </>
  );
}
