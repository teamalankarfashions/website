import type { Metadata } from "next";
export const metadata: Metadata = { title: "My account", robots: { index: false, follow: true }, alternates: { canonical: "/account" } };
export default function L({ children }: { children: React.ReactNode }) { return children; }
