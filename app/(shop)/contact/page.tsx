import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import ContactForm from "@/components/ContactForm";
import { waLink } from "@/lib/format";

export const metadata: Metadata = { title: "Contact us", description: "Call, WhatsApp or visit Alankar Fashions at Mangalwar Peth, Kolhapur.", alternates: { canonical: "/contact" } };

export default async function Contact() {
  const { store: st } = await getSettings();
  return (
    <>
      <div className="phead"><div className="wrap"><h1>Contact us</h1><p>For custom and bridal orders, WhatsApp is the fastest way to reach us.</p></div></div>
      <div className="wrap two">
        <ContactForm />
        <aside className="store">
          <span className="eyebrow" style={{ color: "var(--zari-soft)" }}>Visit</span>
          <address>{st.address}</address>
          {st.hours && <div><div className="k">Open</div><div>{st.hours}</div></div>}
          <div><div className="k">Call or WhatsApp</div><div className="num">{st.phone}</div></div>
          <div><div className="k">Email</div><div style={{ userSelect: "all" }}>{st.email}</div></div>
          <div className="ctas">
            <a className="btn btn-red" style={{ background: "var(--pearl)", color: "var(--kumkum)" }} href={waLink(st.whatsapp, "Hi Alankar Fashions!")} target="_blank" rel="noopener">WhatsApp us</a>
            <a className="btn btn-ghost" href={st.map_url} target="_blank" rel="noopener">Directions</a>
          </div>
        </aside>
      </div>
    </>
  );
}
