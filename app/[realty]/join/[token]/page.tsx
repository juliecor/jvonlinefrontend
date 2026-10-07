import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CalendarClock, Check, Link2Off, Lock, MapPin, UserCheck } from "lucide-react"
import { ApiError, api } from "@/lib/api"
import { longDate } from "@/lib/format"
import { COMPANY } from "@/lib/johndorf/company"
import { SITE_REALTY } from "@/lib/public-projects-types"
import { type PublicRealty, realtyBySlug } from "@/lib/realty-auth"
import { realtyIcons } from "@/lib/realty-icon"
import { JoinForm } from "./join-form"

type Props = { params: Promise<{ realty: string; token: string }> }
type Invite = { realty: PublicRealty; name: string; email: string | null; phone: string | null; invited_by: string | null; expires_at: string }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const realty = await realtyBySlug((await params).realty)
  return { title: `Join ${realty.name}`, robots: { index: false, follow: false }, icons: realtyIcons(realty.slug) }
}

/**
 * Johndorf's side of the page: its head office and facts from its own site
 * (lib/johndorf/company.ts — nothing invented). Other realties get their
 * colour and logo; facts only appear once a realty has given us real ones.
 */
const JOHNDORF = {
  photo: "/johndorf/site/tower.jpg",
  caption: "Johndorf Tower, Cebu Business Park · head office",
  facts: [
    { value: String(COMPANY.founded), label: "Founded in Iligan City" },
    { value: "50+", label: "Communities" },
    { value: "5", label: "Cities in Visayas & Mindanao" },
  ],
}

const PERKS = [
  "Send buyers a sales offer with the price, payment schedule and your contact details",
  "See when a buyer opens it, and get their answer by email",
  "Every project, unit and price list in one place, on your phone",
]

/** jvconline.ph/<realty>/join/<token> — an invited agent sets up their login. */
export default async function JoinPage({ params }: Props) {
  const { realty: slug, token } = await params
  const realty = await realtyBySlug(slug)

  let invite: Invite | null = null
  let problem: string | null = null
  try {
    invite = await api<Invite>(`/join/${encodeURIComponent(token)}`)
    if (invite.realty.slug !== slug) {
      invite = null
      problem = "This invitation is for a different realty."
    }
  } catch (e) {
    problem = e instanceof ApiError && (e.status === 404 || e.status === 410) ? e.message : "We couldn't check this link right now. Please try again in a moment."
  }

  const accent = realty.accent_color ?? "#1f2937"
  const brand = slug === SITE_REALTY ? JOHNDORF : null
  const short = slug === SITE_REALTY ? "Johndorf" : realty.name

  return (
    <main style={{ ["--accent" as string]: accent }} className="min-h-screen bg-[#f6f4f0] text-[#17150f] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* The realty */}
      <aside
        className="relative isolate flex flex-col justify-between gap-10 overflow-hidden bg-[var(--accent)] px-5 pb-8 pt-6 text-white sm:px-10 sm:pb-10 sm:pt-8 lg:sticky lg:top-0 lg:h-screen lg:px-14 lg:py-12"
        style={brand ? undefined : { backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 75%, transparent 75%)", backgroundSize: "28px 28px" }}
      >
        {brand && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.photo} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#120d0c] via-[#120d0c]/70 to-[#120d0c]/25" />
          </>
        )}
        <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[var(--accent)]" />

        <Link href={slug === SITE_REALTY ? "/" : `/${slug}/login`} className="inline-flex self-start bg-white px-4 py-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]">
          {realty.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={realty.logo_url} alt={realty.name} className="h-9 w-auto max-w-[220px] object-contain sm:h-11 lg:h-14" />
          ) : (
            <span className="text-xl font-bold tracking-tight text-[#17150f]">{realty.name}</span>
          )}
        </Link>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">Agent invitation</p>
          <h2 className="mt-3 max-w-xl text-[2rem] font-bold leading-[1.08] tracking-tight sm:text-5xl">Join the {short} sales team.</h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/85 sm:text-base">
            {realty.name} has invited you to sell its homes. Your account opens its dashboard: projects, prices and sales offers for your buyers.
          </p>

          {brand ? (
            <>
              <dl className="mt-8 grid max-w-xl grid-cols-3 border-t border-white/25 pt-5">
                {brand.facts.map((f) => (
                  <div key={f.label} className="pr-3">
                    <dt className="sr-only">{f.label}</dt>
                    <dd className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">{f.value}</dd>
                    <dd className="mt-1 text-xs leading-snug text-white/75 sm:text-sm">{f.label}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 hidden items-center gap-2 text-xs text-white/65 sm:flex">
                <MapPin className="h-3.5 w-3.5 shrink-0" /> {brand.caption}
              </p>
            </>
          ) : (
            <ul className="mt-8 hidden max-w-lg space-y-3 border-t border-white/25 pt-6 sm:block">
              {PERKS.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] text-white/90">
                  <Check className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} /> {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* The form */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="w-full max-w-[480px]">
          {invite ? (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Apply to join</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welcome, {invite.name.split(" ")[0]}.</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5a554d]">Tell {short} how to reach you, attach your resume, and choose the email and password you&apos;ll sign in with. {short} reviews your application, and your account opens once it&apos;s approved.</p>

              <dl className="mt-6 grid border border-[#e0dcd5] bg-white sm:grid-cols-2">
                <div className="flex items-start gap-3 border-b border-[#e0dcd5] px-4 py-3.5 sm:border-b-0 sm:border-r">
                  <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a847a]">Invited by</dt>
                    <dd className="mt-0.5 text-sm font-bold">{invite.invited_by ?? realty.name}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a847a]">Link valid until</dt>
                    <dd className="mt-0.5 text-sm font-bold">{longDate(invite.expires_at)}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-8">
                <JoinForm token={token} name={invite.name} email={invite.email} phone={invite.phone} />
              </div>

              <div className="mt-10 border-t border-[#e0dcd5] pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b665d]">What you get</p>
                <ul className="mt-3 space-y-2.5">
                  {PERKS.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm text-[#3d3a34]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" strokeWidth={2.75} /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center bg-[var(--accent)] text-white">
                <Link2Off className="h-6 w-6" />
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight">This link doesn&apos;t work.</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5a554d]">{problem}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-[#5a554d]">Ask {short} to send you a new invitation link. Already have an account? Sign in instead.</p>
              <Link href={`/${slug}/login`} className="mt-7 inline-flex items-center gap-2 bg-[var(--accent)] px-6 py-3.5 text-[15px] font-bold text-white transition hover:brightness-110">
                Go to sign in <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}

          <p className="mt-10 flex items-center gap-2 text-xs text-[#8a847a]">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              Secure sign-up for {realty.name} · Powered by{" "}
              <Link href="/platform" className="font-semibold text-[#6b665d] hover:text-[#17150f]">
                jvconline
              </Link>
            </span>
          </p>
        </div>
      </section>
    </main>
  )
}
