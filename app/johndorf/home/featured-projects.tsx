"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PROJECTS } from "@/lib/johndorf/company"
import { SITE_PROJECTS } from "@/lib/johndorf/site-projects"
import { Reveal, serif } from "./ui"

/** Right under the opening: a flat strip of projects that lead to their own pages. */
export function FeaturedProjects() {
  const picks = ["montierra", "plumera", "villa-castena", "navona-court", "tierranava-opol", "coral-village"]
    .map((slug) => PROJECTS.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p && p.slug && SITE_PROJECTS[p.slug]))

  return (
    <section className="border-y border-[#2a1d1b]/10 bg-white">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b4241c]">Project pages</p>
          <Link href="/projects" className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#2a1d1b] hover:text-[#b4241c]">
            All {PROJECTS.length} projects <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-px border-t border-[#2a1d1b]/10 bg-[#2a1d1b]/10 sm:grid-cols-3 lg:grid-cols-6">
          {picks.map((p, i) => {
            const site = SITE_PROJECTS[p.slug!]
            return (
              <li key={p.slug} className="bg-white">
                <Reveal delay={i * 0.05} className="h-full">
                  <Link href={`/projects/${p.slug}`} className="group block h-full">
                    <div className="overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={site.hero[0] ?? p.image} alt={p.name} className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                    </div>
                    <div className="p-4">
                      <p className={`${serif} text-lg font-semibold leading-tight`}>{p.name}</p>
                      <p className="mt-0.5 truncate text-xs text-[#6b5a56]">{p.place}</p>
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
}
