import type { MetadataRoute } from "next";
import { business } from "@/config/business";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `https://${business.domain}/sitemap.xml`,
  };
}
