import type { MetadataRoute } from "next";
import { business } from "@/config/business";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "products",
    "about",
    "contact",
    "suppliers",
    "shipping",
    "returns",
    "privacy",
    "terms",
  ];
  return paths.map((path) => ({
    url: `https://${business.domain}/${path}${path ? "/" : ""}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
