import type { MetadataRoute } from "next";
import { serverClient, SITE_URL } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = serverClient();
  const [{ data: cats }, { data: prods }, { data: pages }] = await Promise.all([
    sb.from("categories").select("slug,created_at").eq("active", true),
    sb.from("products").select("slug,updated_at,images").eq("active", true),
    sb.from("pages").select("slug,updated_at"),
  ]);
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/collections/all`, changeFrequency: "daily", priority: 0.9 },
    ...(cats ?? []).map((c) => ({ url: `${SITE_URL}/collections/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...(prods ?? []).map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.7, images: (p.images ?? []).slice(0, 3).map((i: { url: string }) => i.url) })),
    ...(pages ?? []).map((p) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: p.updated_at, changeFrequency: "monthly" as const, priority: 0.4 })),
    { url: `${SITE_URL}/contact`, priority: 0.5 },
    { url: `${SITE_URL}/track-order`, priority: 0.3 },
  ];
}
