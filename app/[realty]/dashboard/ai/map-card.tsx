import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { SiteMapViewer } from "@/components/site-map/site-map"
import { lotName } from "@/components/site-map/geometry"
import type { MapCard as MapCardData } from "./actions"

/**
 * A project's site map under the AI's answer: the dashboard's own map, lots coloured by status, the
 * ones the answer is about outlined, the first zoomed in on with its photos and details beside it.
 */
export function MapCard({ slug, card }: { slug: string; card: MapCardData }) {
  const marked = card.lots.map((id) => card.map.lots.find((l) => l.id === id)).filter((l) => !!l)
  return (
    <div className="mt-4 rounded-2xl border border-[#e8eaed] bg-white shadow-[0_2px_12px_-2px_rgba(23,21,15,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#efebe5] px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-bold text-[#17150f]">
          <MapPin className="h-4 w-4 text-[var(--accent)]" />
          {card.project.name}
          {marked.length > 0 && <span className="font-semibold text-[#6b665d]"> · {marked.length <= 3 ? marked.map((l) => lotName(l)).join(", ") : `${marked.length} lots marked`}</span>}
        </p>
        <Link href={`/${slug}/dashboard/projects/${card.project.id}#site-map`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline">
          Open the site map <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="p-3">
        <SiteMapViewer map={card.map} alt={`${card.project.name} site development plan`} maxHeight="52vh" details modelPhotos={card.model_photos} markedIds={card.lots} offerPath={`/${slug}/dashboard/offers`} />
      </div>
    </div>
  )
}
