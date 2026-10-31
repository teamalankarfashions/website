import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getProduct, getProducts, getSettings } from "@/lib/data";
import Gallery from "@/components/Gallery";
import BuyBox from "@/components/BuyBox";
import ProductCard from "@/components/ProductCard";
import { IconCash, IconGift, IconReturn, IconTruck } from "@/components/Icons";
import { inr, pctOff, waLink } from "@/lib/format";
import { SITE_URL } from "@/lib/supabase";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const desc = p.seo_description || `${p.short_description ?? ""} ${inr(p.price)}. Cash on Delivery, free shipping above ₹999. From Alankar Fashions, Kolhapur.`.trim();
  return {
    title: p.seo_title || p.name, description: desc,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { type: "website", title: p.name, description: desc, images: p.images.slice(0, 1).map((i) => ({ url: i.url })) },
  };
}

export default async function ProductPage({ params }: P) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const [cats, s] = await Promise.all([getCategories(), getSettings()]);
  const cat = cats.find((c) => c.id === p.category_id);
  const parent = cat?.parent_id ? cats.find((c) => c.id === cat.parent_id) : null;
  const related = (await getProducts({ categoryIds: [cat?.parent_id ?? cat?.id ?? ""].filter(Boolean).concat(cats.filter((c) => c.parent_id && c.parent_id === (cat?.parent_id ?? cat?.id)).map((c) => c.id)), limit: 9 })).filter((x) => x.id !== p.id).slice(0, 4);
  const out = p.track_stock && p.stock <= 0;
  const off = pctOff(p.price, p.compare_at_price);
  const url = `${SITE_URL}/products/${p.slug}`;
  const ld = [
    {
      "@context": "https://schema.org", "@type": "Product", name: p.name, alternateName: p.name_mr ?? undefined, sku: p.sku ?? p.id,
      description: p.description ?? p.short_description ?? "", image: p.images.map((i) => i.url), url,
      brand: { "@type": "Brand", name: "Alankar Fashions" }, category: [parent?.name, cat?.name].filter(Boolean).join(" > "), material: p.material ?? undefined,
      offers: {
        "@type": "Offer", url, priceCurrency: "INR", price: p.price, itemCondition: "https://schema.org/NewCondition",
        availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", seller: { "@id": `${SITE_URL}/#store` },
        shippingDetails: { "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
          shippingRate: { "@type": "MonetaryAmount", currency: "INR", value: p.price >= s.commerce.free_shipping_above ? 0 : s.commerce.shipping_fee },
          deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" }, transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" } } },
        hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: "IN", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 7, returnMethod: "https://schema.org/ReturnByMail" },
      },
    },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(parent ? [{ "@type": "ListItem", position: 2, name: parent.name, item: `${SITE_URL}/collections/${parent.slug}` }] : []),
      ...(cat ? [{ "@type": "ListItem", position: parent ? 3 : 2, name: cat.name, item: `${SITE_URL}/collections/${cat.slug}` }] : []),
      { "@type": "ListItem", position: (parent ? 3 : 2) + (cat ? 1 : 0), name: p.name, item: url },
    ] },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb" style={{ paddingTop: 24 }}>
          <Link href="/">Home</Link><span>/</span>
          {parent && <><Link href={`/collections/${parent.slug}`}>{parent.name}</Link><span>/</span></>}
          {cat && <><Link href={`/collections/${cat.slug}`}>{cat.name}</Link><span>/</span></>}
          <span aria-current="page">{p.name}</span>
        </nav>
        <div className="pdp">
          <Gallery images={p.images} name={p.name} />
          <div className="buy">
            {cat && <span className="eyebrow">{cat.name}</span>}
            <h1>{p.name}</h1>
            {p.name_mr && <span className="mr">{p.name_mr}</span>}
            <div className="price"><b>{inr(p.price)}</b>{off > 0 && <><s>{inr(p.compare_at_price!)}</s><i>Save {off}%</i></>}</div>
            <span className="note">Inclusive of all taxes. {p.price >= s.commerce.free_shipping_above ? "Free shipping." : `Free shipping above ${inr(s.commerce.free_shipping_above)}.`}</span>
            {p.short_description && <p style={{ margin: 0 }}>{p.short_description}</p>}
            <BuyBox p={{ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0]?.url ?? null, stock: p.track_stock ? p.stock : 99 }} out={out} lowAt={s.commerce.low_stock_alert ?? 3} whatsapp={waLink(s.store.whatsapp, `Hi Alankar, I have a question about "${p.name}" (${url})`)} />
            <div className="perks">
              <div><IconCash />Cash on Delivery</div>
              <div><IconTruck />Ships in 1–2 days</div>
              <div><IconReturn />7-day easy exchange</div>
              <div><IconGift />Gift box included</div>
            </div>
            <div className="acc">
              <details open><summary>Description</summary><div>{p.description}</div></details>
              <details><summary>Material &amp; care</summary><div>{p.material && <p style={{ margin: "0 0 8px" }}><b>Material:</b> {p.material}{p.finish ? ` · ${p.finish}` : ""}</p>}<p style={{ margin: 0 }}>{p.care}</p><p style={{ margin: "8px 0 0" }}>This is artificial (imitation) jewellery.</p></div></details>
              <details><summary>Shipping &amp; returns</summary><div>Packed within 1–2 working days. Delivery in 2–4 days in Maharashtra and 4–7 days across India. Unused items can be exchanged within 7 days. <Link href="/return-policy" style={{ textDecoration: "underline" }}>Read the policy</Link>.</div></details>
            </div>
          </div>
        </div>
        {related.length > 0 && (
          <section className="sec" style={{ paddingTop: 0 }} aria-labelledby="rel-h">
            <div className="shead"><div className="l"><h2 id="rel-h">You may also like</h2></div></div>
            <div className="pgrid">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
          </section>
        )}
      </div>
    </>
  );
}
