import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { publicProjects } from "@/lib/public-projects"
import { Eyebrow, Reveal } from "../johndorf/home/ui"
import { serif } from "../johndorf/tokens"
import { SiteHeader } from "./header"

export const metadata: Metadata = {
  title: "Projects",
  description: "Johndorf Ventures Corporation's communities across Cebu, Cagayan de Oro, Davao and Iligan — every project with its homes, site plan, amenities and construction updates.",
}

const REGION_ORDER = ["Cebu", "Cagayan de Oro", "Davao", "Iligan"]

/** jvconline.ph/projects — every published Johndorf project, by region, straight from the dashboard. */
export default async function ProjectsIndexPage() {
  const all = await publicProjects()
  const regions = [...new Set(all.map((p) => p.region ?? "Other"))].sort((a, b) => {
    const ia = REGION_ORDER.indexOf(a), ib = REGION_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  const totalPhotos = all.reduce((n, p) => n + p.total_photos, 0)

  return (
    <div className="bg-[#fbf8f6] text-[#2a1d1b]">
      <SiteHeader />

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
                [String(all.length), "Projects"],
                [String(regions.length), regions.length === 1 ? "Region" : "Regions"],
                [totalPhotos.toLocaleString("en-PH"), "Progress photos"],
              ].map(([v, l]) => (
                <div key={l} className="bg-white p-5">
                  <dd className={`${serif} text-3xl font-semibold tracking-tight sm:text-4xl`}>{v}</dd>
                  <dt className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8968f]">{l}</dt>
                </div>
              ))}
            </dl>
            <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-semibold uppercase tracking-[0.14em]">
              {regions.map((r) => (
                <a key={r} href={`#${r.toLowerCase().replace(/\s+/g, "-")}`} className="text-[#4b3b37] hover:text-[#b4241c]">
                  {r} <span className="text-[#a8968f]">{all.filter((p) => (p.region ?? "Other") === r).length}</span>
                </a>
              ))}
            </nav>
          </Reveal>
        </div>
      </section>

      {all.length === 0 && (
        <section className="px-5 py-24 text-center text-[#6b5a56] sm:px-8">Project pages are being prepared.</section>
      )}

      {regions.map((region) => {
        const items = all.filter((p) => (p.region ?? "Other") === region)
        return (
          <section key={region} id={region.toLowerCase().replace(/\s+/g, "-")} className="scroll-mt-20 px-5 py-14 sm:px-8">
            <div className="mx-auto max-w-[1400px]">
              <Reveal>
                <div className="flex items-end justify-between border-b-2 border-[#2a1d1b] pb-3">
                  <h2 className={`${serif} text-3xl font-semibold tracking-tight sm:text-4xl`}>{region}</h2>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8968f]">{items.length} project{items.length === 1 ? "" : "s"}</p>
                </div>
              </Reveal>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                {items.map((p, n) => {
                  const feature = n === 0
                  return (
                    <li key={p.slug} className={feature ? "sm:col-span-2" : ""}>
                      <Reveal delay={(n % 2) * 0.07}>
                        <Link href={`/projects/${p.slug}`} className={`group relative block overflow-hidden bg-[#160c0a] text-white ${feature ? "aspect-[4/3] sm:aspect-[21/9]" : "aspect-[4/3] sm:aspect-[16/10]"}`}>
                          {p.hero[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.hero[0]} alt={p.name} className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" />
                          )}
                          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#160c0a]/90 via-[#160c0a]/20 to-transparent" />
                          {p.stage && <span className="absolute left-0 top-0 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2a1d1b]">{p.stage}</span>}
                          <span className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center bg-white/10 text-white backdrop-blur transition group-hover:bg-[#b4241c]">
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                          <div className={`absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 sm:p-8 ${feature ? "lg:flex-row lg:items-end lg:justify-between" : ""}`}>
                            <div>
                              <h3 className={`${serif} font-semibold leading-[1.02] tracking-tight ${feature ? "text-4xl sm:text-6xl" : "text-3xl sm:text-4xl"}`}>{p.name}</h3>
                              {p.location && <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/80 sm:text-base"><MapPin className="h-4 w-4 text-[#f0b6b1]" /> {p.location}</p>}
                            </div>
                            <dl className="flex gap-6 text-white">
                              {[[p.unit_types.length, p.unit_types.length === 1 ? "Model" : "Models"], [p.amenities_count, "Amenities"], [p.total_photos || "—", "Photos"]].map(([v, l]) => (
                                <div key={String(l)}>
                                  <dd className={`${serif} text-2xl font-semibold sm:text-3xl`}>{v}</dd>
                                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">{l}</dt>
                                </div>
                              ))}
                            </dl>
                          </div>
                        </Link>
                      </Reveal>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        )
      })}
    </div>
  )
}
