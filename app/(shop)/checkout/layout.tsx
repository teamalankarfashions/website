import type { Metadata } from "next";
export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: true }, alternates: { canonical: "/checkout" } };
export default function L({ children }: { children: React.ReactNode }) { return children; }
