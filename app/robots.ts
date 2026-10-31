import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/supabase";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/account", "/cart", "/order-success", "/search"] }], sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
