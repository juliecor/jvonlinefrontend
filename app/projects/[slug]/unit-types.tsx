"use client"

import { useState } from "react"
import { Bath, BedDouble, Car, Layers, Ruler, SquareDashed } from "lucide-react"
import { Reveal, serif } from "../../johndorf/home/ui"
import { type PublicUnitType, SPEC_LABELS } from "@/lib/public-projects-types"
import { Lightbox } from "./lightbox"

const ICON = { usable_floor_area: Ruler, typical_floor_area: SquareDashed, bedrooms: BedDouble, baths: Bath, floors: Layers, parking: Car } as const
const UNIT = { usable_floor_area: " sqm", typical_floor_area: " sqm", bedrooms: "", baths: "", floors: "", parking: "" } as const

/** The house or unit models, each with its renders and Johndorf's own spec sheet. */
export function UnitTypes({ units, sections }: { units: PublicUnitType[]; sections: { href: string; label: string }[] }) {
  const [view, setView] = useState<{ photos: string[]; index: number; name: string } | null>(null)
  return (
    <>
      <div className={`mt-12 grid gap-6 ${units.length > 1 ? "lg:grid-cols-2" : ""}`}>
        {units.map((u, n) => (
          <Reveal key={u.name} delay={n * 0.08}>
            <article className={`border border-[#2a1d1b]/10 bg-white ${units.length === 1 ? "lg:grid lg:grid-cols-[1.35fr_1fr]" : ""}`}>
              {u.images[0] && (
                <button type="button" onClick={() => setView({ photos: u.images, index: 0, name: u.name })} className="group relative block w-full overflow-hidden" aria-label={`View renders of ${u.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.images[0]} alt={u.name} className={`w-full object-cover transition duration-700 group-hover:scale-[1.02] ${units.length === 1 ? "h-full min-h-[360px]" : "aspect-[16/10]"}`} />
                  {u.images.length > 1 && <span className="absolute bottom-4 right-4 rounded-sm bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">{u.images.length} renders</span>}
                </button>
              )}
              <div className="flex flex-col p-7 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b4241c]">Unit type</p>
                <h3 className={`${serif} mt-2 text-3xl font-semibold tracking-tight text-[#2a1d1b] sm:text-4xl`}>{u.name}</h3>
                {u.specs && (
                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                    {(Object.keys(SPEC_LABELS) as (keyof typeof SPEC_LABELS)[]).map((k) => {
                      const v = u.specs?.[k]
                      if (!v) return null
                      const Icon = ICON[k]
                      return (
                        <div key={k} className="flex items-start gap-3">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#b4241c]" />
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8968f]">{SPEC_LABELS[k]}</dt>
                            <dd className="mt-0.5 text-lg font-semibold text-[#2a1d1b]">
                              {v}
                              <span className="text-sm font-medium text-[#6b5a56]">{UNIT[k]}</span>
                            </dd>
                          </div>
                        </div>
                      )
                    })}
                  </dl>
                )}
                {u.specs?.bedrooms?.includes("*") && <p className="mt-4 text-[11px] text-[#a8968f]">* As marked on Johndorf&apos;s page.</p>}
                <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#2a1d1b]/10 pt-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {sections.map((sec) => (
                    <a key={sec.href} href={sec.href} className="text-[#6b5a56] hover:text-[#b4241c]">{sec.label} ↓</a>
                  ))}
                </nav>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <Lightbox photos={view?.photos ?? []} index={view ? view.index : null} caption={view?.name} onClose={() => setView(null)} onIndex={(i) => setView((v) => (v ? { ...v, index: i } : v))} />
    </>
  )
}
