import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ApiError, api } from "@/lib/api"
import { dateTime, php, shortDate } from "@/lib/format"
import { requireSection } from "@/lib/realty-auth"
import type { ReportTotals, SalesReport } from "@/lib/sales-report"
import { DownloadPdf, PrintOnOpen } from "./report-tools"

const outfit = Outfit({ subsets: ["latin"], weight: ["600", "700", "800"], display: "swap", variable: "--font-outfit" })
const heading = "font-[family-name:var(--font-outfit),var(--font-geist-sans)] font-bold tracking-tight"

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ from?: string; to?: string; period?: string; print?: string }> }

const PERIODS = [
  ["this_week", "This week"],
  ["last_week", "Last week"],
  ["this_month", "This month"],
  ["last_month", "Last month"],
  ["this_quarter", "This quarter"],
  ["this_year", "This year"],
] as const

const isDate = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v)

// The title is the PDF's file name: "Johndorf sales report 2026-10-01 to 2026-10-16".
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { realty } = await params
  const { from, to, period } = await searchParams
  const name = realty.charAt(0).toUpperCase() + realty.slice(1)
  const when = isDate(from) && isDate(to) ? `${from} to ${to}` : (PERIODS.find(([p]) => p === period)?.[1].toLowerCase() ?? "this month")
  return { title: { absolute: `${name} sales report ${when}` }, robots: { index: false, follow: false } }
}

/**
 * jvconline.ph/<realty>/report — a sales report for a period on an A4 page, to read or save as a PDF: the
 * summary, the headline numbers against the period before, projects, agents, every home reserved or sold
 * and every offer sent. Outside the dashboard frame so only the report prints. ?print=1 (the AI's
 * Download PDF) opens the print window by itself.
 */
