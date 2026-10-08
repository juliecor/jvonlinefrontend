import Link from "next/link"
import { FilePlus2 } from "lucide-react"
import { php, phpExact, shortDate } from "@/lib/format"
import type { PaymentCard as Payment } from "./actions"

/**
 * The realty's colour in four ordered steps, darkest for the first payment
 * (checked: one hue, clear steps, the lightest still 2:1 on white). A schedule
 * with more parts shows the first three and the rest together on the bar.
 */
const SHADES = ["color-mix(in srgb, var(--accent) 60%, black)", "var(--accent)", "color-mix(in srgb, var(--accent) 70%, white)", "color-mix(in srgb, var(--accent) 45%, white)"]
const shade = (i: number) => SHADES[Math.min(i, SHADES.length - 1)]

/** "Make offer with these terms": the plan itself, or the custom terms, ready in the New offer form. */
function offerLink(slug: string, p: Payment): string {
  const q = new URLSearchParams({ project: String(p.project?.id ?? ""), unit: String(p.unit?.id ?? "") })
  if (p.plan_id) q.set("plan", String(p.plan_id))
  else q.set("terms", JSON.stringify(p.milestones))
  if (p.purchase_date >= new Date().toISOString().slice(0, 10)) q.set("date", p.purchase_date)
  return `/${slug}/dashboard/offers/new?${q}`
}

/**
 * A payment schedule the AI worked out (the same math as the offers): the
 * monthly amount up front, the split of the price as a bar, every payment
 * with its date, and Make offer with these terms.
 */
export function PaymentCard({ slug, card: p }: { slug: string; card: Payment }) {
  const monthly = p.payments.find((r) => r.months && r.monthly)
  const bar = p.payments.length > 4 ? [...p.payments.slice(0, 3), { label: "Other payments", percent: p.payments.slice(3).reduce((s, r) => s + r.percent, 0), amount: p.payments.slice(3).reduce((s, r) => s + r.amount, 0) }] : p.payments
  const total = p.payments.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="mt-4 border border-[#e0dcd5] bg-white">
      <div className="border-b border-[#efebe5] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">Payments · {p.terms}</p>
        <p className="mt-0.5 text-base font-bold text-[#17150f]">
          {p.unit ? p.unit.name : "A price of " + php(p.price)}
          {p.project && <span className="font-semibold text-[#6b665d]"> · {p.project.name}</span>}
        </p>
      </div>

      <div className="px-4 pt-4">
        {monthly ? (
          <p className="text-[#17150f]">
            <span className="text-2xl font-bold tabular-nums">{phpExact(monthly.monthly as number)}</span>
            <span className="ml-1.5 text-sm font-semibold text-[#5a554d]">
              a month for {monthly.months} months · {monthly.label.toLowerCase()}
            </span>
          </p>
        ) : (
          <p className="text-2xl font-bold tabular-nums text-[#17150f]">{phpExact(total)}</p>
        )}
        <p className="mt-0.5 text-sm text-[#6b665d]">
          Price {php(p.price)} · from {shortDate(p.purchase_date)}
        </p>

        {/* How the price splits: one segment per payment, 2px gaps between them. */}
        <div className="mt-4 flex h-3 gap-[2px] bg-white" role="img" aria-label={bar.map((r) => `${r.label} ${r.percent}%`).join(", ")}>
          {bar.map((r, i) => (
            <span key={i} title={`${r.label} · ${r.percent}% · ${phpExact(r.amount)}`} className="h-full min-w-1" style={{ flexGrow: r.percent, flexBasis: 0, background: shade(i) }} />
          ))}
        </div>
      </div>

      <ul className="divide-y divide-[#efebe5] px-4 py-2">
        {p.payments.map((r, i) => (
          <li key={i} className="flex items-start gap-3 py-2.5">
            <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0" style={{ background: shade(i) }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#17150f]">
                {r.label} <span className="font-semibold text-[#8a847a]">{r.percent}%</span>
              </p>
              <p className="text-xs text-[#6b665d]">
                {r.months && r.monthly
                  ? `${r.months} × ${phpExact(r.monthly)}, ${shortDate(r.date as string)} – ${shortDate(r.end_date as string)}${r.last_month && r.last_month !== r.monthly ? ` (last ${phpExact(r.last_month)})` : ""}`
                  : r.date
                    ? shortDate(r.date)
                    : "On turnover (date not announced yet)"}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold tabular-nums text-[#17150f]">{phpExact(r.amount)}</p>
          </li>
        ))}
        <li className="flex items-center justify-between py-2.5 text-sm font-bold text-[#17150f]">
          <span>Total</span>
          <span className="tabular-nums">{phpExact(total)}</span>
        </li>
      </ul>

      {p.price_now !== null && (
        <p className="mx-4 mb-3 border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          The price is now {php(p.price_now)}. A new offer uses today&apos;s price.
        </p>
      )}
      {p.can_offer && p.unit && p.project && (
        <div className="border-t border-[#efebe5] p-2.5 sm:px-4">
          <Link href={offerLink(slug, p)} className="inline-flex w-full items-center justify-center gap-1.5 bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 sm:w-auto">
            <FilePlus2 className="h-4 w-4" /> Make offer with these terms
          </Link>
        </div>
      )}
    </div>
  )
}
