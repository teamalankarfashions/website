import type { Metadata } from "next";
export const metadata: Metadata = { title: "Wishlist", robots: { index: false, follow: true }, alternates: { canonical: "/wishlist" } };
export default function L({ children }: { children: React.ReactNode }) { return children; }
