import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/api/", "/auth/", "/business/setup", "/unauthorized"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
