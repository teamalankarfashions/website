import type { Metadata } from "next";
export const metadata: Metadata = { title: "Track your order", robots: { index: true, follow: true }, alternates: { canonical: "/track-order" } };
export default function L({ children }: { children: React.ReactNode }) { return children; }
