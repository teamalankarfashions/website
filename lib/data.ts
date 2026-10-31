import { serverClient } from "./supabase";
import type { Category, Product, Settings } from "./types";
import { cache } from "react";

export const getSettings = cache(async (): Promise<Settings> => {
  const { data } = await serverClient().from("settings").select("key,value");
  const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return {
    store: m.store ?? {}, commerce: m.commerce ?? {}, home: m.home ?? { sections: {} },
    announcements: m.announcements ?? [], seo: m.seo ?? { title: "Alankar Fashions", description: "" },
  } as Settings;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data } = await serverClient().from("categories").select("*").eq("active", true).order("sort");
  return (data ?? []) as Category[];
});

export function tree(cats: Category[]) {
  const parents = cats.filter((c) => !c.parent_id);
  return parents.map((p) => ({ ...p, children: cats.filter((c) => c.parent_id === p.id) }));
}

const PRODUCT_COLS = "id,slug,name,name_mr,category_id,short_description,price,compare_at_price,stock,track_stock,images,tags,badge,is_featured,is_new,sort,created_at";

export async function getProducts(opts: { categoryIds?: string[]; featured?: boolean; isNew?: boolean; tag?: string; q?: string; sort?: string; limit?: number; min?: number; max?: number } = {}) {
  let q = serverClient().from("products").select(PRODUCT_COLS).eq("active", true);
  if (opts.categoryIds?.length) q = q.in("category_id", opts.categoryIds);
  if (opts.featured) q = q.eq("is_featured", true);
  if (opts.isNew) q = q.eq("is_new", true);
  if (opts.tag) q = q.contains("tags", [opts.tag]);
  if (opts.min) q = q.gte("price", opts.min);
  if (opts.max) q = q.lte("price", opts.max);
  if (opts.q) {
    const term = opts.q.replace(/[%,()]/g, " ").trim();
    q = q.or(`name.ilike.%${term}%,short_description.ilike.%${term}%,name_mr.ilike.%${term}%`);
  }
  switch (opts.sort) {
    case "price-asc": q = q.order("price"); break;
    case "price-desc": q = q.order("price", { ascending: false }); break;
    case "new": q = q.order("created_at", { ascending: false }); break;
    default: q = q.order("is_featured", { ascending: false }).order("sort");
  }
  const { data } = await q.limit(opts.limit ?? 60);
  return (data ?? []) as unknown as Product[];
}

export async function getProduct(slug: string) {
  const { data } = await serverClient().from("products").select("*").eq("slug", slug).eq("active", true).maybeSingle();
  return data as Product | null;
}

export async function getPage(slug: string) {
  const { data } = await serverClient().from("pages").select("*").eq("slug", slug).maybeSingle();
  return data as { slug: string; title: string; body: string; seo_description: string | null; updated_at: string } | null;
}

/** Turns "## Question\nAnswer" markdown into Q/A pairs. */
export function faqPairs(body: string) {
  return body.split(/^## /m).map((b) => b.trim()).filter(Boolean).map((b) => {
    const [q, ...rest] = b.split("\n");
    return { q: q.trim(), a: rest.join("\n").trim() };
  });
}
