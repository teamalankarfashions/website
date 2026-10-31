import Link from "next/link";
import { faqPairs, getCategories, getPage, getProducts, getSettings, tree } from "@/lib/data";
import ProductTabs from "@/components/ProductTabs";
import { IconArrow, IconCash, IconReturn, IconShield, IconStar, IconTruck } from "@/components/Icons";
import { inr, waLink } from "@/lib/format";

export default async function Home() {
  const [s, cats, products, faq] = await Promise.all([getSettings(), getCategories(), getProducts({ limit: 40 }), getPage("faq")]);
  const h = s.home, on = (k: string) => h.sections?.[k] !== false, st = s.store;
  const parents = tree(cats);
  const catNames = Object.fromEntries(cats.map((c) => {
    const parent = c.parent_id ? cats.find((x) => x.id === c.parent_id) : null;
    return [c.id, parent ? parent.name : c.name];
  }));
  const trad = parents.find((c) => c.slug === "traditionals");
  const faqs = faq ? faqPairs(faq.body).slice(0, 4) : [];
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <>
      <section className="hero" aria-label="Featured">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="tag">{h.hero.tag}</span>
            <h1>{h.hero.title}</h1>
            <p className="lede">{h.hero.subtitle}</p>
            <div className="ctas">
              <Link className="btn btn-red" href={h.hero.cta1_href}>{h.hero.cta1_label} <IconArrow /></Link>
              {h.hero.cta2_label && <Link className="btn btn-ghost" href={h.hero.cta2_href}>{h.hero.cta2_label}</Link>}
            </div>
          </div>
          <div className="hero-media"><img src={h.hero.image} alt="Maharashtrian bride wearing traditional jewellery" fetchPriority="high" /></div>
        </div>
      </section>

      {on("trust") && (
        <div className="trust"><div className="wrap"><ul>
          <li><IconTruck /><div><b>Free shipping</b><span>On orders above {inr(s.commerce.free_shipping_above)}</span></div></li>
          <li><IconCash /><div><b>Cash on Delivery</b><span>Pay when it arrives</span></div></li>
          <li><IconShield /><div><b>Secure checkout</b><span>UPI, cards via Razorpay</span></div></li>
          <li><IconReturn /><div><b>Easy returns</b><span>7-day exchange</span></div></li>
          <li><IconStar /><div><b>Hand-finished</b><span>In Kolhapur</span></div></li>
        </ul></div></div>
      )}

      {on("categories") && (
        <section className="sec" aria-labelledby="cat-h"><div className="wrap">
          <div className="shead rv"><div className="l"><h2 id="cat-h">Shop by collection</h2></div><Link className="link-u" href="/collections/all">View all jewellery</Link></div>
          <div className="cats">
            {parents.map((c) => (
              <Link key={c.id} className="cat rv" href={`/collections/${c.slug}`}>
                {c.image_url && <img src={c.image_url} alt={`${c.name} jewellery`} loading="lazy" />}
                <div className="cap"><span className="mr">{c.name_mr}</span><h3>{c.name}</h3><div className="subs">{c.children.map((k) => <span key={k.id}>{k.name}</span>)}</div></div>
              </Link>
            ))}
          </div>
        </div></section>
      )}

      {on("marquee") && (
        <div className="marq" aria-hidden="true"><div className="track">
          {[...cats.filter((c) => c.parent_id), ...cats.filter((c) => c.parent_id)].map((c, i) => <span key={i}>{c.name_mr}</span>)}
        </div></div>
      )}

      {on("heritage") && (
        <section className="sec" aria-labelledby="her-h"><div className="wrap split">
          <figure className="rv"><img src={h.heritage.image} alt="Woman wearing traditional Maharashtrian gold jewellery" loading="lazy" /></figure>
          <div className="txt rv">
            <span className="eyebrow">The Traditionals</span>
            <h2 id="her-h">{h.heritage.title}</h2>
            {h.heritage.text.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}
            {trad && <div className="glossary">{trad.children.map((k) => <Link key={k.id} href={`/collections/${k.slug}`}><span className="mr">{k.name_mr}</span><small>{k.name}</small></Link>)}</div>}
            <div><Link className="btn btn-red" href="/collections/traditionals">Explore Traditionals <IconArrow /></Link></div>
          </div>
        </div></section>
      )}

      {on("bestsellers") && <section className="sec" style={{ paddingTop: on("heritage") ? 0 : undefined }} aria-labelledby="best-h"><div className="wrap"><ProductTabs products={products} catNames={catNames} /></div></section>}

      {on("bridal") && (
        <section className="banner" aria-labelledby="bri-h">
          <img src={h.bridal.image} alt="Bride wearing traditional gold bridal jewellery" loading="lazy" />
          <div className="ov" /><div className="in"><div className="wrap" style={{ width: "100%" }}>
            <div className="box rv">
              <span className="mr">{h.bridal.tag}</span><h2 id="bri-h">{h.bridal.title}</h2><p>{h.bridal.text}</p>
              <div className="ctas">
                <Link className="btn btn-red" href={h.bridal.href}>Shop bridal sets</Link>
                <a className="btn btn-ghost" href={waLink(st.whatsapp, "Hi Alankar, I'd like help choosing a bridal set")} target="_blank" rel="noopener">Ask on WhatsApp</a>
              </div>
            </div>
          </div></div>
        </section>
      )}

      {on("occasions") && (
        <section className="sec" aria-labelledby="occ-h"><div className="wrap">
          <div className="shead rv"><div className="l"><h2 id="occ-h">Shop by budget &amp; occasion</h2></div></div>
          <div className="occ rv">
            <Link href="/collections/all?max=499"><b>₹499</b><span>Under</span></Link>
            <Link href="/collections/all?max=999"><b>₹999</b><span>Under</span></Link>
            <Link href="/collections/all?tag=wedding"><b>Wedding</b><span>Bridal &amp; guests</span></Link>
            <Link href="/collections/all?tag=festive"><b>Festive</b><span>Diwali · Padwa</span></Link>
            <Link href="/collections/all?tag=daily"><b>Daily</b><span>Light wear</span></Link>
            <Link href="/collections/all?tag=gifting"><b>Gifting</b><span>Boxed sets</span></Link>
          </div>
        </div></section>
      )}

      {on("video") && h.video?.vimeo_id && (
        <section className="craft" aria-labelledby="craft-h"><div className="vid">
          <img className="poster" src={h.video.poster} alt="" aria-hidden="true" loading="lazy" />
          <iframe src={`https://player.vimeo.com/video/${h.video.vimeo_id}?background=1&autoplay=1&loop=1&muted=1&dnt=1`} title="Alankar jewellery video" allow="autoplay; fullscreen" loading="lazy" />
          <div className="ov" /><div className="in"><div className="wrap"><div>
            <span className="eyebrow">Crafted in Kolhapur</span><h2 id="craft-h">{h.video.title}</h2><p>{h.video.text}</p>
          </div></div></div>
        </div></section>
      )}

      {on("gift") && (
        <section className="sec gift" aria-labelledby="gift-h"><div className="wrap"><div className="grid rv">
          <img src={h.gift.image} alt="Woman wearing a stone choker and matching earrings" loading="lazy" />
          <div className="txt">
            <span className="eyebrow">{h.gift.tag}</span><h2 id="gift-h">{h.gift.title}</h2><p>{h.gift.text}</p>
            <ul className="dots">{(h.gift.points ?? []).map((p, i) => <li key={i}>{p}</li>)}</ul>
            <div><Link className="btn btn-red" href={h.gift.href}>Shop gifts</Link></div>
          </div>
        </div></div></section>
      )}

      {on("instagram") && h.instagram?.length > 0 && (
        <section className="sec insta" style={{ paddingTop: 0 }} aria-labelledby="ig-h"><div className="wrap">
          <div className="shead rv"><div className="l"><span className="eyebrow">@alankar_fashions_kop</span><h2 id="ig-h">Follow us on Instagram</h2></div><a className="link-u" href={st.instagram} target="_blank" rel="noopener">Follow us</a></div>
          <div className="grid">{h.instagram.slice(0, 6).map((u, i) => <a key={i} href={st.instagram} target="_blank" rel="noopener"><img src={u} alt="Traditional jewellery styled on Instagram" loading="lazy" /></a>)}</div>
        </div></section>
      )}

      {(on("visit") || on("faq")) && (
        <section className="sec" style={{ paddingTop: 0 }} aria-labelledby="faq-h"><div className="wrap visit">
          {on("visit") && (
            <div className="store rv">
              <span className="eyebrow" style={{ color: "var(--zari-soft)" }}>Kolhapur</span>
              <h2 style={{ fontSize: "clamp(28px,3.4vw,42px)" }}>Visit our shop</h2>
              <address>{st.address}</address>
              {st.hours && <div><div className="k">Open</div><div>{st.hours}</div></div>}
              <div><div className="k">Call or WhatsApp</div><div className="num">{st.phone}</div></div>
              <div className="ctas">
                <a className="btn btn-red" style={{ background: "var(--pearl)", color: "var(--kumkum)" }} href={st.map_url} target="_blank" rel="noopener">Get directions</a>
                <a className="btn btn-ghost" href={waLink(st.whatsapp, "Hi Alankar Fashions!")} target="_blank" rel="noopener">WhatsApp</a>
              </div>
            </div>
          )}
          {on("faq") && faqs.length > 0 && (
            <div className="faq rv">
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
              <span className="eyebrow">Questions</span>
              <h2 id="faq-h" style={{ margin: "14px 0 18px", fontSize: "clamp(28px,3.4vw,42px)" }}>Before you order</h2>
              {faqs.map((f, i) => <details key={i} open={i === 0}><summary>{f.q}</summary><p>{f.a}</p></details>)}
              <p style={{ marginTop: 18 }}><Link className="link-u" href="/faq">All questions</Link></p>
            </div>
          )}
        </div></section>
      )}
    </>
  );
}
