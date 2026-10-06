import type { Metadata } from "next"
import { Instrument_Serif } from "next/font/google"
import { api } from "@/lib/api"
import { Home, type PublicRealty } from "../home/home"

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-jv-serif", display: "swap" })

const description = "jvconline gives realty companies across the Philippines their own page, their own dashboard, and their agents a simple way to send buyers a sales offer."

export const metadata: Metadata = {
  title: "jvconline — Realties of the Philippines, online",
  description,
  openGraph: { title: "jvconline", description, siteName: "jvconline" },
  robots: { index: false, follow: false },
}

/**
 * /platform — the multi-realty platform's own page (realties on it, sign in).
 * jvconline.ph itself is Johndorf's site, so this lives one level down until
 * the platform gets its own name and domain.
 */
export default async function PlatformHomePage() {
  // Must render even when Laravel is down — then it just shows no realties.
  const realties = await api<PublicRealty[]>("/realties").catch(() => [] as PublicRealty[])
  return (
    <div className={serif.variable}>
      <Home realties={realties} />
    </div>
  )
}
