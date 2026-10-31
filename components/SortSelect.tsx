"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SortSelect({ value }: { value: string }) {
  const router = useRouter(), path = usePathname(), sp = useSearchParams();
  return (
    <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
      <span className="muted">Sort</span>
      <select className="select" id="sort" value={value} onChange={(e) => {
        const n = new URLSearchParams(sp.toString());
        if (e.target.value) n.set("sort", e.target.value); else n.delete("sort");
        router.push(`${path}${n.toString() ? "?" + n : ""}`);
      }}>
        <option value="">Featured</option>
        <option value="new">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
      </select>
    </label>
  );
}
