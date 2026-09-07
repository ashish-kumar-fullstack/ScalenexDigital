import Link from "next/link";
import { ArrowUpRight, Camera as Instagram, Mail, Phone } from "lucide-react";
import { Brand } from "./brand";
import { services } from "@/lib/content";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand />
            <p>Build. Rank. Grow.</p>
            <p className="muted">
              Thoughtful digital solutions.
              <br />
              Built around your business.
            </p>
            <div className="socials">
              <a
                href="https://www.instagram.com/scalenexdigital/"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a href="mailto:scalenexdigital@gmail.com" aria-label="Email">
                <Mail size={20} />
              </a>
              <a href="tel:+916398520345" aria-label="Call">
                <Phone size={20} />
              </a>
            </div>
          </div>
          <div>
            <h3>Explore</h3>
            {[
              ["/about", "About us"],
              ["/projects", "Our work"],
              ["/reviews", "Client reviews"],
              ["/influencer-program", "Influencer program"],
              ["/login", "Partner login"],
            ].map(([url, title]) => (
              <Link href={url} key={url}>
                {title}
              </Link>
            ))}
          </div>
          <div>
            <h3>What we do</h3>
            {services.slice(0, 4).map((s) => (
              <Link href={"/services/" + s.slug} key={s.slug}>
                {s.name}
              </Link>
            ))}
            <Link href="/services">
              All services <ArrowUpRight size={14} />
            </Link>
          </div>
          <div>
            <h3>Let’s connect</h3>
            <a href="mailto:scalenexdigital@gmail.com">
              scalenexdigital@gmail.com
            </a>
            <a href="tel:+916398520345">+91 6398520345</a>
            <Link href="/contact">Send an enquiry ↗</Link>
            <span className="availability">
              <i /> Open to new conversations
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} ScaleNex Digital. All rights reserved.
          </span>
          <div>
            <Link href="/privacy-policy">Privacy policy</Link>
            <Link href="/terms">Terms of service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
