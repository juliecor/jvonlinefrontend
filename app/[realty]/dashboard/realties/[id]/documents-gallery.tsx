"use client"

import { useState } from "react"
import { ExternalLink, FileText, Maximize2 } from "lucide-react"
import { fileSize } from "@/lib/requirements-types"
import { Lightbox } from "@/app/projects/[slug]/lightbox"

type Doc = { id: number; label: string; original_name: string; mime: string; size: number }

/**
 * The files attached to an accreditation form, already showing: a picture opens full screen (arrows move
 * between the pictures), a PDF is read right in its card, anything a browser can't draw (HEIC) falls back
 * to a file card. "Open" always opens the original in a new tab.
 */
export function DocumentsGallery({ base, docs }: { base: string; docs: Doc[] }) {
  const url = (d: Doc) => `${base}/${d.id}`
  // A picture the browser can't draw (HEIC on Chrome) drops out of the lightbox and shows as a file card.
  const [broken, setBroken] = useState<Set<number>>(new Set())
  const [open, setOpen] = useState<number | null>(null)

  const isImage = (d: Doc) => d.mime.startsWith("image/") && !broken.has(d.id)
  const images = docs.filter(isImage)

  return (
    <>
      <ul className="grid gap-5 pt-5 sm:grid-cols-2">
        {docs.map((d) => (
          <li key={d.id} className="flex flex-col border border-[#e6e2db] bg-white">
            <p className="px-4 pt-4 text-[15px] leading-relaxed text-[#17150f]">{d.label}</p>

            <div className="mt-3 flex-1 border-y border-[#e6e2db] bg-[#f6f4f0]">
              {isImage(d) ? (
                <button type="button" onClick={() => setOpen(images.findIndex((x) => x.id === d.id))} aria-label={`View ${d.original_name} full screen`} className="group relative block w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url(d)} alt={d.label} loading="lazy" onError={() => setBroken((b) => new Set(b).add(d.id))} className="h-64 w-full object-contain" />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 bg-[#17150f]/80 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Maximize2 className="h-3.5 w-3.5" /> View
                  </span>
                </button>
              ) : d.mime === "application/pdf" ? (
                <iframe src={`${url(d)}#toolbar=0&navpanes=0&view=FitH`} title={d.original_name} loading="lazy" className="h-64 w-full border-0 bg-white" />
              ) : (
                <a href={url(d)} target="_blank" rel="noreferrer" className="flex h-64 flex-col items-center justify-center gap-2 text-[#8a847a] hover:text-[var(--accent)]">
                  <FileText className="h-10 w-10" />
                  <span className="text-sm font-semibold">Can&apos;t be previewed here. Open it.</span>
                </a>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[#17150f]">{d.original_name}</span>
                <span className="block text-xs text-[#8a847a]">{fileSize(d.size)}</span>
              </span>
              <a href={url(d)} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold text-[#17150f] hover:border-[#17150f]">
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </li>
        ))}
      </ul>
      <Lightbox photos={images.map(url)} index={open} caption={open !== null ? images[open]?.original_name : undefined} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  )
}
