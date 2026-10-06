import type { Metadata } from "next"
import { JohndorfLanding } from "./johndorf/home/landing"
import { JohndorfShell, johndorfMetadata } from "./johndorf/shell"

const description = "Homes and communities for every Filipino family — across Cebu, Cagayan de Oro, Davao, Iligan and Butuan, since 1986."
const image = { url: "/johndorf/site/palmava.jpg", width: 1440, height: 810, alt: "Palmava by Johndorf" }

// Shared by link, so it carries its own preview.
export const metadata: Metadata = {
  ...johndorfMetadata,
  title: { absolute: "Johndorf Ventures Corporation — Always there." },
  description,
  openGraph: { title: "Johndorf Ventures Corporation — Always there.", description, siteName: "Johndorf Ventures Corporation", images: [image] },
  twitter: { card: "summary_large_image", title: "Johndorf Ventures Corporation — Always there.", description, images: [image.url] },
}

/** jvconline.ph — Johndorf's site. The landing page (lib/johndorf/company.ts); the Montierra map, login and dashboard live under /johndorf. */
export default function HomePage() {
  return (
    <JohndorfShell>
      <JohndorfLanding />
    </JohndorfShell>
  )
}
