"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container nav">
        <Brand />
        <button
          className="mobile-toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          className={open ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
        >
          {[
            ["/", "Home"],
            ["/about", "About us"],
            ["/services", "Services"],
            ["/projects", "Our work"],
            ["/influencer-program", "Partner with us"],
          ].map(([href, text]) => (
            <Link
              key={href}
              href={href}
              className={path === href ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              {text}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href="/contact" onClick={() => setOpen(false)}>
              Let’s talk <ArrowUpRight size={17} />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
