import Link from "next/link"
import { ArrowRight, Building2, MapPin, Plus } from "lucide-react"
import { php } from "@/lib/format"
import type { ProjectCard } from "./actions"
import { Photo } from "@/components/photo"

/**
 * Projects the AI put under its answer: photo, place, stage, units left and
 * price range, with New offer (the pop-up, project already picked) and View.
 */
export function ProjectCards({ slug, cards }: { slug: string; cards: ProjectCard[] }) {
  return (
    <div className="@container mt-4">
      <ul className="grid gap-3 @lg:grid-cols-2">
        {cards.map((p) => (
          <li key={p.id} className="flex flex-col overflow-hidden border border-[#e0dcd5] bg-white">
            <div className="flex flex-1 @lg:flex-col">
              <div className="relative min-h-28 w-24 shrink-0 bg-[#f1eee9] @lg:aspect-[16/9] @lg:min-h-0 @lg:w-full">
                {p.photo ? (
                  <Photo src={p.photo} sizes="(min-width: 640px) 360px, 96px" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <Building2 className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[#c9c3b8]" />
                )}
                {(p.stage || !p.open) && (
                  <span className={`absolute left-2 top-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white ${p.open ? "bg-[#17150f]/85" : "bg-[#8a847a]"}`}>{p.open ? p.stage : "Archived"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 p-3 @lg:p-4">
                <p className="text-base font-bold leading-snug text-[#17150f]">{p.name}</p>
                {p.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-[#6b665d]">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" /> <span className="truncate">{p.location}</span>
                  </p>
                )}
                <p className="mt-1.5 text-lg font-bold tabular-nums text-[#17150f]">{p.price ? (p.price.min === p.price.max ? php(p.price.min) : `${php(p.price.min)} – ${php(p.price.max)}`) : "Prices not set yet"}</p>
                <p className="mt-0.5 text-sm text-[#5a554d]">
                  <span className="font-bold text-[#17150f]">{p.units.available}</span> of {p.units.total} {p.units.total === 1 ? "unit" : "units"} available
                  {p.units.reserved + p.units.sold > 0 && ` · ${p.units.reserved} reserved · ${p.units.sold} sold`}
                  {p.plans > 0 && ` · ${p.plans} payment plan${p.plans === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 border-t border-[#efebe5] p-2.5 @lg:px-4 @lg:py-3">
              {p.can_offer && (
                <Link href={`/${slug}/dashboard/offers/new?project=${p.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white transition hover:brightness-110 @lg:flex-none">
                  <Plus className="h-4 w-4" /> New offer
                </Link>
              )}
              <Link href={`/${slug}/dashboard/projects/${p.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 border border-[#d9d4cb] px-3 py-2 text-sm font-bold text-[#17150f] transition hover:border-[#17150f] @lg:flex-none">
                View project <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
