import Link from "next/link"
import { ArrowRight, Building2, FilePlus2 } from "lucide-react"
import { php, sqm } from "@/lib/format"
import type { UnitCard } from "./actions"

const TONE: Record<UnitCard["status"], string> = { available: "bg-emerald-700", reserved: "bg-amber-600", sold: "bg-[#17150f]" }

/**
 * The units the AI put under its answer: photo, price and status, with Make
 * offer (the New offer pop-up, unit already picked) when it can be sold.
 * Phones get a small photo on the side and the buttons in one row, so six
 * cards don't make a long scroll.
 */
export function UnitCards({ slug, cards }: { slug: string; cards: UnitCard[] }) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <li key={c.id} className="flex flex-col overflow-hidden border border-[#e0dcd5] bg-white">
          <div className="flex flex-1 sm:flex-col">
            <div className="relative min-h-28 w-24 shrink-0 bg-[#f1eee9] sm:aspect-[16/10] sm:min-h-0 sm:w-full">
              {c.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <Building2 className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[#c9c3b8]" />
              )}
              <span className={`absolute left-2 top-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white ${TONE[c.status]}`}>{c.status}</span>
            </div>
            <div className="min-w-0 flex-1 p-3 sm:p-4">
              <p className="truncate text-xs font-bold uppercase tracking-[0.1em] text-[var(--accent)]">{c.project.name}</p>
              <p className="mt-0.5 text-base font-bold leading-snug text-[#17150f]">{c.name}</p>
              <p className="mt-0.5 text-sm text-[#6b665d]">{[c.unit_type !== c.name ? c.unit_type : null, c.area_sqm ? sqm(c.area_sqm) : null, c.floor].filter(Boolean).join(" · ")}</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-[#17150f]">{c.price === null ? "Price on request" : php(c.price)}</p>
            </div>
          </div>
          <div className="flex gap-2 border-t border-[#efebe5] p-2.5 sm:px-4 sm:py-3">
            {c.can_offer && (
              <Link href={`/${slug}/dashboard/offers/new?project=${c.project.id}&unit=${c.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white transition hover:brightness-110 sm:flex-none">
                <FilePlus2 className="h-4 w-4" /> Make offer
              </Link>
            )}
            <Link href={`/${slug}/dashboard/projects/${c.project.id}?unit=${encodeURIComponent(c.name)}#units`} className="inline-flex flex-1 items-center justify-center gap-1.5 border border-[#d9d4cb] px-3 py-2 text-sm font-bold text-[#17150f] transition hover:border-[#17150f] sm:flex-none">
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}
