import { ExternalLink, MapPin } from "lucide-react"

/**
 * The project's location on the buyer's page. With a Google Maps key (and the
 * Maps Embed API switched on for it) it shows an embedded map; without one it
 * still gives an "Open in Google Maps" link. Coordinates win over the text.
 */
export function LocationMap({ name, location, lat, lng }: { name: string; location: string | null; lat: number | null; lng: number | null }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hasPin = lat !== null && lng !== null
  const query = hasPin ? `${lat},${lng}` : [name, location, "Philippines"].filter(Boolean).join(", ")
  if (!hasPin && !location) return null

  const open = hasPin ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  const embed = key ? (hasPin ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${lat},${lng}&zoom=15` : `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(query)}`) : null

  return (
    <section className="mt-10 break-inside-avoid">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Location</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        {embed && (
          <iframe
            title={`Map of ${name}`}
            src={embed}
            className="block h-[320px] w-full print:hidden"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
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
