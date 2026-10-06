import { ExternalLink, MapPin } from "lucide-react"

/**
 * The project's location on the buyer's page: a Google Static Map (prints
 * like the rest of the page) that opens Google Maps when clicked. Needs
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY with the Maps Static API; without a key the
 * link alone is shown. Coordinates win over the text.
 */
export function LocationMap({ name, location, lat, lng }: { name: string; location: string | null; lat: number | null; lng: number | null }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hasPin = lat !== null && lng !== null
  if (!hasPin && !location) return null

  const spot = hasPin ? `${lat},${lng}` : [name, location, "Philippines"].filter(Boolean).join(", ")
  const open = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot)}`
  const img = key
    ? `https://maps.googleapis.com/maps/api/staticmap?size=640x320&scale=2&zoom=${hasPin ? 15 : 13}&maptype=roadmap&markers=color:0xb4241c%7C${encodeURIComponent(spot)}&key=${key}`
    : null

  return (
    <section className="mt-10 break-inside-avoid">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Location</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        {img && (
          <a href={open} target="_blank" rel="noreferrer" aria-label={`Open ${name} in Google Maps`} className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={`Map of ${name}${location ? `, ${location}` : ""}`} width={640} height={320} className="aspect-[2/1] w-full object-cover" loading="lazy" />
          </a>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <p className="flex items-center gap-2 text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400" /> {location ?? name}
          </p>
          <a href={open} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-slate-900 hover:underline">
            Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
