"use client"

import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import type { PublicProjectCard } from "@/lib/public-projects-types"
import { Eyebrow, Reveal, serif } from "./ui"

/** Right under the opening: six published projects as big, flat image cards that lead to their own pages. */
export function FeaturedProjects({ projects }: { projects: PublicProjectCard[] }) {
  if (projects.length === 0) return null
  // Lead with the ones that have the most to show.
  const picks = [...projects].sort((a, b) => b.total_photos + b.unit_types.length * 20 - (a.total_photos + a.unit_types.length * 20)).slice(0, 6)

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
              All {projects.length} projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((p, i) => (
            <li key={p.slug}>
              <Reveal delay={(i % 3) * 0.07}>
                <Link href={`/projects/${p.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-[#160c0a] text-white sm:aspect-[5/4]">
                  {p.hero[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.hero[0]} alt={p.name} className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" />
                  )}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#160c0a]/90 via-[#160c0a]/20 to-transparent" />
                  {p.stage && <span className="absolute left-0 top-0 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2a1d1b]">{p.stage}</span>}
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                    <p className={`${serif} text-3xl font-semibold leading-[1.02] tracking-tight sm:text-4xl`}>{p.name}</p>
                    {p.location && <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-3.5 w-3.5 text-[#f0b6b1]" /> {p.location}</p>}
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                      {p.unit_types.length} model{p.unit_types.length === 1 ? "" : "s"} · {p.amenities_count} amenities{p.total_photos ? ` · ${p.total_photos} progress photos` : ""}
                    </p>
                  </div>
                  <span className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center bg-white/10 text-white backdrop-blur transition group-hover:bg-[#b4241c]">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
