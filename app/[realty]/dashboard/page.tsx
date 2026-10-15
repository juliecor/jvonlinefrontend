import Link from "next/link"
import { Activity, ArrowRight, ArrowUpRight, BadgeCheck, Building2, CheckCircle2, ClipboardCheck, FileText, Globe, Handshake, Home, Inbox, Mail, MapPin, MessageSquare, Phone, Plus, Send, ShieldCheck, Trophy, UserRound, Users, Wallet } from "lucide-react"
import { display } from "@/components/dashboard-ui"
import { ContactButtons, LeadTag, NewTag, type Lead } from "@/components/leads"
import { api } from "@/lib/api"
import { greeting, php, timeAgo } from "@/lib/format"
import { SITE_REALTY } from "@/lib/public-projects-types"
import { requireRealtyUser } from "@/lib/realty-auth"
import { offersStopped } from "./offers/new/stopped"
import { can, isDeveloperStaff } from "@/lib/realty-roles"
import { Funnel, InventoryRing, StackBar, TrendChart, type TrendMonth } from "./overview-charts"

export const metadata = { title: "Statistics" }

type Overview = {
  realty: { name: string; slug: string; email: string | null; contact_name: string | null; phone: string | null; address: string | null; about: string | null; registered_at: string | null }
  stats: { agents: number; agents_invited: number; agents_pending?: number; staff: number; projects: number; units: number; offers: number; new_responses: number; docs_to_review: number; to_approve: number; realties_pending: number; sent_back: number }
  analytics: {
    inventory: { available: number; reserved: number; sold: number }
    trend: TrendMonth[]
    funnel: { step: string; n: number }[]
    projects: { id: number; name: string; location: string | null; units: number; available: number; reserved: number; sold: number }[]
    agents: { name: string; photo: string | null; offers: number; interested: number; deals: number }[]
    reservations: { to_confirm: number; confirmed: number; fees_confirmed: number; value_held: number }
    recent: { kind: "offer" | "answer" | "interested" | "reservation" | "reserved" | "sold"; at: string; text: string; detail: string | null; offer_id: number | null }[]
  }
}

type RecentLead = Lead & { offer_id: number; offer_code: string | null; unit: string | null; project: string | null }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

/** ₱3.3M, ₱850K: big peso amounts on a card. */
const pesoShort = (n: number) => (n >= 1_000_000 ? `₱${(Math.round(n / 100_000) / 10).toLocaleString("en-PH")}M` : n >= 1000 ? `₱${Math.round(n / 1000).toLocaleString("en-PH")}K` : php(n))

const card = "min-w-0 border border-[#e6e2db] bg-white"
const cardHead = "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[#e6e2db] px-5 py-4"
const cardTitle = "flex items-center gap-2.5 text-lg font-bold text-[#17150f]"

const RECENT_ICON = { offer: Send, answer: MessageSquare, interested: CheckCircle2, reservation: Wallet, reserved: Home, sold: BadgeCheck } as const
const RECENT_TONE = { offer: "bg-[#f3f1ed] text-[#5a554d]", answer: "bg-[#f3f1ed] text-[#5a554d]", interested: "bg-emerald-50 text-emerald-700", reservation: "bg-amber-50 text-amber-700", reserved: "bg-amber-50 text-amber-700", sold: "bg-red-50 text-red-700" } as const

/**
 * The realty dashboard's first page: what needs doing now, the realty's statistics (inventory, six months
 * of offers and deals, how far buyers get, projects, the team, reservations), the buyers waiting, and what
 * happened lately. Agents see the same page about their own offers.
 */
