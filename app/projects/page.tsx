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
                  const site = SITE_PROJECTS[p.slug!]
                  const photos = site.updates.reduce((s, m) => s + m.photos.length, 0)
                  const feature = n === 0
                  return (
                    <li key={p.slug} className={feature ? "sm:col-span-2" : ""}>
                      <Reveal delay={(n % 2) * 0.07}>
                        <Link href={`/projects/${p.slug}`} className={`group relative block overflow-hidden bg-[#160c0a] text-white ${feature ? "aspect-[4/3] sm:aspect-[21/9]" : "aspect-[4/3] sm:aspect-[16/10]"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={site.hero[0] ?? p.image} alt={p.name} className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" />
                          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#160c0a]/90 via-[#160c0a]/20 to-transparent" />
                          {p.status && <span className="absolute left-0 top-0 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2a1d1b]">{p.status}</span>}
                          <span className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center bg-white/10 text-white backdrop-blur transition group-hover:bg-[#b4241c]">
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                          <div className={`absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 sm:p-8 ${feature ? "lg:flex-row lg:items-end lg:justify-between" : ""}`}>
                            <div>
                              <h3 className={`${serif} font-semibold leading-[1.02] tracking-tight ${feature ? "text-4xl sm:text-6xl" : "text-3xl sm:text-4xl"}`}>{p.name}</h3>
                              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/80 sm:text-base"><MapPin className="h-4 w-4 text-[#f0b6b1]" /> {p.place}</p>
                            </div>
                            <dl className="flex gap-6 text-white">
                              {[[site.unitTypes.length, site.unitTypes.length === 1 ? "Model" : "Models"], [site.amenities.length, "Amenities"], [photos || "—", "Photos"]].map(([v, l]) => (
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
              {others.length > 0 && (
                <p className="mt-6 text-sm text-[#6b5a56]">
                  <span className="font-semibold text-[#2a1d1b]">Also in {region}:</span> {others.map((o) => `${o.name} (${o.place})`).join(" · ")} — project pages coming.
                </p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
