import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  MousePointer2,
  Search,
  TrendingUp,
  Layers,
  ShieldCheck,
  MessagesSquare,
  Compass,
  ChartNoAxesCombined,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, ServiceGrid, CTA, FAQ } from "@/components/public";
import { appUrl } from "@/lib/env";
export const metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "ScaleNex Digital — Build. Rank. Grow.",
    description: "A digital partner for your next stage of growth.",
    url: "/",
  },
};
export default async function Home() {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "ScaleNex Digital",
            url: appUrl(),
            email: "scalenexdigital@gmail.com",
            telephone: "+916398520345",
            sameAs: ["https://www.instagram.com/scalenexdigital/"],
          }).replace(/</g, "\\u003c"),
        }}
      />
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <Eyebrow>YOUR AMBITION. OUR DIGITAL EXPERTISE.</Eyebrow>
            <h1>
              Built for your
              <br />
              business.
              <br />
              <span>
                Made for <em>growth.</em>
              </span>
            </h1>
            <p>
              From your first website to your next big move.
              <br className="desktop-break" /> We bring strategy, design, and
              technology together
              <br className="desktop-break" /> to help your business move
              forward.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link href="/contact">
                  Book a Free Consultation <ArrowUpRight size={19} />
                </Link>
              </Button>
              <Link className="text-link" href="/services">
                Explore services <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hero-assurance">
              <span>
                <Check size={15} /> Strategy first
              </span>
              <span>
                <Check size={15} /> Built around you
              </span>
              <span>
                <Check size={15} /> Clear communication
              </span>
            </div>
          </div>
          <div
            className="growth-art"
            aria-label="Build, rank and grow: our connected approach"
          >
            <div className="art-grid" />
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="art-label">THE NEXT LEVEL IS YOURS.</span>
            <div className="growth-arrow">
              <ArrowUpRight strokeWidth={1.6} />
            </div>
            <div className="art-card card-build">
              <span className="art-icon blue">
                <Layers size={22} />
              </span>
              <div>
                <small>01 / FOUNDATION</small>
                <strong>Build.</strong>
                <span>A stronger digital presence</span>
              </div>
            </div>
            <div className="art-card card-rank">
              <span className="art-icon orange">
                <Search size={22} />
              </span>
              <div>
                <small>02 / VISIBILITY</small>
                <strong>Rank.</strong>
                <span>Show up. Stand out.</span>
              </div>
            </div>
            <div className="art-card card-grow">
              <span className="art-icon blue">
                <TrendingUp size={22} />
              </span>
              <div>
                <small>03 / MOMENTUM</small>
                <strong>Grow.</strong>
                <span>Turn attention into action</span>
              </div>
            </div>
            <span className="art-caption">
              <span /> CONNECTING IDEAS TO OPPORTUNITIES
            </span>
            <MousePointer2 className="art-cursor" size={30} />
          </div>
        </div>
        <div className="container hero-bottom">
          <span>ONE DIGITAL PARTNER. EVERY NEXT STEP.</span>
          <div>
            STRATEGY <b>✳</b> DESIGN <b>✳</b> TECHNOLOGY <b>✳</b> GROWTH
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <Eyebrow>WHAT WE BRING TO THE TABLE</Eyebrow>
            <h2>
              Everything you need.
              <br />
              <span className="muted-heading">Working together.</span>
            </h2>
          </div>
          <p>
            A great website is just the beginning. We connect the dots between
            how you look, where you’re found, and how you grow.
          </p>
        </div>
        <ServiceGrid limit={4} />
        <div className="center-link">
          <Link className="text-link" href="/services">
            Explore all 8 services <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="problem-section">
        <div className="container section">
          <div className="section-heading">
            <div>
              <Eyebrow>SOUND FAMILIAR?</Eyebrow>
              <h2>
                Big ambition.
                <br />A few digital roadblocks.
              </h2>
            </div>
            <p>
              You know your business has more to offer.
              <br />
              Let’s make sure your digital presence shows it.
            </p>
          </div>
          <div className="problem-grid">
            {[
              [
                "Your website isn’t doing you justice.",
                "Build a faster, clearer experience that turns a good first impression into a conversation.",
                Layers,
              ],
              [
                "The right people can’t find you.",
                "Connect search strategy and relevant content so customers can discover what you do.",
                Search,
              ],
              [
                "Your marketing feels disconnected.",
                "Bring your channels together around a focused plan and consistent brand experience.",
                ChartNoAxesCombined,
              ],
            ].map(([h, p, Icon], i) => {
              const I = Icon as typeof Layers;
              return (
                <div key={i}>
                  <I size={26} />
                  <h3>{String(h)}</h3>
                  <p>{String(p)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <Eyebrow>A CLEAR PATH FORWARD</Eyebrow>
            <h2>
              From “what if”
              <br />
              to what’s next.
            </h2>
          </div>
          <p>
            No confusing jargon. No disappearing acts.
            <br />
            Just a thoughtful process, with you at every step.
          </p>
        </div>
        <div className="process-grid">
          {[
            [
              "Discover",
              "We listen first. Your business, your audience, your goals.",
            ],
            [
              "Plan",
              "We turn the right questions into a clear scope and strategy.",
            ],
            [
              "Create",
              "We design, build, and refine with purpose and your feedback.",
            ],
            [
              "Launch & grow",
              "We launch carefully, measure what matters, and keep improving.",
            ],
          ].map(([h, p], i) => (
            <div key={h}>
              <span className="step">
                0{i + 1}
                <ArrowRight size={20} />
              </span>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section work-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <Eyebrow>WORK WITH PURPOSE</Eyebrow>
              <h2>
                Your next project
                <br />
                could start here.
              </h2>
            </div>
            <Link className="text-link" href="/projects">
              Our work <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="honest-work">
            <div className="work-symbol">
              <Layers size={62} strokeWidth={1} />
            </div>
            <div>
              <span className="eyebrow">SELECTED PROJECTS</span>
              <h3>Good work deserves the full story.</h3>
              <p>
                We’ll share approved project stories here as they become
                available. Until then, let’s talk about what we can build for
                your business.
              </p>
              <Link className="text-link" href="/contact">
                Discuss your project <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="section container why-grid">
        <div>
          <Eyebrow>THE SCALENEX DIGITAL APPROACH</Eyebrow>
          <h2>
            A partner in your
            <br />
            next chapter.
          </h2>
          <p className="muted">
            We bring care to the details and clarity to the big picture. Because
            your business deserves both.
          </p>
          <Link className="text-link" href="/about">
            Get to know us <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="why-cards">
          {[
            [
              Compass,
              "Strategy before solutions",
              "We start with what your business needs, then choose the right tools.",
            ],
            [
              ShieldCheck,
              "Clarity you can count on",
              "Defined scope, honest conversations, and transparent progress.",
            ],
            [
              MessagesSquare,
              "A collaborative approach",
              "Your perspective shapes the work from the first conversation.",
            ],
          ].map(([Icon, h, p], i) => {
            const I = Icon as typeof Compass;
            return (
              <div key={i}>
                <I size={23} />
                <div>
                  <h3>{String(h)}</h3>
                  <p>{String(p)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="partner-section">
        <div className="container partner-inner">
          <div>
            <Eyebrow>GOOD CONNECTIONS. SHARED GROWTH.</Eyebrow>
            <h2>
              Your network.
              <br />
              <span>Our expertise.</span>
            </h2>
            <p>
              Know a business ready for its next step? Become a referral
              partner, introduce us, and earn a commission on eligible client
              payments.
            </p>
            <Button asChild>
              <Link href="/influencer-program">
                Explore the influencer program <ArrowUpRight size={18} />
              </Link>
            </Button>
          </div>
          <div className="partner-graphic">
            <span>CONNECT.</span>
            <span>
              REFER.
              <ArrowUpRight />
            </span>
            <span className="orange-text">GROW TOGETHER.</span>
            <Link href="/login">
              Already a partner? Sign in <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="review-strip container">
        <MessagesSquare size={30} />
        <div>
          <h3>Real experiences. Shared with permission.</h3>
          <p>
            Approved customer reviews will appear here. We don’t publish
            unverified testimonials.
          </p>
        </div>
        <Link className="text-link" href="/reviews">
          Client reviews <ArrowUpRight size={17} />
        </Link>
      </section>
      <FAQ />
      <CTA />
    </>
  );
}
