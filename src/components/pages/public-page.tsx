import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Mail,
  Phone,
  Camera as Instagram,
  Check,
  Layers,
  MessagesSquare,
} from "lucide-react";
import { Eyebrow, ServiceGrid, CTA, FAQ } from "@/components/public";
import { Button } from "@/components/ui/button";
const pages: Record<
  string,
  { title: string; description: string; kicker: string }
> = {
  about: {
    title: "Digital expertise. A human approach.",
    description:
      "ScaleNex Digital brings strategy, design, and technology together to help businesses build a stronger digital presence.",
    kicker: "ABOUT SCALENEX DIGITAL",
  },
  services: {
    title: "The right tools for your next chapter.",
    description:
      "From a strong digital foundation to a connected growth strategy. Explore the ways we can help your business move forward.",
    kicker: "OUR SERVICES",
  },
  projects: {
    title: "Thoughtful work. Real stories.",
    description:
      "A home for approved project stories, the challenges behind them, and the thinking that shapes our work.",
    kicker: "OUR WORK",
  },
  reviews: {
    title: "Trust is earned. One project at a time.",
    description:
      "We publish customer feedback with permission, with the context and care it deserves.",
    kicker: "CLIENT REVIEWS",
  },
  "influencer-program": {
    title: "Good connections deserve shared growth.",
    description:
      "Introduce business owners to ScaleNex Digital and earn commission on eligible payments from the projects you help bring to life.",
    kicker: "THE INFLUENCER PROGRAM",
  },
  contact: {
    title: "Your next chapter starts with a conversation.",
    description:
      "Tell us about your business, what you’re working on, and where you’d like to go. Your first consultation is free.",
    kicker: "LET’S TALK",
  },
  "privacy-policy": {
    title: "Your information, handled with care.",
    description:
      "How ScaleNex Digital uses information shared through this website and our referral portal.",
    kicker: "PRIVACY POLICY",
  },
  terms: {
    title: "A clear foundation for working together.",
    description:
      "Terms for using the ScaleNex Digital website and influencer referral portal.",
    kicker: "TERMS OF SERVICE",
  },
};
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = pages[slug];
  return p
    ? {
        title: p.kicker,
        description: p.description,
        alternates: { canonical: "/" + slug },
        openGraph: {
          title: p.title,
          description: p.description,
          url: "/" + slug,
        },
      }
    : {};
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = pages[slug];
  if (!p) notFound();
  return (
    <>
      <section className="page-hero container">
        <Eyebrow>{p.kicker}</Eyebrow>
        <h1>{p.title}</h1>
        <p>{p.description}</p>
      </section>
      {slug === "services" ? (
        <section className="container section pt-0">
          <ServiceGrid />
        </section>
      ) : slug === "about" ? (
        <>
          <section className="container section pt-0 about-grid">
            <div className="about-manifesto">
              BUILD.
              <br />
              RANK.
              <br />
              <span>GROW.</span>
              <ArrowUpRight size={92} />
            </div>
            <div>
              <h2>
                Your business goals.
                <br />
                Our starting point.
              </h2>
              <p>
                Digital tools should make it easier for your business to move
                forward. We start by understanding your customers, your
                priorities, and the challenges standing in your way.
              </p>
              <p>
                Then we connect the right mix of design, development, marketing,
                and automation into a practical plan. From the first
                conversation to delivery, we keep the work clear and
                collaborative.
              </p>
              <div className="check-list">
                {[
                  "Purposeful design and development",
                  "Clear scope and open communication",
                  "Connected thinking across digital channels",
                  "A focus on your business needs",
                ].map((t) => (
                  <span key={t}>
                    <Check size={18} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>
          <FAQ />
        </>
      ) : slug === "projects" || slug === "reviews" ? (
        <section className="container section pt-0">
          <div className="empty-state public-empty">
            {slug === "projects" ? (
              <Layers size={42} />
            ) : (
              <MessagesSquare size={42} />
            )}
            <h2>
              {slug === "projects"
                ? "Project stories are on the way."
                : "Customer stories, shared thoughtfully."}
            </h2>
            <p>
              {slug === "projects"
                ? "Approved project details will be published here. Talk to us about your requirements and the approach we would recommend."
                : "There are no published reviews yet. This page is reserved for verified feedback that customers have approved for sharing."}
            </p>
            <Button asChild>
              <Link href="/contact">
                Let’s discuss your business <ArrowUpRight size={18} />
              </Link>
            </Button>
          </div>
        </section>
      ) : slug === "contact" ? (
        <section className="container section pt-0 contact-grid">
          <div className="contact-panel">
            <h2>Let’s hear your idea.</h2>
            <p>
              Choose the easiest way to reach us. Share your business name, the
              service you’re interested in, and a little about your goals.
            </p>
            <a href="mailto:scalenexdigital@gmail.com">
              <Mail />
              <span>
                <small>EMAIL US</small>scalenexdigital@gmail.com
              </span>
              <ArrowUpRight />
            </a>
            <a href="tel:+916398520345">
              <Phone />
              <span>
                <small>CALL US</small>+91 6398520345
              </span>
              <ArrowUpRight />
            </a>
            <a href="https://www.instagram.com/scalenexdigital/">
              <Instagram />
              <span>
                <small>FIND US ON INSTAGRAM</small>@scalenexdigital
              </span>
              <ArrowUpRight />
            </a>
          </div>
          <div className="consult-card">
            <Eyebrow>LET’S START A CONVERSATION</Eyebrow>
            <h2>Tell us what’s next.</h2>
            <p>
              Share a few details and send your enquiry directly to our team.
            </p>
            <ContactForm />
          </div>
        </section>
      ) : slug === "influencer-program" ? (
        <>
          <section className="container section pt-0">
            <div className="section-heading">
              <div>
                <h2>
                  You make the introduction.
                  <br />
                  We take it from there.
                </h2>
              </div>
              <p>
                Built for creators and connectors who know business owners ready
                to invest in their digital presence.
              </p>
            </div>
            <div className="process-grid">
              {[
                [
                  "Connect",
                  "Complete the public registration form with your contact details and a private password.",
                ],
                [
                  "Get your referral code",
                  "Your account is activated and your unique referral code is generated automatically.",
                ],
                [
                  "Refer with consent",
                  "Submit interested businesses securely and follow each lead’s progress.",
                ],
                [
                  "Track your earnings",
                  "View your approved commissions and payment updates in your partner portal.",
                ],
              ].map(([h, t], i) => (
                <div key={h}>
                  <span className="step">0{i + 1}</span>
                  <h3>{h}</h3>
                  <p>{t}</p>
                </div>
              ))}
            </div>
            <div className="program-callout">
              <div>
                <h2>
                  Clear attribution.
                  <br />
                  Transparent tracking.
                </h2>
                <p>
                  Commission rates follow the plan agreed with you. Standard
                  tiers are 20% for projects below ₹20,000, 30% from ₹20,000 to
                  below ₹40,000, and 40% from ₹40,000. Your account’s applicable
                  plan is confirmed by the admin team.
                </p>
                <p>
                  Commission is calculated on eligible client payments received.
                  A referral or proposed project value alone does not create an
                  entitlement to payment.
                </p>
                <Button asChild>
                  <Link href="/register">
                    Register as an influencer <ArrowUpRight size={18} />
                  </Link>
                </Button>
              </div>
              <div className="program-benefits">
                {[
                  "Your own secure referral dashboard",
                  "Automatic referral attribution",
                  "Lead updates and visible admin notes",
                  "Commission and payment tracking",
                  "Instant account activation",
                ].map((t) => (
                  <span key={t}>
                    <Check size={20} />
                    {t}
                  </span>
                ))}
                <Link className="text-link" href="/login">
                  Already registered? Partner login <ArrowRightIcon />
                </Link>
              </div>
            </div>
          </section>
          <FAQ />
        </>
      ) : (
        <section className="container legal section pt-0">
          {slug === "privacy-policy" ? (
            <>
              <h2>Information we receive</h2>
              <p>
                When you contact us, we receive the information you choose to
                share, such as your name, email, phone number, business details,
                and enquiry. The partner portal also stores account details,
                consented business referrals, lead progress, commission records,
                and payment references.
              </p>
              <h2>How we use information</h2>
              <p>
                We use this information to respond to enquiries, provide agreed
                services, manage referral relationships, secure accounts, record
                attribution, and administer commissions. Partners must obtain
                permission before submitting a customer’s details.
              </p>
              <h2>Access and service providers</h2>
              <p>
                Administrators can access records needed to operate the program.
                Influencers can access their own leads and earnings. Our
                hosting, database, and email providers process information
                required to operate the service. We do not sell referral contact
                lists.
              </p>
              <h2>Security and cookies</h2>
              <p>
                The portal uses essential session cookies for sign-in and
                security. Passwords are stored as hashes. Security logs record
                account and financial changes without recording passwords or
                reset tokens. External WhatsApp, Instagram, and email services
                have their own privacy practices.
              </p>
              <h2>Retention and your choices</h2>
              <p>
                We retain information for service delivery, account management,
                dispute resolution, and applicable recordkeeping requirements.
                Contact us to request access, correction, or deletion. Some
                records may need to be retained for legitimate obligations.
              </p>
              <h2>Contact</h2>
              <p>
                For privacy requests, email{" "}
                <a href="mailto:scalenexdigital@gmail.com">
                  scalenexdigital@gmail.com
                </a>
                .
              </p>
            </>
          ) : (
            <>
              <h2>Using this website</h2>
              <p>
                This website describes ScaleNex Digital services. Scope,
                delivery timelines, fees, third-party costs, and support terms
                are set out in a separate project agreement. Website content is
                not a guarantee of rankings, leads, revenue, or other results.
              </p>
              <h2>Partner accounts</h2>
              <p>
                Registered partners receive individual accounts. Keep
                credentials private, provide accurate information, and submit
                business contact details only with customer consent. Do not
                attempt to access another partner’s information or misrepresent
                referral ownership.
              </p>
              <h2>Referrals and commission</h2>
              <p>
                Referrals are reviewed by the admin team. Duplicate or disputed
                referrals may require additional review, and the admin team
                records ownership decisions. Commission is based on the
                applicable plan and eligible client payments actually received,
                subject to approval. A submitted lead does not guarantee
                conversion or commission.
              </p>
              <h2>Payment and disputes</h2>
              <p>
                Payment status and approved amounts are available in the portal.
                Contact us if you believe a record is incorrect. Timing,
                adjustments, and any applicable deductions should be confirmed
                in your partnership agreement. Account access may be suspended
                for misuse or while a dispute is reviewed.
              </p>
              <h2>Intellectual property</h2>
              <p>
                Website content and brand assets may not be copied or presented
                as your own. Ownership and licensing of client deliverables are
                defined in the applicable project agreement.
              </p>
              <h2>Contact and updates</h2>
              <p>
                For questions about these terms, email{" "}
                <a href="mailto:scalenexdigital@gmail.com">
                  scalenexdigital@gmail.com
                </a>
                . We may update these terms as the service evolves.
              </p>
            </>
          )}
        </section>
      )}
      {!["contact", "privacy-policy", "terms"].includes(slug) && <CTA />}
    </>
  );
}
function ArrowRightIcon() {
  return <ArrowUpRight size={18} />;
}
