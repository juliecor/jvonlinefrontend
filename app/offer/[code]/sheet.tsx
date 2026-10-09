import { RealtyMark } from "@/components/form"
import { dateTime, longDate, php, phpExact, shortDate, sqm } from "@/lib/format"
import { type ScheduleRow, pct } from "@/lib/schedule"
import { Heading, Installments, LocationBlock } from "./shared"

/** What a buyer sees before signing in. Property, price, plan and place; nothing about the buyer. */
export type OfferSheet = {
  price: number
  schedule: ScheduleRow[]
  fee_notes: string | null
  created_at: string
  /** When the buyer's link stops opening; null = no end. */
  expires_at: string | null
  project: { name: string | null; location: string | null; lat: number | null; lng: number | null; completion_date: string | null }
  unit: { name: string | null; unit_type: string | null; category: string | null; area_sqm: number | null }
  broker: string | null
}

type Who = { name: string; logo_url: string | null }

const when = (m: ScheduleRow) => (m.months && m.end_date ? `${shortDate(m.date)} – ${shortDate(m.end_date)}` : m.date ? shortDate(m.date) : "On completion")

/** The "Sales offer" sheet a buyer reads first: property details, fees, location and the payment plan. */
export function SalesOfferSheet({ sheet, realty, agent }: { sheet: OfferSheet; realty: Who; agent: string | null }) {
  const { project, unit, schedule } = sheet
  const rows: [string, string][] = [
    ["Project", project.name ?? "—"],
    ["Property type", unit.category ?? unit.unit_type ?? "—"],
    ["Unit", unit.name ?? "—"],
    ["Unit type", unit.unit_type ?? "—"],
    ["Saleable area", sqm(unit.area_sqm)],
    ["Selling price", php(sheet.price)],
  ]

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      <article className="border border-[#e0dcd5] bg-white px-5 py-8 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)] sm:px-10 sm:py-12">
        <header className="flex items-start justify-between gap-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">SALES OFFER</h1>
          <RealtyMark name={realty.name} logo={realty.logo_url} className="h-10 sm:h-14" />
        </header>
        <p className="mt-6 text-[15px] text-[#3d3a34]">
          Thank you for your interest in {realty.name}. Please find below the property details.
        </p>

        <section className="mt-8 break-inside-avoid">
          <Heading n="01" title="Property details" />
          <dl className="mt-5 divide-y divide-[#ebe7e1] border-y border-[#ebe7e1] sm:hidden">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a847a]">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <table className="mt-5 hidden w-full text-center text-[15px] sm:table">
            <thead>
              <tr className="bg-[#17150f] text-xs font-bold uppercase tracking-[0.1em] text-white">
                {rows.map(([k]) => (
                  <th key={k} className="px-3 py-3">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#ebe7e1]">
                {rows.map(([k, v]) => (
                  <td key={k} className="px-3 py-5 font-semibold">{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <div className="mt-4 space-y-1 text-sm leading-relaxed text-[#5a554d]">
            {sheet.fee_notes && <p className="whitespace-pre-line">* {sheet.fee_notes}</p>}
            <p>* Prices and availability are subject to change without notice.</p>
          </div>
        </section>

        <div className="mt-10">
          <LocationBlock n="02" name={project.name ?? "The project"} location={project.location} lat={project.lat} lng={project.lng} />
        </div>

        <section className="mt-10 break-inside-avoid">
          <Heading n="03" title="Payment plan" />
          <ol className="mt-5 divide-y divide-[#ebe7e1] border-y border-[#ebe7e1] sm:hidden">
            {schedule.map((m, i) => (
              <li key={i} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold">
                      <span className="mr-2 tabular-nums text-[var(--accent)]">{i + 1}</span>
                      {m.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#5a554d]">
                      {when(m)} · {pct(m.percent)}
                    </p>
                  </div>
                  <p className="shrink-0 text-right font-bold tabular-nums">{phpExact(m.amount)}</p>
                </div>
                <Installments m={m} />
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 bg-[#17150f] px-4 py-4 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Purchase price</p>
              <p className="text-lg font-bold tabular-nums">{phpExact(sheet.price)}</p>
            </li>
          </ol>
          <table className="mt-5 hidden w-full text-[15px] sm:table">
            <thead>
              <tr className="bg-[#17150f] text-xs font-bold uppercase tracking-[0.1em] text-white">
                <th className="w-12 px-3 py-3 text-center">#</th>
                <th className="px-3 py-3 text-center">Milestone</th>
                <th className="px-3 py-3 text-center">%</th>
                <th className="px-3 py-3 text-center">Date</th>
                <th className="px-3 py-3 text-right">Amount (PHP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe7e1]">
              {schedule.map((m, i) => (
                <tr key={i}>
                  <td className="px-3 py-4 text-center align-top font-bold tabular-nums text-[var(--accent)]">{i + 1}</td>
                  <td className="px-3 py-4 text-center align-top">
                    <p className="font-semibold">{m.label}</p>
                    {m.months && m.end_date && <p className="mt-0.5 text-sm text-[#5a554d]">{m.months} monthly payments of {phpExact(m.monthly ?? 0)}</p>}
                    <Installments m={m} />
                  </td>
                  <td className="px-3 py-4 text-center align-top font-semibold tabular-nums">{pct(m.percent)}</td>
                  <td className="px-3 py-4 text-center align-top font-semibold">{when(m)}</td>
                  <td className="px-3 py-4 text-right align-top font-bold tabular-nums">{phpExact(m.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#17150f]">
                <td colSpan={4} className="px-3 py-4 text-right text-sm font-bold uppercase tracking-[0.14em]">Purchase price</td>
                <td className="px-3 py-4 text-right text-lg font-bold tabular-nums">{phpExact(sheet.price)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {sheet.expires_at && (
          <p className="mt-8 border border-[#ebe7e1] bg-[#faf8f5] px-4 py-3 text-sm font-semibold text-[#3d3a34]">This offer is open until {dateTime(sheet.expires_at)} (Philippine time).</p>
        )}

        <footer className="mt-6 border-t border-[#ebe7e1] pt-4 text-xs text-[#8a847a]">
          Generated by {agent ?? realty.name}
          {sheet.broker ? ` · ${sheet.broker}` : ""} · {longDate(sheet.created_at)}
        </footer>
      </article>
    </div>
  )
}
