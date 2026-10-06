import type { MetadataRoute } from "next"

/** Search engines may index Johndorf's public pages; everything operational stays out. */
export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvconline.ph"
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/platform", "/offer/", "/register/", "/*/login", "/*/dashboard", "/*/join/", "/johndorf/montierra"] }],
    sitemap: `${site}/sitemap.xml`,
  }
}
