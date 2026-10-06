"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Camera } from "lucide-react"
import { ease } from "../../johndorf/home/ui"
import type { JdUpdateMonth } from "@/lib/johndorf/site-projects"
import { Lightbox } from "./lightbox"

/** Construction progress month by month — Johndorf's own photos, newest first. */
export function Updates({ months }: { months: JdUpdateMonth[] }) {
  const ordered = [...months].reverse()
  const [key, setKey] = useState(ordered[0]?.key)
  const [i, setI] = useState<number | null>(null)
  const current = ordered.find((m) => m.key === key) ?? ordered[0]
  if (!current) return null

  return (
    <>
      <div className="mt-10 -mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          {ordered.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setKey(m.key)}
              className={`shrink-0 rounded-sm px-4 py-2 text-[12px] font-semibold tracking-wide transition ${m.key === current.key ? "bg-[#2a1d1b] text-white" : "border border-[#2a1d1b]/15 bg-white text-[#4b3b37] hover:border-[#b4241c] hover:text-[#b4241c]"}`}
            >
              {m.label}
              <span className={`ml-2 text-[10px] ${m.key === current.key ? "text-white/60" : "text-[#a8968f]"}`}>{m.photos.length}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease }} className="mt-8">
          <p className="mb-5 inline-flex items-center gap-2 text-sm text-[#6b5a56]">
            <Camera className="h-4 w-4 text-[#b4241c]" /> {current.photos.length} photo{current.photos.length === 1 ? "" : "s"} from {current.label}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {current.photos.map((p, n) => (
              <button key={p} type="button" onClick={() => setI(n)} className="group relative overflow-hidden rounded-none bg-[#ece5e2]" aria-label={`Photo ${n + 1}, ${current.label}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" loading="lazy" className="aspect-video w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <Lightbox photos={current.photos} index={i} caption={current.label} onClose={() => setI(null)} onIndex={setI} />
    </>
  )
}
