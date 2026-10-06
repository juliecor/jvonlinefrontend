import type { Metadata } from "next"
import { Instrument_Serif } from "next/font/google"
import { api } from "@/lib/api"
import { Home, type PublicRealty } from "./home/home"

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-jv-serif", display: "swap" })

const description = "jvonline gives realty companies across the Philippines their own page, their own dashboard, and their agents a simple way to send buyers a sales offer."

export const metadata: Metadata = {
  title: "jvonline — Realties of the Philippines, online",
  description,
  openGraph: { title: "jvonline", description, siteName: "jvonline" },
}

/** jvconline.ph — the platform's front door. Lists the realties that are live; "Sign in" leads to the logins. */
export default async function HomePage() {
  // The home page must render even when Laravel is down — then it just shows no realties.
  const realties = await api<PublicRealty[]>("/realties").catch(() => [] as PublicRealty[])
  return (
    <div className={serif.variable}>
      <Home realties={realties} />
    </div>
  )
}
