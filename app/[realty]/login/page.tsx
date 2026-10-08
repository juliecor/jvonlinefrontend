import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Check, CircleCheck, Info, Lock, MapPin } from "lucide-react"
import { COMPANY, STATS } from "@/lib/johndorf/company"
import { SITE_REALTY } from "@/lib/public-projects-types"
import { currentRealtyUser, realtyBySlug } from "@/lib/realty-auth"
import { realtyIcons } from "@/lib/realty-icon"
import { RealtyLoginForm } from "./login-form"

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ registered?: string; joined?: string; applied?: string; ended?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const realty = await realtyBySlug((await params).realty)
  return { title: `Sign in · ${realty.name}`, robots: { index: false, follow: false }, icons: realtyIcons(realty.slug) }
}

/** Johndorf's side of the page: its head office and facts from its own site (lib/johndorf/company.ts, nothing invented). */
const JOHNDORF = {
  photo: "/johndorf/site/tower.jpg",
  caption: "Johndorf Tower, Cebu Business Park · head office",
  facts: [
    { value: String(COMPANY.founded), label: "Founded in Iligan City" },
    ...STATS.filter((s) => s.label !== "Years of building homes" && !s.label.startsWith("PropertyGuru")).map((s) => ({ value: `${s.value}${s.suffix}`, label: s.label })),
  ],
}

const FEATURES = ["Every project, unit and price list in one place", "Sales offers with the payment schedule, sent in a minute", "Know when buyers open them, and what they answer"]

/** jvconline.ph/<realty>/login — the realty's own door. Staff and agents both sign in here. */
export default async function RealtyLoginPage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const [realty, session, query] = await Promise.all([realtyBySlug(slug), currentRealtyUser(), searchParams])
  if (session?.user.realty.slug === slug) redirect(`/${slug}/dashboard`)

  const accent = realty.accent_color ?? "#1f2937"
  const brand = slug === SITE_REALTY ? JOHNDORF : null
  const short = slug === SITE_REALTY ? "Johndorf" : realty.name
  const notice = query.registered
    ? "Your realty is registered. Sign in to open your dashboard."
    : query.applied
      ? `Your application is in. ${realty.name} will review it, and you can sign in here once it's approved.`
      : query.joined
        ? "Your password is set. Sign in to get started."
        : null

  return (
    <main style={{ ["--accent" as string]: accent }} className="min-h-screen bg-[#f6f4f0] text-[#17150f] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* The realty */}
      <aside
        className="relative isolate flex flex-col justify-between gap-8 overflow-hidden bg-[var(--accent)] px-5 pb-7 pt-6 text-white sm:px-10 sm:pb-10 sm:pt-8 lg:sticky lg:top-0 lg:h-screen lg:gap-10 lg:px-14 lg:py-12"
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

        <Link href={slug === SITE_REALTY || realty.kind === "broker" ? "/" : `/${slug}/login`} className="inline-flex self-start bg-white px-4 py-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]">
          {realty.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={realty.logo_url} alt={realty.name} className="h-9 w-auto max-w-[220px] object-contain sm:h-11 lg:h-14" />
          ) : (
            <span className="text-xl font-bold tracking-tight text-[#17150f]">{realty.name}</span>
          )}
        </Link>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">{brand ? COMPANY.tagline : realty.developer ? `Accredited by ${realty.developer.name}` : "Sales dashboard"}</p>
          <h2 className="mt-3 max-w-xl text-[1.75rem] font-bold leading-[1.08] tracking-tight sm:text-5xl">{short}&apos;s sales dashboard.</h2>
          <p className="mt-4 hidden max-w-lg text-base leading-relaxed text-white/85 sm:block">Projects, price lists, sales offers and your buyers&apos; answers, in one place, on your phone or your desk.</p>

          {brand ? (
            <>
              <dl className="mt-8 hidden max-w-xl grid-cols-3 border-t border-white/25 pt-5 sm:grid">
                {brand.facts.map((f) => (
                  <div key={f.label} className="pr-3">
                    <dt className="sr-only">{f.label}</dt>
                    <dd className="text-3xl font-bold tabular-nums tracking-tight">{f.value}</dd>
                    <dd className="mt-1 text-sm leading-snug text-white/75">{f.label}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 hidden items-center gap-2 text-xs text-white/65 sm:flex">
                <MapPin className="h-3.5 w-3.5 shrink-0" /> {brand.caption}
              </p>
            </>
          ) : (
            <ul className="mt-8 hidden max-w-lg space-y-3 border-t border-white/25 pt-6 sm:block">
              {FEATURES.map((f) => (
                <li key={f} className="flex gap-3 text-[15px] text-white/90">
                  <Check className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} /> {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* The form */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="w-full max-w-[440px]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Admin &amp; agent sign in</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back.</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5a554d]">Sign in to {realty.name}&apos;s dashboard with the email and password you set up.</p>

          {notice && (
            <p role="status" className="mt-6 flex gap-3 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-[15px] font-semibold text-emerald-900">
              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /> {notice}
            </p>
          )}

          {/* A pending applicant whose session ended (rejected, or timed out): signing in tells them which. */}
          {query.ended && !notice && (
            <p role="status" className="mt-6 flex gap-3 border-l-4 border-[#8a847a] bg-[#faf8f5] px-4 py-3 text-[15px] font-semibold text-[#3d3a34]">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#6b665d]" /> Your session ended. If you applied to join, sign in to see where your application stands.
            </p>
          )}

          <div className="mt-8">
            <RealtyLoginForm slug={slug} />
          </div>

          <div className="mt-8 border-t border-[#e0dcd5] pt-6 text-sm leading-relaxed text-[#5a554d]">
            <p>
              <span className="font-bold text-[#17150f]">New agent?</span> Ask {short} for an invitation link. It opens a short form to set up your account.
            </p>
          </div>

          <p className="mt-8 flex items-center gap-2 text-xs text-[#8a847a]">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              Secure sign-in for {realty.name} · Powered by{" "}
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
