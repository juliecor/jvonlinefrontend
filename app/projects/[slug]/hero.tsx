"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowDown, ArrowLeft, MapPin } from "lucide-react"
import { ease, serif } from "../../johndorf/home/ui"

/** Full-screen opening: the project's own renders crossfading, its name set large. */
export function ProjectHero({ name, place, status, photos, interactive }: { name: string; place: string; status?: string; photos: string[]; interactive?: boolean }) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (photos.length < 2 || reduce) return
    const t = setInterval(() => setI((n) => (n + 1) % photos.length), 6000)
    return () => clearInterval(t)
  }, [photos.length, reduce])

  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-[#160c0a] text-white">
      <AnimatePresence initial={false}>
        <motion.div key={photos[i] ?? "none"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }} className="absolute inset-0">
          {photos[i] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[i]} alt="" className={`h-full w-full object-cover ${reduce ? "" : "jd-kenburns"}`} />
          )}
        </motion.div>
      </AnimatePresence>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#160c0a] via-[#160c0a]/45 to-[#160c0a]/25" />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-14 pt-32 sm:px-8 sm:pb-20">
        <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <Link href="/projects" className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> All projects
          </Link>
        </motion.div>
        <motion.h1 initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1, ease }} className={`${serif} mt-6 text-[clamp(3rem,10vw,8.5rem)] font-semibold leading-[0.92] tracking-tight`}>
          {name}
        </motion.h1>
        <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease }} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="inline-flex items-center gap-2 text-base text-white/85 sm:text-lg"><MapPin className="h-4 w-4 text-[#f0b6b1]" /> {place}</p>
          {status && <span className="rounded-full border border-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">{status}</span>}
          {interactive && (
            <Link href="/johndorf/montierra" className="rounded-full bg-[#b4241c] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#941414]">
              Open the interactive site plan
            </Link>
          )}
        </motion.div>
        <div className="mt-10 flex items-center justify-between">
          <a href="#homes" className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 hover:text-white">
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" /> See the homes
          </a>
          {photos.length > 1 && (
            <div className="flex gap-1.5">
              {photos.map((_, n) => (
                <button key={n} type="button" aria-label={`Photo ${n + 1}`} onClick={() => setI(n)} className={`h-1 rounded-full transition-all ${n === i ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70"}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
