import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alankarfashions.com";
export const LOGO_RED = "/brand/logo-red.png";
export const LOGO_LIGHT = "/brand/logo-light.png";

/** Server-side, anonymous, no session: for public catalogue reads. */
export function serverClient() {
  return createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

let browser: SupabaseClient | null = null;
/** Browser client with a persisted session (customer account + admin). */
export function browserClient() {
  if (!browser) browser = createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "alankar-auth" } });
  return browser;
}

/** Call the store API edge function. Sends the signed-in user's token when there is one. */
export async function api<T = any>(action: string, body: Record<string, unknown> = {}): Promise<T & { ok: boolean; error?: string }> {
  let token = SB_KEY;
  if (typeof window !== "undefined") {
    const { data } = await browserClient().auth.getSession();
    if (data.session?.access_token) token = data.session.access_token;
  }
  try {
    const r = await fetch(`${SB_URL}/functions/v1/api`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SB_KEY, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...body }),
    });
    return await r.json();
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again." } as any;
  }
}
