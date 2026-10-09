import { ArrowUpRight, MapPin } from "lucide-react"
import { phpExact, shortDate } from "@/lib/format"
import type { ScheduleRow } from "@/lib/schedule"

type Milestone = ScheduleRow

/** Numbered section title used throughout the document. */
export function Heading({ n, title, aside }: { n: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#17150f] pb-3">
      <h2 className="flex items-baseline gap-3 text-xl font-bold tracking-tight text-[#17150f] sm:text-2xl">
        <span className="text-sm font-bold tabular-nums text-[var(--accent)]">{n}</span>
        {title}
      </h2>
      {aside && <div className="text-sm font-semibold text-[#6b665d]">{aside}</div>}
    </div>
  )
}

/** Location with a static Google map that opens Google Maps. */
export function LocationBlock({ n, name, location, lat, lng }: { n: string; name: string; location: string | null; lat: number | null; lng: number | null }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hasPin = lat !== null && lng !== null
  if (!hasPin && !location) return null
  const spot = hasPin ? `${lat},${lng}` : [name, location, "Philippines"].filter(Boolean).join(", ")
  const open = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot)}`
  const img = key ? `https://maps.googleapis.com/maps/api/staticmap?size=640x300&scale=2&zoom=${hasPin ? 15 : 13}&maptype=roadmap&markers=color:0xb4241c%7C${encodeURIComponent(spot)}&key=${key}` : null
  return (
    <section className="break-inside-avoid">
      <Heading n={n} title="Location" aside={location ?? undefined} />
      <div className="mt-6 grid border border-[#ebe7e1] lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col justify-between gap-6 p-6">
          <div>
            <p className="text-2xl font-bold tracking-tight">{name}</p>
            {location && (
              <p className="mt-1 inline-flex items-center gap-2 text-[15px] font-semibold text-[#5a554d]">
                <MapPin className="h-4 w-4 text-[var(--accent)]" /> {location}
              </p>
            )}
          </div>
          <a href={open} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 border border-[#d9d4cb] px-4 py-2.5 text-sm font-bold hover:border-[#17150f] print:hidden">
            Open in Google Maps <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        {img && (
          <a href={open} target="_blank" rel="noreferrer" className="block border-t border-[#ebe7e1] lg:border-l lg:border-t-0" aria-label={`Open ${name} in Google Maps`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={`Map of ${name}`} width={640} height={300} className="h-full min-h-[220px] w-full object-cover" loading="lazy" />
          </a>
        )}
      </div>
    </section>
  )
}

/** "See all 24 payments": each month's date and amount, for a milestone paid monthly. */
export function Installments({ m }: { m: Milestone }) {
  if (!m.installments?.length) return null
  return (
    <details className="group mt-2 print:hidden">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-bold text-[var(--accent)] hover:underline">
        <span className="group-open:hidden">See all {m.installments.length} payments</span>
        <span className="hidden group-open:inline">Hide the monthly payments</span>
      </summary>
      <ol className="mt-2 max-w-sm divide-y divide-[#ebe7e1] border border-[#ebe7e1] bg-[#faf8f5] text-sm">
        {m.installments.map((x) => (
          <li key={x.n} className="flex items-center justify-between gap-4 px-3 py-1.5">
            <span className="text-[#5a554d]">
              <span className="mr-2 inline-block w-6 tabular-nums text-[#a39d92]">{x.n}</span>
              {shortDate(x.date)}
            </span>
            <span className="font-semibold tabular-nums">{phpExact(x.amount)}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}
