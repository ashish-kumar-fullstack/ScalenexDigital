import type { Metadata } from "next";
import { headers } from "next/headers";
import { appUrl } from "@/lib/env";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "ScaleNex Digital — Build. Rank. Grow.",
    template: "%s | ScaleNex Digital",
  },
  description:
    "Website development, SEO, digital marketing, AI automation and custom software. Build your next chapter with ScaleNex Digital.",
  openGraph: { siteName: "ScaleNex Digital", type: "website", locale: "en_IN" },
  robots: { index: true, follow: true },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await headers();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
