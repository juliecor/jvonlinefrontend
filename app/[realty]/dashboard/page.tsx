import Link from "next/link"
import { ArrowRight, ArrowUpRight, Building2, FileText, Globe, Inbox, Mail, MapPin, Phone, Send, UserRound, Users } from "lucide-react"
import { display } from "@/components/dashboard-ui"
import { ContactButtons, LeadTag, NewTag, type Lead } from "@/components/leads"
import { api } from "@/lib/api"
import { greeting, timeAgo } from "@/lib/format"
import { SITE_REALTY } from "@/lib/public-projects-types"
import { requireRealtyUser } from "@/lib/realty-auth"
import { offersStopped } from "./offers/new/stopped"
import { can, isDeveloperStaff } from "@/lib/realty-roles"

export const metadata = { title: "Overview" }

type Overview = {
  realty: { name: string; slug: string; email: string | null; contact_name: string | null; phone: string | null; address: string | null; about: string | null; registered_at: string | null }
  stats: { agents: number; agents_invited: number; agents_pending?: number; staff: number; projects: number; units: number; offers: number; new_responses: number }
}

type RecentLead = Lead & { offer_id: number; offer_code: string | null; unit: string | null; project: string | null }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

/** The realty dashboard's first page: the numbers, the buyers waiting, and the two things people come here to do. */
export default async function RealtyOverviewPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  const [{ realty, stats }, leads] = await Promise.all([
    api<Overview>("/realty/overview", { token }),
    api<RecentLead[]>("/realty/offers/responses?limit=6", { token }).catch(() => [] as RecentLead[]),
  ])
  const staff = user.role === "realty"
  const today = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Manila", weekday: "long", month: "long", day: "numeric", year: "numeric" })

  const cards: { label: string; value: number; note: string; href: string; icon: typeof Building2; hot?: boolean }[] = [
    { label: "Projects", value: stats.projects, note: `${stats.units.toLocaleString("en-PH")} unit${stats.units === 1 ? "" : "s"} listed`, href: `/${slug}/dashboard/projects`, icon: Building2 },
    { label: staff ? "Active offers" : "Your offers", value: stats.offers, note: "links sent to buyers", href: `/${slug}/dashboard/offers`, icon: FileText },
    { label: "New responses", value: stats.new_responses, note: stats.new_responses ? "buyers waiting for a reply" : "all caught up", href: `/${slug}/dashboard/offers`, icon: Inbox, hot: stats.new_responses > 0 },
    ...(staff
      ? [{ label: "Agents", value: stats.agents, note: stats.agents_pending ? `${stats.agents_pending} to approve` : stats.agents_invited ? `${stats.agents_invited} invite${stats.agents_invited === 1 ? "" : "s"} open` : "on your team", href: `/${slug}/dashboard/agents`, icon: Users, hot: (stats.agents_pending ?? 0) > 0 }]
      : []),
  ]

  return (
    <div>
      {/* Greeting */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{realty.name}</p>
          <h1 className={`${display} mt-2 text-3xl tracking-tight text-[#17150f] sm:text-4xl`}>
            {greeting()}, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-[15px] text-[#5a554d]">{staff ? "Here's where your realty stands today." : "Here's where your sales stand today."}</p>
        </div>
        <p className="text-sm font-medium text-[#8a847a]">{today}</p>
      </header>

      {/* The numbers */}
      <div className={`mt-8 grid grid-cols-2 gap-3 sm:gap-4 ${cards.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        {cards.map(({ label, value, note, href, icon: Icon, hot }) => (
          <Link key={label} href={href} className="group relative flex flex-col border border-[#e6e2db] bg-white p-4 outline-none sm:p-5 transition hover:border-[#17150f] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            <div className="flex items-start justify-between">
              <span className={`flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10 ${hot ? "bg-[var(--accent)] text-white" : "bg-[#f3f1ed] text-[#6b665d]"}`}>
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <ArrowUpRight className="h-4 w-4 text-[#c9c4bb] transition group-hover:text-[var(--accent)]" />
            </div>
            <p className={`${display} mt-4 text-3xl tabular-nums tracking-tight text-[#17150f] sm:mt-5 sm:text-4xl`}>{value.toLocaleString("en-PH")}</p>
            <p className="mt-1 text-sm font-semibold text-[#17150f] sm:text-[15px]">{label}</p>
            <p className={`mt-0.5 text-[13px] sm:text-sm ${hot ? "font-semibold text-[var(--accent)]" : "text-[#6b665d]"}`}>{note}</p>
          </Link>
        ))}
      </div>

      {/* Buyers waiting */}
      {leads.length > 0 && (
        <section className="mt-8 border border-[#e6e2db] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e2db] px-5 py-4">
            <h2 className="text-lg font-bold text-[#17150f]">Latest buyer responses</h2>
            <Link href={`/${slug}/dashboard/offers`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline">
              All offers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-[#efece7]">
            {leads.map((l) => (
              <li key={l.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#17150f] text-sm font-bold text-white">
                    {initials(l.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/${slug}/dashboard/offers/${l.offer_id}`} className="text-[17px] font-bold text-[#17150f] hover:text-[var(--accent)]">
                        {l.name}
                      </Link>
                      <LeadTag kind={l.kind} label={l.label} />
                      {l.new && <NewTag />}
                    </div>
                    <p className="mt-0.5 text-sm text-[#6b665d]">
                      {[l.project, l.unit].filter(Boolean).join(" · ")} · {timeAgo(l.created_at)}
                    </p>
                    {l.message && <p className="mt-2 line-clamp-2 max-w-2xl border-l-2 border-[#e6e2db] pl-3 text-[15px] text-[#3d3a34]">&ldquo;{l.message}&rdquo;</p>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-4">
                  {l.kind !== "not_interested" && <ContactButtons phone={l.phone} email={l.email} via={l.contact_via} limit={1} />}
                  <Link href={`/${slug}/dashboard/offers/${l.offer_id}`} className="inline-flex items-center border border-[#d9d4cb] bg-white px-3.5 py-2.5 text-sm font-bold text-[#17150f] transition hover:border-[#17150f]">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* The main thing to do here */}
        {can(user, "offers") ? (
          <section className="relative overflow-hidden bg-[var(--accent)] p-7 text-white sm:p-8">
            <Send aria-hidden className="absolute -right-6 -top-6 h-40 w-40 text-white/10" strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Sales offer</p>
            <h2 className={`${display} mt-2 text-3xl tracking-tight`}>Send a buyer an offer</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/85">Pick the lot on the site map or from the list, choose a payment plan, type the buyer&apos;s name, and you get a link with the price, the schedule and your contact details.</p>
            {/* Paused while a broker's accreditation has ended (the banner above says why). */}
            {!offersStopped(user) && (
              <Link href={`/${slug}/dashboard/offers/new`} className="mt-6 inline-flex items-center gap-2 bg-white px-5 py-3 text-[15px] font-bold text-[var(--accent)] transition hover:bg-[#fff4f3]">
                New offer <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {stats.units === 0 && <p className="mt-4 text-sm text-white/80">{isDeveloperStaff(user) ? "Add a project with at least one unit first." : "No units have been listed yet."}</p>}
          </section>
        ) : (
          <div />
        )}

        {/* Company */}
        <section className="border border-[#e6e2db] bg-white">
          <h2 className="border-b border-[#e6e2db] px-5 py-4 text-lg font-bold text-[#17150f]">Company</h2>
          <dl className="divide-y divide-[#efece7] text-[15px]">
            {[
              slug === SITE_REALTY
                ? { icon: Globe, label: "Website", value: <Link href="/" target="_blank" className="font-semibold text-[#17150f] hover:text-[var(--accent)]">jvconline.ph</Link> }
                : { icon: Globe, label: "Sign-in page", value: <Link href={`/${slug}/login`} target="_blank" className="font-semibold text-[#17150f] hover:text-[var(--accent)]">jvconline.ph/{slug}/login</Link> },
              { icon: UserRound, label: "Contact", value: realty.contact_name },
              { icon: Mail, label: "Email", value: realty.email },
              { icon: Phone, label: "Phone", value: realty.phone },
              { icon: MapPin, label: "Address", value: realty.address },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-3">
                <Icon className="h-4 w-4 shrink-0 text-[#a39d92]" strokeWidth={1.9} />
                <dt className="w-24 shrink-0 text-sm text-[#8a847a]">{label}</dt>
                <dd className={`min-w-0 flex-1 truncate text-right ${value ? "text-[#17150f]" : "text-[#c9c4bb]"}`}>{value ?? "Not set"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
