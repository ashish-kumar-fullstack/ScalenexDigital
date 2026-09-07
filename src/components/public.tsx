import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Globe,
  Search,
  MessageCircle,
  MousePointer2,
  Target,
  Video,
  Workflow,
  Code2,
  Plus,
} from "lucide-react";
import { services, faqs } from "@/lib/content";
import { Button } from "./ui/button";
const icons = {
  Globe,
  Search,
  MessageCircle,
  MousePointer2,
  Target,
  Video,
  Workflow,
  Code2,
};
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="eyebrow">
      <span />
      {children}
    </span>
  );
}
export function ServiceGrid({ limit }: { limit?: number }) {
  return (
    <div className="service-grid">
      {services.slice(0, limit).map((s, i) => {
        const Icon = icons[s.icon];
        return (
          <Link
            className="service-card"
            href={"/services/" + s.slug}
            key={s.slug}
          >
            <div className="service-card-top">
              <span className={"icon-box tone-" + (i % 3)}>
                <Icon size={24} />
              </span>
              <ArrowUpRight size={22} />
            </div>
            <h3>{s.name}</h3>
            <p>{s.short}</p>
            <span className="text-link">
              Explore service <ArrowRight size={16} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
export function CTA() {
  return (
    <section className="cta-section">
      <div className="container cta-inner">
        <div>
          <Eyebrow>YOUR NEXT CHAPTER STARTS HERE</Eyebrow>
          <h2>
            Let’s build something
            <br />
            <em>that moves you forward.</em>
          </h2>
          <p>Tell us where you want to go. We’ll help you find the way.</p>
        </div>
        <Button asChild>
          <Link href="/contact">
            Book a Free Consultation <ArrowUpRight size={20} />
          </Link>
        </Button>
      </div>
    </section>
  );
}
export function FAQ() {
  return (
    <section className="section container faq-layout">
      <div>
        <Eyebrow>A LITTLE MORE CLARITY</Eyebrow>
        <h2>
          Good questions.
          <br />
          Straight answers.
        </h2>
        <p className="muted">Still have something on your mind?</p>
        <Link className="text-link" href="/contact">
          Let’s talk <ArrowUpRight size={18} />
        </Link>
      </div>
      <div>
        {faqs.map(([q, a]) => (
          <details className="faq" key={q}>
            <summary>
              {q}
              <Plus size={18} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
