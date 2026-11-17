import type { MetadataRoute } from "next";
import { siteOrigin } from "../src/lib/seo";
import { locales } from "../src/refolks/data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", ...locales.flatMap((locale) => [`/${locale}/cart`, `/${locale}/checkout`, `/${locale}/account`])],
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
