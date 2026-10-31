import Link from "next/link";
import type { Metadata } from "next";
import { getProducts } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 80);
  const results = q ? await getProducts({ q, limit: 48 }) : [];
  return (
    <>
      <div className="phead"><div className="wrap">
        <h1>{q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}</h1>
        <form action="/search" style={{ display: "flex", gap: 10, maxWidth: 560, marginTop: 18 }}>
          <label htmlFor="sq" className="sr">Search</label>
          <input id="sq" name="q" className="input" defaultValue={q} placeholder="Saj, Thushi, jhumka, kundan…" />
          <button className="btn btn-dark">Search</button>
        </form>
      </div></div>
      <div className="wrap" style={{ paddingBlock: "32px 80px" }}>
        {q && !results.length ? <div className="empty"><p>No designs matched. Try &ldquo;necklace&rdquo;, &ldquo;pearl&rdquo; or &ldquo;bangles&rdquo;.</p><Link className="btn btn-dark" href="/collections/all">See all jewellery</Link></div>
          : <div className="pgrid">{results.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </div>
    </>
  );
}
