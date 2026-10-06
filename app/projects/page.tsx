import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, MapPin } from "lucide-react"
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

/** jvconline.ph/projects — every Johndorf community, by region. */
export default function ProjectsIndexPage() {
  const withPage = PROJECTS.filter((p) => p.slug && SITE_PROJECTS[p.slug])
  const withoutPage = PROJECTS.filter((p) => !p.slug || !SITE_PROJECTS[p.slug])

  return (
    <div className="bg-[#fbf8f6] text-[#2a1d1b]">
      <SiteHeader />
      <section className="px-5 pb-16 pt-36 sm:px-8 sm:pt-44">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <Eyebrow>Portfolio</Eyebrow>
            <h1 className={`${serif} mt-4 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-tight sm:text-7xl`}>
              Communities across <span className="italic text-[#b4241c]">Visayas and Mindanao.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-[#6b5a56]">{PROJECTS.length} projects in four regions. Open any of them for the homes, the site plan, the amenities, the map and the construction photos, month by month.</p>
          </Reveal>
        </div>
      </section>

      {REGIONS.map((region) => {
        const items = withPage.filter((p) => p.region === region)
        if (!items.length) return null
        return (
          <section key={region} className="px-5 py-12 sm:px-8">
            <div className="mx-auto max-w-[1400px]">
              <Reveal>
                <div className="flex items-end justify-between border-b border-[#2a1d1b]/10 pb-4">
                  <h2 className={`${serif} text-3xl font-semibold tracking-tight sm:text-4xl`}>{region}</h2>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8968f]">{items.length} project{items.length === 1 ? "" : "s"}</p>
                </div>
              </Reveal>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p, n) => {
                  const site = SITE_PROJECTS[p.slug!]
                  const photos = site.updates.reduce((s, m) => s + m.photos.length, 0)
                  return (
                    <Reveal key={p.slug} delay={(n % 3) * 0.08}>
                      <li>
                        <Link href={`/projects/${p.slug}`} className="group block overflow-hidden rounded-[26px] bg-white shadow-[0_30px_70px_-45px_rgba(40,10,5,0.45)] transition hover:-translate-y-1">
                          <div className="relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={site.hero[0] ?? p.image} alt={p.name} className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                            {p.status && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2a1d1b]">{p.status}</span>}
                          </div>
                          <div className="p-6">
                            <h3 className={`${serif} text-2xl font-semibold tracking-tight`}>{p.name}</h3>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#6b5a56]"><MapPin className="h-3.5 w-3.5 text-[#b4241c]" /> {p.place}</p>
                            <p className="mt-4 text-xs text-[#a8968f]">
                              {site.unitTypes.map((u) => u.name).join(" · ")}
                              {photos ? ` · ${photos} progress photos` : ""}
                            </p>
                            <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b4241c]">
                              Open <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </Link>
                      </li>
                    </Reveal>
                  )
                })}
              </ul>
            </div>
          </section>
        )
      })}

      {withoutPage.length > 0 && (
        <section className="px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-[1400px] border-t border-[#2a1d1b]/10 pt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8968f]">Also by Johndorf</p>
            <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[#6b5a56]">
              {withoutPage.map((p) => (
                <li key={p.name}><span className="font-semibold text-[#2a1d1b]">{p.name}</span> · {p.place}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
