import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: s.seo.title, template: "%s | Alankar Fashions" },
    description: s.seo.description,
    applicationName: "Alankar Fashions",
    icons: { icon: "/brand/icon.png", apple: "/brand/icon.png" },
    openGraph: { type: "website", siteName: "Alankar Fashions", locale: "en_IN", url: SITE_URL, title: s.seo.title, description: s.seo.description, images: [{ url: "/brand/og.jpg", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: s.seo.title, description: s.seo.description, images: ["/brand/og.jpg"] },
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
  };
}
export const viewport: Viewport = { themeColor: "#5C0A12", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=Amita:wght@400;700&family=Jost:wght@400;500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
