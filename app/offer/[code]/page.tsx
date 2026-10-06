import type { Metadata } from "next"
import Link from "next/link"
import { cache } from "react"
import { ArrowUpRight, Bath, BedDouble, CalendarDays, Car, Check, Info, Layers, Mail, MapPin, Phone, Ruler, SquareDashed, Tag as TagIcon } from "lucide-react"
import { RealtyMark } from "@/components/form"
import { ApiError, api } from "@/lib/api"
import { longDate, php, phpExact, sqm } from "@/lib/format"
import { SITE_REALTY } from "@/lib/public-projects-types"
import { realtyToken } from "@/lib/realty-auth"
import { realtyIcons } from "@/lib/realty-icon"
import { PrintButton, Zoomable } from "./parts"
import { RespondSection } from "./respond"

type Milestone = { label: string; percent: number; date: string | null; amount: number }
type Specs = { usable_floor_area: string | null; typical_floor_area: string | null; bedrooms: string | null; baths: string | null; floors: string | null; parking: string | null }
type Offer = {
  code: string
  buyer_name: string
  purchase_date: string
  price: number
  schedule: Milestone[]
  fee_notes: string | null
  created_at: string
  realty: { name: string; slug: string; logo_url: string | null; accent_color: string | null; phone: string | null; email: string | null; address: string | null }
  project: {
    name: string
    location: string | null
    region: string | null
    stage: string | null
    lat: number | null
    lng: number | null
    description: string | null
    cover_url: string | null
    hero: string[]
    site_plans: string[]
    amenities: string[]
    page_slug: string | null
    completion_date: string | null
  }
  unit: { name: string; unit_type: string | null; category: string; floor: string | null; area_sqm: number | null; floor_plan_url: string | null; highlights: string | null }
  model: { name: string; specs: Specs | null; images: string[] } | null
  agent: { name: string; email: string } | null
}

type Props = { params: Promise<{ code: string }> }

/** One load per request, shared by the page and its metadata (each load counts as a buyer view). */
const loadOffer = cache(async (code: string): Promise<{ offer: Offer | null; problem: string | null }> => {
  try {
    return { offer: await api<Offer>(`/offers/${encodeURIComponent(code)}`, { token: await realtyToken() }), problem: null }
  } catch (e) {
    const problem = e instanceof ApiError && (e.status === 404 || e.status === 410) ? (e.status === 404 ? "We couldn't find this offer. Please check the link with your agent." : e.message) : "We couldn't load this offer right now. Please try again in a moment."
    return { offer: null, problem }
  }
})

/** The realty's own tab icon, like its dashboard. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { offer } = await loadOffer((await params).code)
  const slug = offer?.realty.slug
  return {
    title: "Sales offer",
    robots: { index: false, follow: false },
    ...(slug ? { icons: realtyIcons(slug) } : {}),
  }
}

const SHARE_MIN = 4 // % of the bar a tiny milestone still gets, so it stays visible

/** Numbered section title used throughout the document. */
function Heading({ n, title, aside }: { n: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#17150f] pb-3">
      <h2 className="flex items-baseline gap-3 text-xl font-bold tracking-tight text-[#17150f] sm:text-2xl">
        <span className="text-sm font-bold tabular-nums text-[var(--accent)]">{n}</span>
        {title}
      </h2>
      {aside && <div className="text-sm font-semibold text-[#6b665d]">{aside}</div>}
    </div>
  )
}

