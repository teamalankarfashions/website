import { getCategories, getPage, getProducts, getSettings, faqPairs } from "@/lib/data";
import { SITE_URL } from "@/lib/supabase";
export const dynamic = "force-dynamic";
/** Plain-text summary for AI answer engines (AEO). */
export async function GET() {
  const [s, cats, prods, faq] = await Promise.all([getSettings(), getCategories(), getProducts({ limit: 200 }), getPage("faq")]);
  const st = s.store;
  const lines = [
    `# ${st.name} (अलंकार)`, "",
    `> Artificial (imitation) jewellery shop in Mangalwar Peth, Kolhapur, Maharashtra, India, selling traditional Maharashtrian designs online across India with Cash on Delivery.`, "",
    `- Address: ${st.address}`, `- Phone / WhatsApp: ${st.phone}`, `- Email: ${st.email}`, `- Website: ${SITE_URL}`,
    `- Free shipping above ₹${s.commerce.free_shipping_above}; Cash on Delivery available; online payment via Razorpay.`, "",
    "## Collections", ...cats.map((c) => `- [${c.name}${c.name_mr ? " (" + c.name_mr + ")" : ""}](${SITE_URL}/collections/${c.slug})${c.description ? ": " + c.description : ""}`), "",
    "## Products", ...prods.map((p) => `- [${p.name}](${SITE_URL}/products/${p.slug}): ₹${p.price}${p.short_description ? ". " + p.short_description : ""}`), "",
    "## FAQ", ...(faq ? faqPairs(faq.body).flatMap((f) => [`### ${f.q}`, f.a, ""]) : []),
    "## Policies", `- Shipping: ${SITE_URL}/shipping-policy`, `- Returns: ${SITE_URL}/return-policy`, `- Refunds: ${SITE_URL}/refund-policy`, `- Privacy: ${SITE_URL}/privacy-policy`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
