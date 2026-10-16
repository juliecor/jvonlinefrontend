import { ArrowUpRight, Download, FileBarChart2, TrendingDown, TrendingUp } from "lucide-react"
import { display } from "@/components/dashboard-ui"
import { php } from "@/lib/format"
import { reportHref } from "@/lib/sales-report"
import type { ReportCard as ReportCardData } from "./actions"

/**
 * A sales report under the AI's answer: the period, the headline numbers against the period before,
 * the highlights, and the top projects and agents. Download PDF opens the full report ready to save.
 */
export function ReportCard({ slug, card }: { slug: string; card: ReportCardData }) {
  const t = card.totals
  const b = card.previous
  const href = reportHref(slug, card.period)
  const kpis = [
    { label: "Offers sent", value: t.offers_sent, before: b.offers_sent, note: `${t.opened.toLocaleString("en-PH")} opened` },
    { label: "Buyer answers", value: t.answers, before: b.answers, note: `${t.interested.toLocaleString("en-PH")} interested` },
    { label: "Reserved or sold", value: t.reserved + t.sold, before: b.reserved + b.sold, note: `${t.reserved} reserved · ${t.sold} sold` },
    { label: "Value of homes", value: t.value, before: b.value, note: t.fees_confirmed ? `${php(t.fees_confirmed)} fees confirmed` : "reserved or sold", money: true },
  ]

  return (
    <section className="@container mt-4 overflow-hidden rounded-2xl border border-[#e8eaed] bg-white shadow-[0_2px_12px_-2px_rgba(23,21,15,0.06)]">
      <header className="flex flex-wrap items-center gap-3 border-b border-[#f0eeea] px-4 py-4 sm:px-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#17150f] text-white">
          <FileBarChart2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Sales report</p>
          <p className={`${display} text-[19px] leading-tight tracking-tight text-[#17150f]`}>
            {card.period.label === card.period.dates ? card.period.dates : card.period.label}
          </p>
          <p className="truncate text-xs text-[#6b665d]">
            {card.period.label === card.period.dates ? "" : `${card.period.dates} · `}compared with {card.period.compared_with}
          </p>
        </div>
        <div className="flex w-full gap-2 @md:w-auto">
          <a href={`${href}&print=1`} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 @md:flex-none">
            <Download className="h-4 w-4" /> Download PDF
          </a>
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-3.5 py-2.5 text-sm font-bold text-[#17150f] transition hover:border-[#17150f] @md:flex-none">
            Open report <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-px bg-[#f0eeea] @2xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="min-w-0 bg-white px-4 py-3.5 sm:px-5">
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a847a]">{k.label}</dt>
            <dd className={`${display} mt-1 truncate text-[24px] leading-none tabular-nums text-[#17150f]`}>{k.money ? php(k.value) : k.value.toLocaleString("en-PH")}</dd>
            <dd className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <Delta now={k.value} before={k.before} money={k.money} />
              <span className="truncate text-[#6b665d]">{k.note}</span>
            </dd>
          </div>
        ))}
      </dl>

      {card.highlights.length > 0 && (
        <ul className="space-y-1.5 border-t border-[#f0eeea] px-4 py-4 text-sm text-[#3d3a34] sm:px-5">
          {card.highlights.map((h) => (
            <li key={h} className="flex gap-2.5">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              {h}
            </li>
          ))}
        </ul>
      )}

      {(card.projects.length > 0 || card.agents.length > 0) && (
        <div className="grid gap-px border-t border-[#f0eeea] bg-[#f0eeea] @2xl:grid-cols-2">
          {card.projects.length > 0 && (
            <Ranking
              title="Projects"
              more={card.counts.projects - card.projects.length}
              rows={card.projects.map((p) => ({ name: p.name, main: `${p.reserved + p.sold} reserved or sold`, side: `${p.offers} offer${p.offers === 1 ? "" : "s"}` }))}
            />
          )}
          {card.agents.length > 0 && (
            <Ranking title="Agents" more={card.counts.agents - card.agents.length} rows={card.agents.map((a) => ({ name: a.name, main: `${a.deals} deal${a.deals === 1 ? "" : "s"}`, side: `${a.offers} offer${a.offers === 1 ? "" : "s"}` }))} />
          )}
        </div>
      )}

      <p className="border-t border-[#f0eeea] bg-[#fbfaf8] px-4 py-2.5 text-xs text-[#8a847a] sm:px-5">
        {card.scope}. The PDF lists every offer sent ({card.counts.offers}) and every home reserved or sold ({card.counts.deals}).
      </p>
    </section>
  )
}

function Delta({ now, before, money }: { now: number; before: number; money?: boolean }) {
  if (now === before) return <span className="font-semibold text-[#a39d92]">same as before</span>
  const up = now > before
  const d = Math.abs(now - before)
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${up ? "text-emerald-700" : "text-red-700"}`}>
      <Icon className="h-3.5 w-3.5" />
      {up ? "+" : "−"}
      {money ? php(d) : d.toLocaleString("en-PH")}
    </span>
  )
}

function Ranking({ title, rows, more }: { title: string; rows: { name: string; main: string; side: string }[]; more: number }) {
  return (
    <div className="bg-white px-4 py-3.5 sm:px-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a847a]">Top {title.toLowerCase()}</p>
      <ol className="mt-2 space-y-1.5">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center gap-2.5 text-sm">
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i === 0 ? "bg-[var(--accent)] text-white" : "bg-[#f1eee9] text-[#6b665d]"}`}>{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-semibold text-[#17150f]">{r.name}</span>
            <span className="shrink-0 text-xs text-[#6b665d]">{r.side}</span>
            <span className="shrink-0 text-xs font-bold text-[#17150f]">{r.main}</span>
          </li>
        ))}
      </ol>
      {more > 0 && <p className="mt-1.5 text-xs text-[#8a847a]">and {more} more in the report</p>}
    </div>
  )
}
