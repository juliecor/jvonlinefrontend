import type { Metadata } from "next"
import { Montserrat, Playfair_Display } from "next/font/google"
import "./johndorf.css"

/**
 * Johndorf's look — fonts, colours, keyframes — shared by the site's front
 * door (/, jvconline.ph is Johndorf's own site) and everything under /johndorf.
 */
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-jd-serif", display: "swap" })
const sans = Montserrat({ subsets: ["latin"], variable: "--font-jd-sans", display: "swap" })

export const johndorfMetadata: Metadata = {
  title: { absolute: "Johndorf Ventures Corporation", template: "%s · Johndorf Ventures Corporation" },
  description: "Johndorf Ventures Corporation — homes and communities for every Filipino family, since 1986.",
  manifest: null,
  icons: { icon: "/johndorf/mark.png", apple: "/johndorf/mark.png" },
  openGraph: {
    title: "Johndorf Ventures Corporation",
    description: "Homes and communities for every Filipino family, since 1986.",
    siteName: "Johndorf Ventures Corporation",
    images: [{ url: "/johndorf/logo.png", width: 391, height: 186, alt: "Johndorf Ventures Corporation" }],
  },
  twitter: { card: "summary", title: "Johndorf Ventures Corporation", images: ["/johndorf/logo.png"] },
  // Kept out of search results until Johndorf says the site is official. Flip this to index when it is.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export function JohndorfShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${serif.variable} ${sans.variable} min-h-screen bg-[#f7f4f2] font-[family-name:var(--font-jd-sans)] text-[#2a1d1b]`}>
      {children}
    </div>
  )
}
