import type { MetadataRoute } from "next";
import { business } from "@/lib/business";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private tools: unlisted, and noindexed in their own metadata too.
      disallow: ["/snook", "/api/snook"],
    },
    sitemap: `${business.url}/sitemap.xml`,
  };
}
