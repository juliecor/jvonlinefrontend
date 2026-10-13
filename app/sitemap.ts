import type { MetadataRoute } from "next"

/** Just the public face: Johndorf's landing page and its open accreditation form. */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvconline.ph"
  return [
    { url: `${site}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/accreditation`, changeFrequency: "yearly", priority: 0.5 },
  ]
}
