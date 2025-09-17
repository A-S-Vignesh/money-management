import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/"], // block private pages
    },
    sitemap: "https://moneynestapp.vercel.app/sitemap.xml",
  };
}
