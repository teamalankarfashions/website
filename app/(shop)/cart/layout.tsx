import type { Metadata } from "next";
export const metadata: Metadata = { title: "Your bag", robots: { index: false, follow: true }, alternates: { canonical: "/cart" } };
export default function L({ children }: { children: React.ReactNode }) { return children; }
