"use client"

import { useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

/** Full-screen viewer for a list of photos; arrows and keyboard move between them. */
export function Lightbox({ photos, index, caption, onClose, onIndex }: { photos: string[]; index: number | null; caption?: string; onClose: () => void; onIndex: (i: number) => void }) {
  const open = index !== null
  const prev = useCallback(() => index !== null && onIndex((index - 1 + photos.length) % photos.length), [index, photos.length, onIndex])
  const next = useCallback(() => index !== null && onIndex((index + 1) % photos.length), [index, photos.length, onIndex])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.documentElement.style.overflow = overflow
    }
  }, [open, onClose, prev, next])

  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal aria-label={caption ?? "Photo"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#160c0a]/95 p-4 sm:p-8" onClick={onClose}>
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-sm p-2.5 text-white/80 hover:bg-white/10 hover:text-white">
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); prev() }} aria-label="Previous photo" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-sm p-3 text-white/80 hover:bg-white/10 hover:text-white sm:left-6">
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); next() }} aria-label="Next photo" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-3 text-white/80 hover:bg-white/10 hover:text-white sm:right-6">
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          <motion.img
            key={photos[index]}
            src={photos[index]}
            alt={caption ?? ""}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-h-[88vh] max-w-full rounded-none object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-sm bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
            {caption ? `${caption} · ` : ""}{index + 1} / {photos.length}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
