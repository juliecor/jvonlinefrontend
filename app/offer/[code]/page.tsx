import type { Metadata } from "next"
import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { RealtyMark } from "@/components/form"
import { ApiError, api } from "@/lib/api"
import { longDate, phpExact, sqm } from "@/lib/format"
import { PrintButton } from "./print-button"

type Offer = {
  code: string
  buyer_name: string
  purchase_date: string
  price: number
  schedule: { label: string; percent: number; date: string | null; amount: number }[]
  fee_notes: string | null
  created_at: string
  realty: { name: string; slug: string; logo_url: string | null; phone: string | null; email: string | null; address: string | null }
  project: { name: string; location: string | null; description: string | null; cover_url: string | null; completion_date: string | null }
  unit: { name: string; unit_type: string | null; category: string; floor: string | null; area_sqm: number | null; floor_plan_url: string | null; notes: string | null }
  agent: { name: string; email: string } | null
}

type Props = { params: Promise<{ code: string }> }

export const metadata: Metadata = { title: "Sales offer", robots: { index: false, follow: false } }

/** jvconline.ph/offer/<code> — the buyer's page. Public, unlisted, printable. */
export default async function OfferPage({ params }: Props) {
  const { code } = await params
  let offer: Offer | null = null
  let problem: string | null = null
  try {
    offer = await api<Offer>(`/offers/${encodeURIComponent(code)}`)
  } catch (e) {
    problem = e instanceof ApiError && (e.status === 404 || e.status === 410) ? (e.status === 404 ? "We couldn't find this offer. Check the link with your agent." : e.message) : "We couldn't load this offer right now. Please try again in a moment."
  }

  if (!offer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">Offer unavailable</h1>
          <p className="mt-3 text-sm text-slate-600">{problem}</p>
          <Link href="/" className="mt-6 inline-block text-sm font-semibold underline-offset-4 hover:underline">jvconline</Link>
        </div>
      </main>
    )
  }

  const { realty, project, unit, agent } = offer
  const details: [string, string | null][] = [
    ["Project", project.name],
    ["Location", project.location],
    ["Unit", unit.name],
    ["Type", unit.unit_type],
    ["Category", unit.category],
    ["Floor / phase", unit.floor],
    ["Area", unit.area_sqm !== null ? sqm(unit.area_sqm) : null],
    ["Turnover", project.completion_date ? longDate(project.completion_date) : null],
  ]

  return (
    <main className="min-h-screen bg-slate-100 py-6 text-slate-900 print:bg-white print:py-0 sm:py-12">
      <article className="mx-auto max-w-3xl bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] print:shadow-none sm:rounded-3xl">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-6 px-6 pt-8 sm:px-10 sm:pt-10">
          <div>
            <RealtyMark name={realty.name} logo={realty.logo_url} className="h-14" />
            {realty.logo_url && <p className="mt-3 text-sm font-medium text-slate-700">{realty.name}</p>}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Sales offer</p>
            <p className="mt-1 font-mono text-sm text-slate-600">{offer.code}</p>
            <p className="mt-1 text-xs text-slate-400">{longDate(offer.created_at)}</p>
          </div>
        </header>

        <div className="px-6 pb-10 pt-8 sm:px-10">
          <p className="text-sm text-slate-500">Prepared for</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{offer.buyer_name}</h1>
          <p className="mt-3 max-w-xl text-slate-600">
            Thank you for your interest in {project.name}. Here are the details of {unit.name} and how the payment is spread out.
          </p>

          {/* Property */}
          {project.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.cover_url} alt={project.name} className="mt-8 aspect-[16/7] w-full rounded-2xl object-cover" />
          )}
          <section className="mt-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">The property</h2>
            <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {details.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {unit.notes && <p className="mt-3 text-sm text-slate-600">{unit.notes}</p>}
            <div className="mt-6 flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-slate-900 px-6 py-5 text-white">
              <p className="text-sm text-white/70">Selling price</p>
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{phpExact(offer.price)}</p>
            </div>
          </section>

          {/* Payment plan */}
          <section className="mt-10">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Payment plan</h2>
            <p className="mt-2 text-sm text-slate-500">Counted from the purchase date, {longDate(offer.purchase_date)}.</p>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 pr-3 font-semibold">#</th>
                  <th className="py-2 pr-3 font-semibold">Milestone</th>
                  <th className="py-2 pr-3 text-right font-semibold">%</th>
                  <th className="hidden py-2 pr-3 font-semibold sm:table-cell">Date</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offer.schedule.map((m, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-3 text-slate-400">{i + 1}</td>
                    <td className="py-3 pr-3">
                      <p className="font-medium">{m.label}</p>
                      <p className="text-xs text-slate-500 sm:hidden">{m.date ? longDate(m.date) : "On completion"}</p>
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums text-slate-600">{m.percent}%</td>
                    <td className="hidden py-3 pr-3 text-slate-600 sm:table-cell">{m.date ? longDate(m.date) : "On completion"}</td>
                    <td className="py-3 text-right font-medium tabular-nums">{phpExact(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900">
                  <td colSpan={4} className="py-3 pr-3 text-right text-sm font-semibold sm:text-left">Total</td>
                  <td className="py-3 text-right text-base font-semibold tabular-nums">{phpExact(offer.price)}</td>
                </tr>
              </tfoot>
            </table>
            {offer.fee_notes && <p className="mt-4 whitespace-pre-line text-xs leading-relaxed text-slate-500">{offer.fee_notes}</p>}
          </section>

          {/* Floor plan */}
          {unit.floor_plan_url && (
            <section className="mt-10 break-inside-avoid">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Floor plan</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={unit.floor_plan_url} alt={`Floor plan of ${unit.name}`} className="mt-4 w-full rounded-2xl border border-slate-200 bg-white" />
            </section>
          )}

          {project.description && (
            <section className="mt-10">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">About {project.name}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{project.description}</p>
            </section>
          )}

          {/* Contact */}
          <section className="mt-10 rounded-2xl border border-slate-200 p-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Your contact</h2>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
              <div>
                {agent && <p className="text-lg font-semibold">{agent.name}</p>}
                <p className="text-sm text-slate-500">{realty.name}</p>
                <div className="mt-3 space-y-1.5 text-sm">
                  {agent?.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> <a href={`mailto:${agent.email}`} className="hover:underline">{agent.email}</a></p>}
                  {realty.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> <a href={`tel:${realty.phone}`} className="hover:underline">{realty.phone}</a></p>}
                  {realty.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {realty.address}</p>}
                </div>
              </div>
              <PrintButton />
            </div>
          </section>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <p>Prices and availability may change until a reservation is made.</p>
            <p>
              Powered by <Link href="/" className="font-medium text-slate-500 hover:text-slate-900">jvconline</Link>
            </p>
          </footer>
        </div>
      </article>
    </main>
  )
}
