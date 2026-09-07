import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, ArrowLeft } from "lucide-react";
import { services } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Eyebrow, CTA } from "@/components/public";
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  return s
    ? {
        title: s.name,
        description: s.description,
        alternates: { canonical: "/services/" + slug },
        openGraph: {
          title: s.name + " | ScaleNex Digital",
          description: s.description,
          url: "/services/" + slug,
        },
      }
    : {};
}
export default async function Service({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  if (!s) notFound();
  return (
    <>
      <section className="container page-hero">
        <Link className="back-link" href="/services">
          <ArrowLeft size={16} /> All services
        </Link>
        <Eyebrow>{s.category} WITH SCALENEX DIGITAL</Eyebrow>
        <h1>{s.name}</h1>
        <p>{s.description}</p>
        <Button asChild>
          <Link href="/contact">
            Let’s discuss your project <ArrowUpRight size={18} />
          </Link>
        </Button>
      </section>
      <section className="container section pt-0 service-detail">
        <div>
          <h2>{s.short}</h2>
          <p>
            We start by understanding your business, your audience, and what you
            want to achieve. Together, we define a clear scope so the work has a
            purpose from day one.
          </p>
          <p>
            You’ll know what’s included, what we need from you, and how we’ll
            review progress before the project begins.
          </p>
        </div>
        <div className="included-card">
          <Eyebrow>WHAT WE CAN HELP WITH</Eyebrow>
          {s.items.map((t) => (
            <div key={t}>
              <Check size={20} />
              <h3>{t}</h3>
            </div>
          ))}
        </div>
      </section>
      <CTA />
    </>
  );
}
