import type { MetadataRoute } from "next";
import { business } from "@/lib/business";

// /gallery is left out (and noindexed) until it has real trip photos.
const ROUTES = ["", "/tours", "/about", "/contact", "/booking"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${business.url}${route}`,
    lastModified: new Date(),
  }));
}
