import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://cdn.jsdelivr.net https://*.razorpay.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com https://player.vimeo.com",
  "media-src 'self' https://*.vimeocdn.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const oldCat: Record<string, string> = { vjratik: "vajratik", nakelace: "pearl-necklace", short: "short-necklace", long: "long-necklace" };

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\")" },
      ],
    }];
  },
  async redirects() {
    return [
      ...Object.entries(oldCat).map(([from, to]) => ({ source: "/products", has: [{ type: "query" as const, key: "category", value: from }], destination: `/collections/${to}`, permanent: true })),
      { source: "/products", has: [{ type: "query", key: "category", value: "(?<cat>[a-z0-9-]+)" }], destination: "/collections/:cat", permanent: true },
      { source: "/products", has: [{ type: "query", key: "filter", value: "new" }], destination: "/collections/all?sort=new", permanent: true },
      { source: "/products", destination: "/collections/all", permanent: true },
      { source: "/login", destination: "/account", permanent: true },
    ];
  },
};
export default nextConfig;
