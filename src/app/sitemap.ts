import type { MetadataRoute } from "next";
import { services } from "@/lib/content";
import { appUrl } from "@/lib/env";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "about",
    "services",
    "projects",
    "reviews",
    "influencer-program",
    "contact",
    "privacy-policy",
    "terms",
    ...services.map((s) => "services/" + s.slug),
  ].map((path) => ({
    url: `${appUrl()}/${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
