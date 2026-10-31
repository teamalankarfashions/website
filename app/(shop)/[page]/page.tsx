import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { faqPairs, getPage } from "@/lib/data";
import Markdown from "@/components/Markdown";
import { fmtDay } from "@/lib/format";

type P = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getPage((await params).page);
  if (!p) return {};
  return { title: p.title, description: p.seo_description ?? undefined, alternates: { canonical: `/${p.slug}` } };
}

export default async function ContentPage({ params }: P) {
  const p = await getPage((await params).page);
  if (!p) notFound();
  const faq = p.slug === "faq" ? faqPairs(p.body) : null;
  const ld = faq ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) } : null;
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      <div className="phead"><div className="wrap"><h1>{p.title}</h1>{p.slug.includes("policy") || p.slug.includes("terms") ? <p>Last updated {fmtDay(p.updated_at)}</p> : null}</div></div>
      <div className="wrap">
        {faq ? (
          <div className="faq prose">{faq.map((f, i) => <details key={i} open={i < 2}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
        ) : <article className="prose"><Markdown text={p.body} /></article>}
      </div>
    </>
  );
}
