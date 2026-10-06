"use client"

import { useState } from "react"
import { Maximize2 } from "lucide-react"
import { Reveal } from "../../johndorf/home/ui"
import { Lightbox } from "./lightbox"

/** The site development plan, large, with a full-screen view. */
export function SitePlan({ plans, name }: { plans: string[]; name: string }) {
  const [i, setI] = useState<number | null>(null)
  return (
    <>
      <div className="mt-12 grid gap-6">
        {plans.map((p, n) => (
          <Reveal key={p} delay={n * 0.1}>
            <button type="button" onClick={() => setI(n)} className="group relative block w-full overflow-hidden rounded-[28px] border border-[#2a1d1b]/10 bg-white shadow-[0_40px_90px_-50px_rgba(40,10,5,0.6)]" aria-label="View the site plan full screen">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`${name} site development plan`} className="w-full" />
              <span className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-[#2a1d1b]/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white opacity-90 transition group-hover:bg-[#b4241c]">
                <Maximize2 className="h-3.5 w-3.5" /> Full screen
              </span>
            </button>
          </Reveal>
        ))}
      </div>
      <Lightbox photos={plans} index={i} caption="Site development plan" onClose={() => setI(null)} onIndex={setI} />
    </>
  )
}
