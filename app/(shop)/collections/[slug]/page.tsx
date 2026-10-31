import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getProducts } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import { SITE_URL } from "@/lib/supabase";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

const TAG_LABEL: Record<string, string> = { bridal: "Bridal", wedding: "Wedding", festive: "Festive", daily: "Daily wear", gifting: "Gifting", party: "Party wear" };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "all") return { title: "All Jewellery", description: "Shop all Alankar jewellery: Kolhapuri Saj, Thushi, pearls, kundan and AD necklaces, bangles and earrings. COD across India.", alternates: { canonical: "/collections/all" } };
  const c = (await getCategories()).find((x) => x.slug === slug);
  if (!c) return {};
  return {
    title: c.seo_title || `${c.name} Jewellery`,
    description: c.seo_description || c.description || `Shop ${c.name} from Alankar Fashions, Kolhapur. Cash on Delivery and free shipping above ₹999.`,
    alternates: { canonical: `/collections/${c.slug}` },
    openGraph: c.image_url ? { images: [{ url: c.image_url }] } : undefined,
  };
}

export default async function Collection({ params, searchParams }: P) {
  const { slug } = await params;
  const sp = await searchParams;
  const cats = await getCategories();
  const cat = slug === "all" ? null : cats.find((c) => c.slug === slug);
  if (slug !== "all" && !cat) notFound();
  const parent = cat?.parent_id ? cats.find((c) => c.id === cat.parent_id) : cat;
  const children = parent ? cats.filter((c) => c.parent_id === parent.id) : cats.filter((c) => !c.parent_id);
  const ids = cat ? [cat.id, ...cats.filter((c) => c.parent_id === cat.id).map((c) => c.id)] : undefined;
  const products = await getProducts({ categoryIds: ids, tag: sp.tag, sort: sp.sort, min: Number(sp.min) || undefined, max: Number(sp.max) || undefined });
  const catNames = Object.fromEntries(cats.map((c) => [c.id, c.name]));
  const title = cat ? cat.name : sp.tag ? `${TAG_LABEL[sp.tag] ?? sp.tag} jewellery` : sp.max ? `Jewellery under ₹${sp.max}` : sp.sort === "new" ? "New arrivals" : "All jewellery";

  const crumbs = [{ name: "Home", url: SITE_URL }, ...(parent && cat && parent.id !== cat.id ? [{ name: parent.name, url: `${SITE_URL}/collections/${parent.slug}` }] : []), { name: title, url: `${SITE_URL}/collections/${slug}` }];
  const ld = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })) },
    { "@context": "https://schema.org", "@type": "ItemList", name: title, itemListElement: products.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/products/${p.slug}`, name: p.name })) },
  ];
  const q = (patch: Record<string, string | undefined>) => {
    const n = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    const s = n.toString(); return s ? `?${s}` : "";
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="phead"><div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span>{parent && cat && parent.id !== cat.id && <><Link href={`/collections/${parent.slug}`}>{parent.name}</Link><span>/</span></>}<span aria-current="page">{title}</span></nav>
        <h1>{title} {cat?.name_mr && <span className="mr" style={{ fontSize: "0.5em", color: "var(--muted)" }}>{cat.name_mr}</span>}</h1>
        {cat?.description && <p>{cat.description}</p>}
        <div className="chips">
          {parent && <Link href={`/collections/${parent.slug}`} className={cat?.id === parent.id ? "on" : ""}>All {parent.name}</Link>}
          {!parent && <Link href="/collections/all" className={!sp.tag ? "on" : ""}>All</Link>}
          {children.map((c) => <Link key={c.id} href={`/collections/${c.slug}`} className={cat?.id === c.id ? "on" : ""}>{c.name}</Link>)}
        </div>
      </div></div>
      <div className="wrap">
        <div className="toolbar">
          <div className="chips" style={{ marginTop: 0 }}>
            {Object.entries(TAG_LABEL).map(([k, v]) => <Link key={k} href={`/collections/${slug}${q({ tag: sp.tag === k ? undefined : k })}`} className={sp.tag === k ? "on" : ""}>{v}</Link>)}
          </div>
          <SortSelect value={sp.sort ?? ""} />
        </div>
        <p className="muted" style={{ margin: "0 0 20px", fontSize: 14 }}>{products.length} {products.length === 1 ? "design" : "designs"}</p>
        {products.length ? (
          <div className="pgrid" style={{ paddingBottom: 80 }}>{products.map((p) => <ProductCard key={p.id} p={p} catName={catNames[p.category_id ?? ""]} />)}</div>
        ) : (
          <div className="empty"><p>No designs here yet. New pieces are added every week.</p><Link className="btn btn-dark" href="/collections/all">See all jewellery</Link></div>
        )}
      </div>
    </>
  );
}