export default async function SalesReportPage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const { from, to, period, print } = await searchParams
  const { user, token } = await requireSection(slug, "offers")
  const accent = user.realty.accent_color ?? "#1f2937"

  const query = isDate(from) || isDate(to) ? `from=${isDate(from) ? from : to}&to=${isDate(to) ? to : from}` : `period=${PERIODS.some(([p]) => p === period) ? period : "this_month"}`
  let report: SalesReport | null = null
  let problem = ""
  try {
    report = await api<SalesReport>(`/realty/reports?${query}`, { token })
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 422)) throw e
    problem = e.message
  }

  return (
    <main className={`${outfit.variable} min-h-screen bg-[#e9e5dd] px-3 py-6 text-[#17150f] sm:px-6 print:bg-white print:p-0`} style={{ ["--accent" as string]: accent }}>
      <style>{`@page { size: A4; margin: 12mm 12mm 14mm; } @media print { html, body { background: #fff; } }`}</style>

      {/* The toolbar: back, other periods, and the PDF. Not printed. */}
      <div className="mx-auto flex max-w-[210mm] flex-col gap-4 pb-5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/${slug}/dashboard/ai`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a34] hover:text-[#17150f]">
            <ArrowLeft className="h-4 w-4" /> Back to the dashboard
          </Link>
          {report && <DownloadPdf />}
        </div>
        <nav aria-label="Other periods" className="flex flex-wrap gap-1.5">
          {PERIODS.map(([p, label]) => {
            const on = report?.period.label === label
            return (
              <Link key={p} href={`/${slug}/report?period=${p}`} className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${on ? "bg-[#17150f] text-white" : "bg-white/70 text-[#3d3a34] hover:bg-white"}`}>
                {label}
              </Link>
            )
          })}
        </nav>
        {report && <p className="text-sm text-[#5a554d]">In the print window, choose &ldquo;Save as PDF&rdquo; as the printer. Turn on &ldquo;Background graphics&rdquo; to keep the colours.</p>}
      </div>

      {report ? (
        <article className="mx-auto max-w-[210mm] bg-white px-5 py-6 shadow-[0_30px_70px_-30px_rgba(23,21,15,0.55)] [print-color-adjust:exact] [-webkit-print-color-adjust:exact] sm:px-[12mm] sm:py-[12mm] print:max-w-none print:p-0 print:shadow-none">
          <Report r={report} />
        </article>
      ) : (
        <div className="mx-auto max-w-xl rounded-2xl bg-white px-6 py-12 text-center">
          <h1 className={`${heading} text-2xl`}>No report for those dates</h1>
          <p className="mt-3 text-[#5a554d]">{problem || "Pick a period above."}</p>
        </div>
      )}
      {report && print === "1" && <PrintOnOpen />}
    </main>
  )
}

function Report({ r }: { r: SalesReport }) {
  const t = r.totals
  const b = r.previous
  const named = r.period.label !== r.period.dates
  const stock = r.inventory.available + r.inventory.reserved + r.inventory.sold

  return (
    <div className="text-[12.5px] leading-relaxed text-[#2b2822]">
      {/* Letterhead */}
      <header className="flex flex-col gap-4 border-b-[3px] border-[var(--accent)] pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 print:flex-row print:items-start print:justify-between">
        <div className="min-w-0">
          {r.realty.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.realty.logo_url} alt={r.realty.name} className="h-12 w-auto max-w-[200px] object-contain" />
          ) : (
            <p className={`${heading} text-xl`}>{r.realty.name}</p>
          )}
          <p className="mt-2 text-[11px] text-[#6b665d]">{r.realty.name}</p>
        </div>
        <div className="sm:text-right print:text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Sales report</p>
          <h1 className={`${heading} mt-1 text-[26px] leading-tight text-[#17150f]`}>{named ? r.period.label : r.period.dates}</h1>
          <p className="mt-0.5 text-[12px] text-[#5a554d]">
            {named && <>{r.period.dates} · </>}
            {r.period.days} day{r.period.days === 1 ? "" : "s"}
          </p>
        </div>
      </header>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-[#6b665d]">
        <div>
          <dt className="inline font-semibold text-[#3d3a34]">Covers: </dt>
          <dd className="inline">{r.prepared.scope}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[#3d3a34]">Compared with: </dt>
          <dd className="inline">{r.period.compared_with}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[#3d3a34]">Prepared: </dt>
          <dd className="inline">
            {dateTime(r.prepared.at)} by {r.prepared.by}
          </dd>
        </div>
      </dl>

      {/* Summary */}
      <Section title="Summary">
        {r.highlights.length ? (
          <ul className="space-y-1.5 rounded-lg bg-[#f7f5f1] px-4 py-3.5">
            {r.highlights.map((h) => (
              <li key={h} className="flex gap-2.5">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                {h}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#6b665d]">Nothing happened in this period.</p>
        )}
      </Section>

      {/* The numbers */}
      <Section title="Key figures">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#e6e2db] bg-[#e6e2db] sm:grid-cols-4 print:grid-cols-4">
          {(
            [
              ["Offers sent", "offers_sent"],
              ["Opened by the buyer", "opened"],
              ["Buyer answers", "answers"],
              ["Interested buyers", "interested"],
              ["Homes reserved", "reserved"],
              ["Homes sold", "sold"],
              ["Value of homes", "value", true],
              ["Reservation fees", "fees_confirmed", true],
            ] as [string, keyof ReportTotals, boolean?][]
          ).map(([label, key, money]) => (
            <div key={key} className="bg-white px-3.5 py-3">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#8a847a]">{label}</p>
              <p className={`${heading} mt-1 text-[20px] leading-none tabular-nums text-[#17150f]`}>{money ? php(t[key]) : t[key].toLocaleString("en-PH")}</p>
              <p className="mt-1 text-[10.5px] text-[#6b665d]">
                <Change now={t[key]} before={b[key]} money={money} />
              </p>
            </div>
          ))}
        </div>
        {stock > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[#5a554d]">
            <span className="shrink-0 font-semibold text-[#3d3a34]">Inventory today</span>
            <span className="flex h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[#efece7]">
              <span style={{ width: `${(r.inventory.available / stock) * 100}%` }} className="bg-[#10b981]" />
              <span style={{ width: `${(r.inventory.reserved / stock) * 100}%` }} className="bg-[#f59e0b]" />
              <span style={{ width: `${(r.inventory.sold / stock) * 100}%` }} className="bg-[#dc2626]" />
            </span>
            <span className="shrink-0 tabular-nums">
              {r.inventory.available.toLocaleString("en-PH")} available · {r.inventory.reserved.toLocaleString("en-PH")} reserved · {r.inventory.sold.toLocaleString("en-PH")} sold
            </span>
          </div>
        )}
      </Section>

      {r.projects.length > 0 && (
        <Section title="By project">
          <Table
            head={["Project", "Offers", "Interested", "Reserved", "Sold", "Value", "Available now"]}
            right={[1, 2, 3, 4, 5, 6]}
            rows={r.projects.map((p) => [
              <span key="n">
                <b className="text-[#17150f]">{p.name}</b>
                {p.location && <span className="block text-[10.5px] text-[#8a847a]">{p.location}</span>}
              </span>,
              p.offers,
              p.interested,
              p.reserved,
              p.sold,
              p.value ? php(p.value) : "—",
              p.available_now.toLocaleString("en-PH"),
            ])}
          />
        </Section>
      )}

      {r.agents.length > 0 && (
        <Section title="By agent">
          <Table head={["Agent", "Offers", "Interested", "Deals", "Value"]} right={[1, 2, 3, 4]} rows={r.agents.map((a) => [<b key="n" className="text-[#17150f]">{a.name}</b>, a.offers, a.interested, a.deals, a.value ? php(a.value) : "—"])} />
        </Section>
      )}

      <Section title={`Homes reserved or sold · ${r.deals.length}`}>
        {r.deals.length ? (
          <Table
            head={["Date", "Unit", "Project", "Buyer", ...(r.agents.length ? ["Agent"] : []), "Status", "Price"]}
            right={[r.agents.length ? 6 : 5]}
            rows={r.deals.map((d) => [
              shortDate(d.date),
              <b key="u" className="text-[#17150f]">{d.unit}</b>,
              d.project ?? "—",
              d.buyer ?? "—",
              ...(r.agents.length ? [d.agent ?? "—"] : []),
              <span key="s" className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${d.status === "sold" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{d.status}</span>,
              php(d.price),
            ])}
          />
        ) : (
          <p className="text-[#6b665d]">No homes were reserved or sold in this period.</p>
        )}
      </Section>

      <Section title={`Offers sent · ${t.offers_sent}`}>
        {r.offers.length ? (
          <Table
            head={["Date", "Buyer", "Unit", ...(r.agents.length ? ["Agent"] : []), "Price", "Opened", "Answer"]}
            right={[r.agents.length ? 4 : 3, r.agents.length ? 5 : 4]}
            rows={r.offers.map((o) => [
              shortDate(o.date),
              <b key="b" className="text-[#17150f]">{o.buyer}</b>,
              <span key="u">
                {o.unit ?? "—"}
                {o.project && <span className="block text-[10.5px] text-[#8a847a]">{o.project}</span>}
              </span>,
              ...(r.agents.length ? [o.agent ?? "—"] : []),
              php(o.price),
              o.opened ? `${o.opened}×` : "Not yet",
              o.answer ?? (o.status === "void" ? "Void" : "No answer yet"),
            ])}
          />
        ) : (
          <p className="text-[#6b665d]">No offers were sent in this period.</p>
        )}
        {t.offers_sent > r.offers.length && <p className="mt-2 text-[11px] text-[#8a847a]">The newest {r.offers.length} of {t.offers_sent} are listed.</p>}
      </Section>

      <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-[#e6e2db] pt-3 text-[10px] text-[#8a847a]">
        <span>Figures from {r.realty.name}&apos;s dashboard on jvconline.ph, as of {dateTime(r.prepared.at)}.</span>
        <span>Confidential: for {r.realty.name}&apos;s team.</span>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className={`${heading} mb-2.5 flex items-center gap-2.5 text-[15px] text-[#17150f] [break-after:avoid] before:h-4 before:w-1 before:rounded-full before:bg-[var(--accent)]`}>{title}</h2>
      {children}
    </section>
  )
}

function Table({ head, rows, right = [] }: { head: string[]; rows: React.ReactNode[][]; right?: number[] }) {
  return (
    // On a phone screen a wide table scrolls in its own box; on paper it fits the page.
    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 print:mx-0 print:overflow-visible print:px-0">
      <table className="w-full min-w-[520px] border-collapse text-[11.5px] sm:min-w-0 print:min-w-0">
        <thead>
          <tr className="border-b-2 border-[#17150f]">
            {head.map((h, i) => (
              <th key={h} className={`px-2 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-[#5a554d] first:pl-0 last:pr-0 ${right.includes(i) ? "text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-[#ece8e1] [break-inside:avoid]">
              {row.map((cell, i) => (
                <td key={i} className={`px-2 py-1.5 align-top first:pl-0 last:pr-0 ${right.includes(i) ? "text-right tabular-nums" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Change({ now, before, money }: { now: number; before: number; money?: boolean }) {
  if (now === before) return <>same as before ({money ? php(before) : before.toLocaleString("en-PH")})</>
  const up = now > before
  return (
    <>
      <b className={up ? "text-emerald-700" : "text-red-700"}>
        {up ? "▲" : "▼"} {money ? php(Math.abs(now - before)) : Math.abs(now - before).toLocaleString("en-PH")}
      </b>{" "}
      vs {money ? php(before) : before.toLocaleString("en-PH")} before
    </>
  )
}
