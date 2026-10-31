import Link from "next/link";
import { getCategories, getSettings, tree } from "@/lib/data";
import StoreProvider from "@/components/Store";
import Header from "@/components/Header";
import { NewsletterForm, WhatsAppFab } from "@/components/Bits";
import { LOGO_LIGHT, SITE_URL } from "@/lib/supabase";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [s, cats] = await Promise.all([getSettings(), getCategories()]);
  const nav = tree(cats).map((c) => ({ slug: c.slug, name: c.name, name_mr: c.name_mr, image_url: c.image_url, children: c.children.map((k) => ({ slug: k.slug, name: k.name, name_mr: k.name_mr })) }));
  const st = s.store;
  const org = {
    "@context": "https://schema.org", "@type": "JewelryStore", "@id": `${SITE_URL}/#store`, name: st.name, alternateName: "अलंकार",
    url: SITE_URL, logo: `${SITE_URL}/brand/logo-red.png`, image: `${SITE_URL}/brand/og.jpg`, telephone: st.phone, email: st.email, priceRange: "₹₹",
    address: { "@type": "PostalAddress", streetAddress: "Shop No 1, 1354 B Ward, near Khari Corner, Mangalwar Peth", addressLocality: "Kolhapur", addressRegion: "Maharashtra", postalCode: "416012", addressCountry: "IN" },
    sameAs: [st.instagram, st.facebook].filter(Boolean), paymentAccepted: "Cash on Delivery, UPI, Credit Card, Debit Card, Net Banking", currenciesAccepted: "INR",
  };
  return (
    <StoreProvider freeAbove={s.commerce.free_shipping_above ?? 999}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      <Header nav={nav} announcements={s.announcements} phone={st.phone} />
      <main id="main">{children}</main>
      {s.home.sections?.newsletter !== false && (
        <div className="news"><div className="wrap">
          <h3 style={{ fontSize: 28 }}>New designs every week. Get them first.</h3>
          <NewsletterForm />
        </div></div>
      )}
      <footer className="site">
        <div className="wrap">
          <div className="cols">
            <div className="fb">
              <img src={LOGO_LIGHT} alt="अलंकार Alankar Fashions" style={{ height: 84, width: "auto" }} />
              <p>Handcrafted artificial jewellery from Kolhapur. Traditional Maharashtrian designs and modern favourites.</p>
              <p style={{ marginTop: 18 }}>{st.address}<br /><span style={{ userSelect: "all" }}>{st.phone}</span> · {st.email}</p>
            </div>
            <div><h4>Shop</h4><ul>{nav.map((c) => <li key={c.slug}><Link href={`/collections/${c.slug}`}>{c.name}</Link></li>)}<li><Link href="/collections/all?sort=new">New in</Link></li></ul></div>
            <div><h4>Help</h4><ul><li><Link href="/track-order">Track order</Link></li><li><Link href="/account">My account</Link></li><li><Link href="/faq">FAQ</Link></li><li><Link href="/contact">Contact</Link></li><li><Link href="/about">About us</Link></li></ul></div>
            <div><h4>Policies</h4><ul><li><Link href="/shipping-policy">Shipping</Link></li><li><Link href="/return-policy">Returns &amp; exchange</Link></li><li><Link href="/refund-policy">Refunds</Link></li><li><Link href="/privacy-policy">Privacy</Link></li><li><Link href="/terms-and-conditions">Terms</Link></li></ul></div>
          </div>
          <div className="base">
            <span>© {new Date().getFullYear()} Alankar Fashions, Kolhapur</span>
            <div className="pay"><span>COD</span><span>UPI</span><span>VISA</span><span>MASTERCARD</span><span>RAZORPAY</span></div>
            <span>{st.instagram && <a href={st.instagram} target="_blank" rel="noopener">Instagram</a>}{st.facebook && <> · <a href={st.facebook} target="_blank" rel="noopener">Facebook</a></>}</span>
          </div>
        </div>
      </footer>
      <WhatsAppFab number={st.whatsapp || "919657093006"} />
    </StoreProvider>
  );
}
