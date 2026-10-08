import type { Metadata } from "next"
import Link from "next/link"
import { ApiError, api } from "@/lib/api"
import { RealtyMark } from "@/components/form"
import { todayManila } from "@/lib/format"
import { type AccreditationDocumentRow, AccreditationForm } from "./accreditation-form"

export const metadata: Metadata = { title: "Realty accreditation", robots: { index: false, follow: false } }

type Invite = {
  developer: { name: string; logo_url: string | null; accent_color: string | null }
  email: string
  expires_at: string
  documents: AccreditationDocumentRow[]
  civil_statuses: string[]
}

/** jvconline.ph/accreditation/<token> — where the accreditation invite email lands. The token alone identifies the invite. */
export default async function AccreditationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  let invite: Invite | null = null
  let problem: string | null = null
  try {
    invite = await api<Invite>(`/accreditation/${encodeURIComponent(token)}`)
  } catch (e) {
    problem = e instanceof ApiError && (e.status === 404 || e.status === 410) ? e.message : "We couldn't check this link right now. Please try again in a moment."
  }

  const accent = invite?.developer.accent_color ?? "#b4241c"
  const today = todayManila()
  // The representative has to be an adult: the latest date of birth that still counts.
  const [year, month, day] = today.split("-")
  const adultBy = `${Number(year) - 18}-${month}-${day}`

  return (
    <main style={{ ["--accent" as string]: accent }} className="min-h-screen bg-[#ebe8e2] px-3 py-6 text-[#17150f] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-[880px] border border-[#e0dcd5] bg-white shadow-[0_24px_60px_-28px_rgba(23,21,15,0.45)]">
        <div aria-hidden className="h-1.5 bg-[var(--accent)]" />

        {invite ? (
          <>
            <header className="px-6 pb-9 pt-10 text-center sm:px-14 sm:pt-14">
              <div className="flex justify-center">
                <RealtyMark name={invite.developer.name} logo={invite.developer.logo_url} className="h-16 sm:h-20" />
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-[#8a847a]">Invited by</p>
              <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{invite.developer.name}</p>
            </header>

            <div className="border-t border-[#e6e2db] px-5 pb-12 pt-10 sm:px-14">
              <h1 className="text-center text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">Realty Accreditation</h1>
              <p className="mx-auto mt-3 max-w-xl text-center text-[15px] leading-relaxed text-[#5a554d]">
                Tell us about your realty and attach your registration documents. {invite.developer.name} reviews every form and emails you the login for your dashboard once it is accepted.
              </p>
              <div className="mt-12">
                <AccreditationForm token={token} developer={invite.developer.name} email={invite.email} documents={invite.documents} civilStatuses={invite.civil_statuses} today={today} adultBy={adultBy} />
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 py-14 text-center sm:px-14">
            <h1 className="text-2xl font-bold tracking-tight">This link doesn&apos;t work</h1>
            <p className="mx-auto mt-3 max-w-md text-[#5a554d]">{problem}</p>
            <Link href="/" className="mt-7 inline-block text-sm font-bold text-[var(--accent)] underline-offset-4 hover:underline">
              Go to the Johndorf website
            </Link>
          </div>
        )}

        <footer className="border-t border-[#e6e2db] bg-[#faf8f5] px-6 py-5 text-center text-xs text-[#8a847a]">
          © {new Date().getFullYear()} {invite?.developer.name ?? "Johndorf Ventures Corporation"} · Powered by jvconline
        </footer>
      </div>
    </main>
  )
}