export default async function RealtyOverviewPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  const [{ realty, stats, analytics: a }, leads] = await Promise.all([
    api<Overview>("/realty/overview", { token }),
    api<RecentLead[]>("/realty/offers/responses?limit=6", { token }).catch(() => [] as RecentLead[]),
  ])
  const staff = user.role === "realty"
  const developerStaff = isDeveloperStaff(user)
  const canOffer = can(user, "offers") && !offersStopped(user)
  const today = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Manila", weekday: "long", month: "long", day: "numeric", year: "numeric" })
  const base = `/${slug}/dashboard`
  const thisMonth = a.trend.at(-1)
  const lastMonth = a.trend.at(-2)
  const totalUnits = a.inventory.available + a.inventory.reserved + a.inventory.sold

  // What needs doing now: only what has something waiting.
  const todo = [
    { n: a.reservations.to_confirm, label: a.reservations.to_confirm === 1 ? "reservation to confirm" : "reservations to confirm", href: `${base}/offers`, icon: Wallet, show: developerStaff },
    { n: stats.new_responses, label: stats.new_responses === 1 ? "new buyer response" : "new buyer responses", href: `${base}/offers`, icon: Inbox, show: true },
    { n: stats.docs_to_review, label: stats.docs_to_review === 1 ? "buyer file to review" : "buyer files to review", href: `${base}/offers`, icon: ClipboardCheck, show: true },
    { n: stats.to_approve, label: stats.to_approve === 1 ? "custom terms to approve" : "custom terms to approve", href: `${base}/approvals`, icon: ShieldCheck, show: developerStaff },
    { n: stats.sent_back, label: stats.sent_back === 1 ? "offer sent back to you" : "offers sent back to you", href: `${base}/offers`, icon: ShieldCheck, show: !developerStaff },
    { n: stats.agents_pending ?? 0, label: (stats.agents_pending ?? 0) === 1 ? "agent to approve" : "agents to approve", href: `${base}/agents`, icon: Users, show: staff },
    { n: stats.realties_pending, label: stats.realties_pending === 1 ? "realty form to review" : "realty forms to review", href: `${base}/realties`, icon: Handshake, show: developerStaff },
  ].filter((t) => t.show && t.n > 0)

  const kpis = [
    {
      label: staff ? "Active offers" : "Your active offers",
      value: stats.offers.toLocaleString("en-PH"),
      note: thisMonth ? `${thisMonth.offers} sent this month${lastMonth ? ` · ${lastMonth.offers} last month` : ""}` : "links sent to buyers",
      href: `${base}/offers`,
      icon: FileText,
      tone: "#17150f",
    },
    { label: "Available", value: a.inventory.available.toLocaleString("en-PH"), note: `of ${totalUnits.toLocaleString("en-PH")} units and lots in ${stats.projects} projects`, href: `${base}/projects`, icon: Building2, tone: "#10b981" },
    { label: "Reserved", value: a.inventory.reserved.toLocaleString("en-PH"), note: a.reservations.value_held ? `${pesoShort(a.reservations.value_held)} in homes held` : "homes held for buyers", href: `${base}/offers`, icon: Home, tone: "#f59e0b" },
    { label: "Sold", value: a.inventory.sold.toLocaleString("en-PH"), note: thisMonth?.sold ? `${thisMonth.sold} this month` : "turned over to buyers", href: `${base}/offers`, icon: BadgeCheck, tone: "#dc2626" },
  ]

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{staff ? "Admin statistics" : "Your statistics"}</p>
          <h1 className={`${display} mt-2 text-3xl tracking-tight text-[#17150f] sm:text-4xl`}>
            {greeting()}, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-[15px] text-[#5a554d]">
            {today} · {staff ? `${realty.name} at a glance.` : "Your sales at a glance."}
          </p>
        </div>
        {canOffer && (
          <Link href={`${base}/offers/new`} className="inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-110">
            <Plus className="h-4 w-4" strokeWidth={2.5} /> New offer
          </Link>
        )}
      </header>

      {/* What needs doing */}
      {todo.length > 0 ? (
        <section className="flex flex-wrap items-center gap-2 border-l-4 border-[var(--accent)] bg-white px-4 py-3">
          <p className="mr-2 text-sm font-bold text-[#17150f]">Needs you now</p>
          {todo.map(({ n, label, href, icon: Icon }) => (
            <Link key={label} href={href} className="inline-flex items-center gap-2 border border-[#e6e2db] bg-[#faf9f7] px-3 py-1.5 text-sm font-semibold text-[#17150f] transition hover:border-[var(--accent)]">
              <Icon className="h-4 w-4 text-[var(--accent)]" />
              <span className="tabular-nums">{n}</span> {label}
            </Link>
          ))}
        </section>
      ) : (
        <section className="flex items-center gap-2 border-l-4 border-emerald-500 bg-white px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> All caught up: nothing is waiting for you.
        </section>
      )}

      {/* The headline numbers */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map(({ label, value, note, href, icon: Icon, tone }) => (
          <Link key={label} href={href} className={`${card} group relative flex flex-col p-4 outline-none transition hover:border-[#17150f] focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:p-5`} style={{ boxShadow: `inset 0 3px 0 ${tone}` }}>
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center bg-[#f3f1ed] sm:h-10 sm:w-10" style={{ color: tone }}>
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <ArrowUpRight className="h-4 w-4 text-[#c9c4bb] transition group-hover:text-[var(--accent)]" />
            </div>
            <p className={`${display} mt-4 text-3xl tabular-nums tracking-tight text-[#17150f] sm:text-4xl`}>{value}</p>
            <p className="mt-1 text-sm font-semibold text-[#17150f] sm:text-[15px]">{label}</p>
            <p className="mt-0.5 text-[13px] text-[#6b665d] sm:text-sm">{note}</p>
          </Link>
        ))}
      </div>

      {/* Trend and inventory */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className={card}>
          <div className={cardHead}>
            <h2 className={cardTitle}>
              <Activity className="h-5 w-5 text-[var(--accent)]" /> Offers and sales
            </h2>
            <span className="text-sm text-[#6b665d]">last 6 months</span>
          </div>
          <div className="p-5">
            <TrendChart months={a.trend} />
          </div>
        </section>
        <section className={card}>
          <div className={cardHead}>
            <h2 className={cardTitle}>
              <Building2 className="h-5 w-5 text-[var(--accent)]" /> Inventory
            </h2>
            <Link href={`${base}/projects`} className="text-sm font-semibold text-[var(--accent)] hover:underline">
              Projects
            </Link>
          </div>
          <div className="p-5">
            <InventoryRing {...a.inventory} />
          </div>
        </section>
      </div>

      {/* Funnel and reservations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={card}>
          <div className={cardHead}>
            <h2 className={cardTitle}>
              <Send className="h-5 w-5 text-[var(--accent)]" /> From offer to reservation
            </h2>
            <span className="text-sm text-[#6b665d]">{staff ? "every offer" : "your offers"}</span>
          </div>
          <div className="p-5">
            {a.funnel[0]?.n ? <Funnel steps={a.funnel} /> : <p className="py-6 text-center text-[15px] text-[#8a847a]">No offers yet. The steps fill in as buyers open, answer and reserve.</p>}
          </div>
        </section>
        <section className={card}>
          <div className={cardHead}>
            <h2 className={cardTitle}>
              <Wallet className="h-5 w-5 text-[var(--accent)]" /> Reservations
            </h2>
            <Link href={`${base}/offers`} className="text-sm font-semibold text-[var(--accent)] hover:underline">
              Offers
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-[#efece7]">
            {[
              { label: "To confirm", value: a.reservations.to_confirm.toLocaleString("en-PH"), note: developerStaff ? "proof or payment waiting for you" : "waiting for Johndorf to confirm", hot: a.reservations.to_confirm > 0 },
              { label: "Confirmed", value: a.reservations.confirmed.toLocaleString("en-PH"), note: "buyers who reserved" },
              { label: "Fees confirmed", value: pesoShort(a.reservations.fees_confirmed), note: "reservation fees received" },
              { label: "Value held", value: pesoShort(a.reservations.value_held), note: "price of the homes reserved or sold" },
            ].map((r) => (
              <div key={r.label} className="bg-white p-5">
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[#8a847a]">{r.label}</dt>
                <dd className={`${display} mt-1.5 text-2xl tabular-nums sm:text-3xl ${r.hot ? "text-[var(--accent)]" : "text-[#17150f]"}`}>{r.value}</dd>
                <dd className="mt-0.5 text-[13px] text-[#6b665d]">{r.note}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Projects */}
      {a.projects.length > 0 && (
        <section className={card}>
          <div className={cardHead}>
            <h2 className={cardTitle}>
              <MapPin className="h-5 w-5 text-[var(--accent)]" /> Projects
            </h2>
            <span className="text-sm text-[#6b665d]">busiest first</span>
          </div>
          <ul className="divide-y divide-[#efece7]">
            {a.projects.map((p) => {
              const taken = p.reserved + p.sold
              return (
                <li key={p.id}>
                  <Link href={`${base}/projects/${p.id}#site-map`} className="grid items-center gap-x-6 gap-y-2 px-5 py-3.5 transition hover:bg-[#faf9f7] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto]">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-[#17150f]">{p.name}</p>
                      {p.location && <p className="truncate text-[13px] text-[#6b665d]">{p.location}</p>}
                    </div>
                    <div>
                      <StackBar available={p.available} reserved={p.reserved} sold={p.sold} />
                      <p className="mt-1.5 text-[13px] tabular-nums text-[#6b665d]">
                        <b className="text-emerald-700">{p.available.toLocaleString("en-PH")}</b> available · <b className="text-amber-700">{p.reserved}</b> reserved · <b className="text-red-700">{p.sold}</b> sold
                      </p>
                    </div>
                    <p className="text-right text-sm tabular-nums text-[#6b665d]">
                      <b className="text-[15px] text-[#17150f]">{p.units ? Math.round((taken / p.units) * 1000) / 10 : 0}%</b> taken
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* The team and what happened */}
      <div className={`grid grid-cols-1 gap-4 ${staff && a.agents.length ? "lg:grid-cols-2" : ""}`}>
        {staff && a.agents.length > 0 && (
          <section className={card}>
            <div className={cardHead}>
              <h2 className={cardTitle}>
                <Trophy className="h-5 w-5 text-[var(--accent)]" /> Top sellers
              </h2>
              <Link href={`${base}/agents`} className="text-sm font-semibold text-[var(--accent)] hover:underline">
                Team
              </Link>
            </div>
            <ol className="divide-y divide-[#efece7]">
              {a.agents.map((ag, i) => (
                <li key={ag.name} className="flex items-center gap-3 px-5 py-3">
                  <span className={`w-5 shrink-0 text-center text-sm font-bold tabular-nums ${i === 0 ? "text-[var(--accent)]" : "text-[#a39d92]"}`}>{i + 1}</span>
                  {ag.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ag.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#17150f] text-xs font-bold text-white">{initials(ag.name)}</span>
                  )}
                  <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#17150f]">{ag.name}</p>
                  <dl className="flex shrink-0 gap-3 text-right text-[12px] tabular-nums text-[#6b665d] sm:gap-4 sm:text-[13px]">
                    <div>
                      <dd className="text-[15px] font-bold text-[#17150f]">{ag.offers}</dd>
                      <dt>offers</dt>
                    </div>
                    <div>
                      <dd className="text-[15px] font-bold text-[#17150f]">{ag.interested}</dd>
                      <dt>interested</dt>
                    </div>
                    <div>
                      <dd className="text-[15px] font-bold text-emerald-700">{ag.deals}</dd>
                      <dt>deals</dt>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          </section>
        )}
        <section className={card}>
          <div className={cardHead}>
            <h2 className={cardTitle}>
              <Activity className="h-5 w-5 text-[var(--accent)]" /> Latest activity
            </h2>
          </div>
          {a.recent.length ? (
            <ol className="divide-y divide-[#efece7]">
              {a.recent.map((e, i) => {
                const Icon = RECENT_ICON[e.kind]
                const body = (
                  <>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center ${RECENT_TONE[e.kind]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#17150f] sm:line-clamp-1">{e.text}</span>
                      {e.detail && <span className="block truncate text-[13px] text-[#6b665d]">{e.detail}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-[#8a847a]">{timeAgo(e.at)}</span>
                  </>
                )
                return (
                  <li key={i}>
                    {e.offer_id ? (
                      <Link href={`${base}/offers/${e.offer_id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-[#faf9f7]">
                        {body}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-5 py-3">{body}</div>
                    )}
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="px-5 py-8 text-center text-[15px] text-[#8a847a]">Nothing yet. Offers, buyers&apos; answers and reservations show up here.</p>
          )}
        </section>
      </div>

      {/* Buyers waiting */}
      {leads.length > 0 && (
        <section className={card}>
          <div className={cardHead}>
            <h2 className={cardTitle}>
              <Inbox className="h-5 w-5 text-[var(--accent)]" /> Latest buyer responses
            </h2>
            <Link href={`${base}/offers`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline">
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
                      <Link href={`${base}/offers/${l.offer_id}`} className="text-[17px] font-bold text-[#17150f] hover:text-[var(--accent)]">
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
                  <Link href={`${base}/offers/${l.offer_id}`} className="inline-flex items-center border border-[#d9d4cb] bg-white px-3.5 py-2.5 text-sm font-bold text-[#17150f] transition hover:border-[#17150f]">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* The main thing to do here */}
        {can(user, "offers") ? (
          <section className="relative overflow-hidden bg-[var(--accent)] p-7 text-white sm:p-8">
            <Send aria-hidden className="absolute -right-6 -top-6 h-40 w-40 text-white/10" strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Sales offer</p>
            <h2 className={`${display} mt-2 text-3xl tracking-tight`}>Send a buyer an offer</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/85">Pick the lot on the site map or from the list, choose a payment plan, type the buyer&apos;s name, and you get a link with the price, the schedule and your contact details.</p>
            {/* Paused while a broker's accreditation has ended (the banner above says why). */}
            {!offersStopped(user) && (
              <Link href={`${base}/offers/new`} className="mt-6 inline-flex items-center gap-2 bg-white px-5 py-3 text-[15px] font-bold text-[var(--accent)] transition hover:bg-[#fff4f3]">
                New offer <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {stats.units === 0 && <p className="mt-4 text-sm text-white/80">{developerStaff ? "Add a project with at least one unit first." : "No units have been listed yet."}</p>}
          </section>
        ) : (
          <div />
        )}

        {/* Company */}
        <section className={card}>
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
