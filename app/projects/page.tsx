import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { PROJECTS, type Region } from "@/lib/johndorf/company"
import { SITE_PROJECTS } from "@/lib/johndorf/site-projects"
import { Eyebrow, Reveal } from "../johndorf/home/ui"
import { serif } from "../johndorf/tokens"
import { SiteHeader } from "./header"

export const metadata: Metadata = {
  title: "Projects",
  description: "Johndorf Ventures Corporation's communities across Cebu, Cagayan de Oro, Davao and Iligan — every project with its homes, site plan, amenities and construction updates.",
}

const REGIONS: Region[] = ["Cebu", "Cagayan de Oro", "Davao", "Iligan"]

/** jvconline.ph/projects — every Johndorf community, by region. Flat, dense, no empty columns. */
export default function ProjectsIndexPage() {
  const withPage = PROJECTS.filter((p) => p.slug && SITE_PROJECTS[p.slug])
  const withoutPage = PROJECTS.filter((p) => !p.slug || !SITE_PROJECTS[p.slug])
  const totalPhotos = withPage.reduce((n, p) => n + SITE_PROJECTS[p.slug!].updates.reduce((s, m) => s + m.photos.length, 0), 0)
  const counts = REGIONS.map((r) => ({ r, n: PROJECTS.filter((p) => p.region === r).length }))

  return (
    <div className="bg-[#fbf8f6] text-[#2a1d1b]">
      <SiteHeader />

      {/* Header: title left, the numbers and region jumps right — no empty half. */}
      <section className="border-b border-[#2a1d1b]/10 px-5 pb-10 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <Reveal>
            <Eyebrow>Portfolio</Eyebrow>
            <h1 className={`${serif} mt-4 text-5xl font-semibold leading-[0.98] tracking-tight sm:text-7xl`}>
              Communities across <span className="italic text-[#b4241c]">Visayas and Mindanao.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <dl className="grid grid-cols-3 gap-px border border-[#2a1d1b]/10 bg-[#2a1d1b]/10">
              {[
                [String(PROJECTS.length), "Projects"],
                ["4", "Regions"],
                [totalPhotos.toLocaleString("en-PH"), "Progress photos"],
              ].map(([v, l]) => (
                <div key={l} className="bg-white p-5">
                  <dd className={`${serif} text-3xl font-semibold tracking-tight sm:text-4xl`}>{v}</dd>
                  <dt className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8968f]">{l}</dt>
                </div>
              ))}
            </dl>
            <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-semibold uppercase tracking-[0.14em]">
              {counts.map(({ r, n }) => (
                <a key={r} href={`#${r.toLowerCase().replace(/\s+/g, "-")}`} className="text-[#4b3b37] hover:text-[#b4241c]">
                  {r} <span className="text-[#a8968f]">{n}</span>
                </a>
              ))}
            </nav>
          </Reveal>
        </div>
      </section>

      {REGIONS.map((region) => {
        const items = withPage.filter((p) => p.region === region)
        if (!items.length) return null
        const others = withoutPage.filter((p) => p.region === region)
        const fillers = (3 - (items.length % 3)) % 3
        return (
          <section key={region} id={region.toLowerCase().replace(/\s+/g, "-")} className="scroll-mt-20 px-5 py-14 sm:px-8">
            <div className="mx-auto max-w-[1400px]">
              <Reveal>
                <div className="flex items-end justify-between border-b-2 border-[#2a1d1b] pb-3">
                  <h2 className={`${serif} text-3xl font-semibold tracking-tight sm:text-4xl`}>{region}</h2>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8968f]">{items.length} project{items.length === 1 ? "" : "s"}</p>
                </div>
              </Reveal>
              {/* Hairline grid: cards touch, nothing floats. */}
              <ul className="mt-px grid gap-px bg-[#2a1d1b]/10 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p, n) => {
                  const site = SITE_PROJECTS[p.slug!]
                  const photos = site.updates.reduce((s, m) => s + m.photos.length, 0)
                  return (
                    <li key={p.slug} className="bg-white">
                      <Reveal delay={(n % 3) * 0.06} className="h-full">
                        <Link href={`/projects/${p.slug}`} className="group flex h-full flex-col">
                          <div className="relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={site.hero[0] ?? p.image} alt={p.name} className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                            {p.status && <span className="absolute left-0 top-0 bg-[#2a1d1b] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">{p.status}</span>}
                          </div>
                          <div className="flex flex-1 flex-col p-5">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className={`${serif} text-2xl font-semibold tracking-tight`}>{p.name}</h3>
                              <ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-[#b4241c] transition-transform group-hover:translate-x-1" />
                            </div>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#6b5a56]"><MapPin className="h-3.5 w-3.5 text-[#b4241c]" /> {p.place}</p>
                            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-[#2a1d1b]/10 pt-3 text-[11px] uppercase tracking-[0.12em] text-[#a8968f]">
                              <div><dd className="text-base font-semibold normal-case tracking-normal text-[#2a1d1b]">{site.unitTypes.length}</dd><dt>Model{site.unitTypes.length === 1 ? "" : "s"}</dt></div>
                              <div><dd className="text-base font-semibold normal-case tracking-normal text-[#2a1d1b]">{site.amenities.length}</dd><dt>Amenities</dt></div>
                              <div><dd className="text-base font-semibold normal-case tracking-normal text-[#2a1d1b]">{photos || "—"}</dd><dt>Photos</dt></div>
                            </dl>
                          </div>
                        </Link>
                      </Reveal>
                    </li>
                  )
                })}
                {/* Keep the grid rectangular: the region's other projects fill the last row instead of a gap. */}
                {Array.from({ length: fillers }).map((_, i) => (
                  <li key={`fill-${i}`} className="hidden bg-[#f3ece9] p-5 lg:block">
                    {i === 0 && others.length > 0 ? (
                      <>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8968f]">Also in {region}</p>
                        <ul className="mt-3 space-y-3">
                          {others.map((o) => (
                            <li key={o.name}>
                              <p className={`${serif} text-xl font-semibold`}>{o.name}</p>
                              <p className="text-xs text-[#6b5a56]">{o.place} · project page coming</p>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8968f]">Johndorf · {region}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )
      })}
    </div>
  )
}