/** jvconline.ph/offer/<code> — the buyer's sales offer. Public, unlisted, printable. */
export default async function OfferPage({ params }: Props) {
  const { code } = await params
  const { offer, problem } = await loadOffer(code)

  if (!offer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ece9e4] px-4 text-[#17150f]">
        <div className="max-w-md border border-[#e0dcd5] bg-white p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a847a]">Sales offer</p>
          <h1 className="mt-3 text-2xl font-bold">Offer unavailable</h1>
          <p className="mt-3 text-[15px] text-[#5a554d]">{problem}</p>
        </div>
      </main>
    )
  }

  const { realty, project, unit, model, agent, schedule } = offer
  const accent = realty.accent_color ?? "#1f2937"
  const hero = project.hero[0] ?? project.cover_url
  const first = schedule[0]
  const dueToday = (m: Milestone) => m.date === offer.purchase_date
  const specs = model?.specs ?? null
  const area = unit.area_sqm ?? (specs?.usable_floor_area ? Number(specs.usable_floor_area) : null)
  const modelImages = [...(model?.images ?? []), ...(unit.floor_plan_url ? [unit.floor_plan_url] : [])]
  const projectPage = project.page_slug && realty.slug === SITE_REALTY ? `/projects/${project.page_slug}` : null
  const asterisk = Object.values(specs ?? {}).some((v) => v?.includes("*"))
  const mailto = agent?.email ? `mailto:${agent.email}?subject=${encodeURIComponent(`Sales offer ${offer.code}`)}` : null

  const specRows: { icon: typeof Ruler; label: string; value: string | null }[] = [
    { icon: Ruler, label: "Usable floor area", value: area !== null ? sqm(area) : null },
    { icon: SquareDashed, label: "Typical floor area", value: specs?.typical_floor_area ? `${specs.typical_floor_area} sqm` : null },
    { icon: BedDouble, label: "Bedrooms", value: specs?.bedrooms ?? null },
    { icon: Bath, label: "Toilet & bath", value: specs?.baths ?? null },
    { icon: Layers, label: "Floors", value: specs?.floors ?? null },
    { icon: Car, label: "Parking", value: specs?.parking ?? null },
    { icon: TagIcon, label: "Category", value: unit.category },
    { icon: Layers, label: "Floor / phase", value: unit.floor },
  ]
  // Bar shares: every milestone gets at least SHARE_MIN %, the rest in proportion; later milestones fade.
  const raw = schedule.map((m) => Math.max(m.percent, SHARE_MIN))
  const rawSum = raw.reduce((a, b) => a + b, 0)
  const shares = raw.map((r) => (r / rawSum) * 100)
  const fade = (i: number) => 1 - i * (0.55 / Math.max(schedule.length - 1, 1))
  let section = 2

  return (
    <main className="min-h-screen bg-[#ece9e4] pb-16 text-[#17150f] [print-color-adjust:exact] print:bg-white print:pb-0" style={{ ["--accent" as string]: accent }}>
      {/* Action bar (screen only) */}
      <div className="sticky top-0 z-30 border-b border-[#ddd8d0] bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <RealtyMark name={realty.name} logo={realty.logo_url} className="h-8" />
            <span className="hidden h-6 w-px bg-[#e0dcd5] sm:block" />
            <p className="hidden truncate text-sm font-semibold text-[#5a554d] sm:block">Sales offer for {offer.buyer_name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {realty.phone && (
              <a href={`tel:${realty.phone}`} className="hidden items-center gap-2 border border-[#d9d4cb] px-3.5 py-2 text-sm font-bold text-[#17150f] hover:border-[#17150f] sm:inline-flex">
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
            <a href="#respond" className="inline-flex items-center gap-2 bg-[var(--accent)] px-3.5 py-2 text-sm font-bold text-white hover:brightness-110">
              Respond
            </a>
            <PrintButton className="border border-[#d9d4cb] px-3.5 py-2 text-[#17150f] hover:border-[#17150f]" />
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-[1040px] bg-white sm:mt-8 sm:border sm:border-[#e0dcd5] print:mt-0 print:max-w-none print:border-0">
        <div className="h-1.5 bg-[var(--accent)]" />

        {/* Letterhead */}
        <header className="flex flex-wrap items-start justify-between gap-6 px-6 py-7 sm:px-10">
          <div>
            <RealtyMark name={realty.name} logo={realty.logo_url} className="h-14" />
            {realty.logo_url && <p className="mt-2 text-sm font-semibold text-[#3d3a34]">{realty.name}</p>}
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-sm">
            <dt className="col-span-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] sm:text-right">Sales offer</dt>
            <dt className="text-[#8a847a]">Reference</dt>
            <dd className="text-right font-mono font-bold">{offer.code}</dd>
            <dt className="text-[#8a847a]">Issued</dt>
            <dd className="text-right font-semibold">{longDate(offer.created_at)}</dd>
          </dl>
        </header>

        {/* Hero — photo clean (developer renders often carry their own lettering), title set beneath it */}
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={project.name} className="aspect-[4/3] w-full object-cover sm:aspect-[21/9]" />
        )}
        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-[#ebe7e1] px-6 py-7 sm:px-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[var(--accent)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">{model?.name ?? unit.unit_type ?? unit.name}</span>
              {project.stage && <span className="border border-[#d9d4cb] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3d3a34]">{project.stage}</span>}
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{project.name}</h1>
            {project.location && (
              <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-[#5a554d] sm:text-lg">
                <MapPin className="h-4 w-4 text-[var(--accent)]" /> {project.location}
              </p>
            )}
          </div>
          <p className="text-right text-sm font-semibold text-[#5a554d]">
            {unit.name}
            {unit.floor ? ` · ${unit.floor}` : ""}
          </p>
        </section>

        {/* Parties */}
        <section className="grid border-b border-[#ebe7e1] sm:grid-cols-2">
          <div className="px-6 py-6 sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a847a]">Prepared for</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">{offer.buyer_name}</p>
            <p className="mt-1 text-sm font-semibold text-[#5a554d]">Purchase date {longDate(offer.purchase_date)}</p>
          </div>
          <div className="border-t border-[#ebe7e1] px-6 py-6 sm:border-l sm:border-t-0 sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a847a]">Prepared by</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">{agent?.name ?? realty.name}</p>
            <p className="mt-1 text-sm font-semibold text-[#5a554d]">{agent ? realty.name : "Sales team"}</p>
          </div>
        </section>

        {/* Key figures */}
        <section className="grid grid-cols-2 border-b border-[#ebe7e1] lg:grid-cols-4">
          <div className="col-span-2 bg-[#17150f] px-6 py-6 text-white sm:px-10 lg:col-span-1 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Total contract price</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{php(offer.price)}</p>
          </div>
          <div className="border-r border-[#ebe7e1] px-6 py-6 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a847a]">{first ? (dueToday(first) ? "Due on reservation" : "First payment") : "Payment"}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-[var(--accent)]">{first ? php(first.amount) : "—"}</p>
            {first && <p className="mt-1 text-xs font-semibold text-[#6b665d]">{first.label}</p>}
          </div>
          <div className="px-6 py-6 sm:px-8 lg:border-r lg:border-[#ebe7e1]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a847a]">Floor area</p>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{area !== null ? sqm(area) : "—"}</p>
            <p className="mt-1 text-xs font-semibold text-[#6b665d]">{unit.name}</p>
          </div>
          <div className="col-span-2 border-t border-[#ebe7e1] px-6 py-6 sm:px-8 lg:col-span-1 lg:border-t-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a847a]">Turnover</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{project.completion_date ? longDate(project.completion_date) : "Upon completion"}</p>
            <p className="mt-1 text-xs font-semibold text-[#6b665d]">{project.region ?? project.location ?? ""}</p>
          </div>
        </section>

        <div className="space-y-14 px-6 py-10 sm:px-10 sm:py-12">
          <p className="max-w-3xl text-[17px] leading-relaxed text-[#3d3a34]">
            Thank you for your interest in <strong className="font-bold text-[#17150f]">{project.name}</strong>. Below are the details of <strong className="font-bold text-[#17150f]">{unit.name}</strong>, the total contract price and how the payment is spread out.
          </p>

          {/* The home */}
          <section className="break-inside-avoid">
            <Heading n="01" title="The home" aside={model?.name ?? unit.unit_type ?? undefined} />
            <div className={`mt-6 grid gap-8 ${modelImages.length ? "lg:grid-cols-[1.2fr_1fr]" : ""}`}>
              {modelImages.length > 0 && <Zoomable images={modelImages} alt={model?.name ?? unit.name} imgClassName="aspect-[16/10]" />}
              <div>
                <p className="text-2xl font-bold tracking-tight">{unit.name}</p>
                <p className="mt-1 text-[15px] font-semibold text-[#5a554d]">{[model?.name !== unit.name ? model?.name ?? unit.unit_type : null, project.name].filter(Boolean).join(" · ")}</p>
                <dl className="mt-6 grid grid-cols-2 gap-px border border-[#ebe7e1] bg-[#ebe7e1]">
                  {specRows
                    .filter((r) => r.value)
                    .map(({ icon: Icon, label, value }, i, rows) => (
                      <div key={label} className={`flex items-start gap-3 bg-white p-4 ${rows.length % 2 === 1 && i === rows.length - 1 ? "col-span-2" : ""}`}>
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                        <div>
                          <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a847a]">{label}</dt>
                          <dd className="mt-0.5 text-lg font-bold">{value}</dd>
                        </div>
                      </div>
                    ))}
                </dl>
                {unit.highlights && (
                  <p className="mt-4 border-l-4 border-[var(--accent)] bg-[#faf8f5] px-4 py-3 text-[15px] font-semibold leading-relaxed text-[#17150f]">{unit.highlights}</p>
                )}
                {asterisk && <p className="mt-3 text-xs text-[#8a847a]">* As indicated by the developer.</p>}
              </div>
            </div>
          </section>

          {/* Payment schedule */}
          <section className="break-inside-avoid">
            <Heading n="02" title="Payment schedule" aside={`From the purchase date, ${longDate(offer.purchase_date)}`} />
            {schedule.length > 1 && (
              <div className="mt-6">
                <div className="flex h-3 w-full overflow-hidden bg-[#ebe7e1]">
                  {schedule.map((m, i) => (
                    <div key={i} style={{ width: `${shares[i]}%`, opacity: fade(i) }} className="h-full border-r-2 border-white bg-[var(--accent)] last:border-r-0" title={`${m.label} · ${m.percent}%`} />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-[#5a554d]">
                  {schedule.map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 bg-[var(--accent)]" style={{ opacity: fade(i) }} />
                      {m.percent}% · {m.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Phone: one block per milestone, amount always in view */}
            <ol className="mt-6 divide-y divide-[#ebe7e1] border-y border-[#ebe7e1] sm:hidden">
              {schedule.map((m, i) => (
                <li key={i} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="font-bold">
                      <span className="mr-2 tabular-nums text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                      {m.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#5a554d]">
                      {m.date ? longDate(m.date) : "Upon completion"} · {m.percent}%
                    </p>
                    {dueToday(m) && <span className="mt-1.5 inline-block bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Due on reservation</span>}
                  </div>
                  <p className="shrink-0 text-right font-bold tabular-nums">{phpExact(m.amount)}</p>
                </li>
              ))}
              <li className="flex items-center justify-between gap-4 bg-[#17150f] px-4 py-4 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.14em]">Total contract price</p>
                <p className="text-lg font-bold tabular-nums">{phpExact(offer.price)}</p>
              </li>
            </ol>

            <div className="mt-6 hidden sm:block">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="border-b border-[#ebe7e1] text-left text-xs uppercase tracking-[0.12em] text-[#8a847a]">
                    <th className="py-3 pr-3 font-bold">#</th>
                    <th className="py-3 pr-3 font-bold">Milestone</th>
                    <th className="py-3 pr-3 font-bold">Due</th>
                    <th className="py-3 pr-3 text-right font-bold">Share</th>
                    <th className="py-3 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe7e1]">
                  {schedule.map((m, i) => (
                    <tr key={i}>
                      <td className="py-4 pr-3 align-top font-bold tabular-nums text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</td>
                      <td className="py-4 pr-3 align-top">
                        <p className="font-bold">{m.label}</p>
                        {dueToday(m) && <span className="mt-1 inline-block bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Due on reservation</span>}
                      </td>
                      <td className="py-4 pr-3 align-top font-semibold text-[#3d3a34]">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4 text-[#8a847a]" />
                          {m.date ? longDate(m.date) : "Upon completion"}
                        </span>
                      </td>
                      <td className="py-4 pr-3 text-right align-top font-semibold tabular-nums text-[#5a554d]">{m.percent}%</td>
                      <td className="py-4 text-right align-top font-bold tabular-nums">{phpExact(m.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#17150f] text-white">
                    <td colSpan={3} className="px-4 py-4 text-sm font-bold uppercase tracking-[0.14em]">Total contract price</td>
                    <td className="py-4 pr-3 text-right font-semibold tabular-nums text-white/70">100%</td>
                    <td className="py-4 pr-4 text-right text-lg font-bold tabular-nums">{phpExact(offer.price)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {offer.fee_notes && (
              <div className="mt-5 flex gap-3 border border-[#ebe7e1] bg-[#faf8f5] p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#5a554d]">{offer.fee_notes}</p>
              </div>
            )}
          </section>

          {/* Site plan */}
          {project.site_plans.length > 0 && (
            <section className="break-inside-avoid">
              <Heading n={String(++section).padStart(2, "0")} title="Site development plan" aside={project.name} />
              <Zoomable images={project.site_plans} alt={`${project.name} site development plan`} caption="Site development plan" className="mt-6 border border-[#ebe7e1]" />
            </section>
          )}

          {/* Amenities, or the project description when there are none */}
          {project.amenities.length > 0 ? (
            <section className="break-inside-avoid">
              <Heading n={String(++section).padStart(2, "0")} title="Amenities & facilities" aside={`${project.amenities.length} in ${project.name}`} />
              <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {project.amenities.map((a) => (
                  <li key={a} className="flex items-start gap-3 text-[15px] font-semibold text-[#3d3a34]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--accent)] text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            project.description && (
              <section className="break-inside-avoid">
                <Heading n={String(++section).padStart(2, "0")} title={`About ${project.name}`} />
                <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-[#3d3a34]">{project.description}</p>
              </section>
            )
          )}

          <LocationBlock n={String(++section).padStart(2, "0")} name={project.name} location={project.location} lat={project.lat} lng={project.lng} />
        </div>

        {/* Buyer's answer */}
        <section id="respond" className="scroll-mt-20 border-t border-[#ebe7e1] bg-[#f6f4f0] px-6 py-10 print:hidden sm:px-10 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Your response</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">What would you like to do?</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-[#5a554d]">Choose one and {agent?.name ?? realty.name} will get back to you. It takes less than a minute.</p>
          <div className="mt-6">
            <RespondSection code={offer.code} buyerName={offer.buyer_name} agentName={agent?.name ?? realty.name} />
          </div>
        </section>

        {/* Contact */}
        <section className="break-inside-avoid bg-[#17150f] px-6 py-10 text-white sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">Questions about this offer?</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">Talk to {agent?.name ?? realty.name}.</p>
              <div className="mt-5 space-y-2 text-[15px] text-white/80">
                {agent?.email && mailto && (
                  <p className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-white/50" />
                    <a href={mailto} className="font-semibold text-white hover:underline">{agent.email}</a>
                  </p>
                )}
                {realty.phone && (
                  <p className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-white/50" />
                    <a href={`tel:${realty.phone}`} className="font-semibold text-white hover:underline">{realty.phone}</a>
                  </p>
                )}
                {realty.address && (
                  <p className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-white/50" /> {realty.address}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end print:hidden">
              {agent && mailto && (
                <a href={mailto} className="inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white hover:brightness-110">
                  <Mail className="h-4 w-4" /> Email {agent.name.split(" ")[0]}
                </a>
              )}
              {projectPage && (
                <Link href={projectPage} className="inline-flex items-center gap-2 border border-white/30 px-5 py-3 text-[15px] font-bold text-white hover:bg-white/10">
                  View {project.name} <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-[#8a847a] sm:px-10">
          <p>Reference {offer.code} · Prices and availability may change until a reservation is made.</p>
          <p>
            Powered by <Link href="/platform" className="font-semibold text-[#5a554d] hover:text-[#17150f]">jvconline</Link>
          </p>
        </footer>
      </article>
    </main>
  )
}

/** Location with a static Google map that opens Google Maps. */
function LocationBlock({ n, name, location, lat, lng }: { n: string; name: string; location: string | null; lat: number | null; lng: number | null }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hasPin = lat !== null && lng !== null
  if (!hasPin && !location) return null
  const spot = hasPin ? `${lat},${lng}` : [name, location, "Philippines"].filter(Boolean).join(", ")
  const open = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot)}`
  const img = key ? `https://maps.googleapis.com/maps/api/staticmap?size=640x300&scale=2&zoom=${hasPin ? 15 : 13}&maptype=roadmap&markers=color:0xb4241c%7C${encodeURIComponent(spot)}&key=${key}` : null
  return (
    <section className="break-inside-avoid">
      <Heading n={n} title="Location" aside={location ?? undefined} />
      <div className="mt-6 grid border border-[#ebe7e1] lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col justify-between gap-6 p-6">
          <div>
            <p className="text-2xl font-bold tracking-tight">{name}</p>
            {location && (
              <p className="mt-1 inline-flex items-center gap-2 text-[15px] font-semibold text-[#5a554d]">
                <MapPin className="h-4 w-4 text-[var(--accent)]" /> {location}
              </p>
            )}
          </div>
          <a href={open} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 border border-[#d9d4cb] px-4 py-2.5 text-sm font-bold hover:border-[#17150f] print:hidden">
            Open in Google Maps <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        {img && (
          <a href={open} target="_blank" rel="noreferrer" className="block border-t border-[#ebe7e1] lg:border-l lg:border-t-0" aria-label={`Open ${name} in Google Maps`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={`Map of ${name}`} width={640} height={300} className="h-full min-h-[220px] w-full object-cover" loading="lazy" />
          </a>
        )}
      </div>
    </section>
  )
}
