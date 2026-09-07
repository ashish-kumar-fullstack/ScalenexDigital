import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/influencer/",
        "/api/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: appUrl() + "/sitemap.xml",
  };
}
