"use client"

import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { PROJECTS } from "@/lib/johndorf/company"
import { SITE_PROJECTS } from "@/lib/johndorf/site-projects"
import { Eyebrow, Reveal, serif } from "./ui"

/** Right under the opening: six projects as big, flat image cards that lead to their own pages. */
export function FeaturedProjects() {
  const picks = ["montierra", "plumera", "villa-castena", "navona-court", "tierranava-opol", "coral-village"]
    .map((slug) => PROJECTS.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p && p.slug && SITE_PROJECTS[p.slug]))

  return (
    <section className="bg-[#fbf8f6] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-[#2a1d1b] pb-6">
            <div>
              <Eyebrow>Project pages</Eyebrow>
              <h2 className={`${serif} mt-4 text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl`}>
                Every community, <span className="italic text-[#b4241c]">its own page.</span>
              </h2>
            </div>
            <Link href="/projects" className="inline-flex items-center gap-2 bg-[#2a1d1b] px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#b4241c]">
              All {PROJECTS.length} projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((p, i) => {
            const site = SITE_PROJECTS[p.slug!]
            const photos = site.updates.reduce((s, m) => s + m.photos.length, 0)
            return (
              <li key={p.slug}>
                <Reveal delay={(i % 3) * 0.07}>
                  <Link href={`/projects/${p.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-[#160c0a] text-white sm:aspect-[5/4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={site.hero[0] ?? p.image} alt={p.name} className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#160c0a]/90 via-[#160c0a]/20 to-transparent" />
                    {p.status && <span className="absolute left-0 top-0 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2a1d1b]">{p.status}</span>}
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                      <p className={`${serif} text-3xl font-semibold leading-[1.02] tracking-tight sm:text-4xl`}>{p.name}</p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-3.5 w-3.5 text-[#f0b6b1]" /> {p.place}</p>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                        {site.unitTypes.length} model{site.unitTypes.length === 1 ? "" : "s"} · {site.amenities.length} amenities{photos ? ` · ${photos} progress photos` : ""}
                      </p>
                    </div>
                    <span className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center bg-white/10 text-white backdrop-blur transition group-hover:bg-[#b4241c]">
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
