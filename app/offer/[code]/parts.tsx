"use client"

import { useState } from "react"
import { Maximize2, Printer } from "lucide-react"
import { Lightbox } from "../../projects/[slug]/lightbox"

/** The browser's print dialog doubles as "Save as PDF". */
export function PrintButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} aria-label="Save as PDF" className={`inline-flex items-center gap-2 text-sm font-bold transition ${className}`}>
      <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Save as PDF</span>
    </button>
  )
}

/** An image that opens full screen (renders, site plan). Extra images show as thumbnails. */
export function Zoomable({ images, alt, className = "", imgClassName = "", caption }: { images: string[]; alt: string; className?: string; imgClassName?: string; caption?: string }) {
  const [i, setI] = useState<number | null>(null)
  if (images.length === 0) return null
  return (
    <div className={className}>
      <button type="button" onClick={() => setI(0)} className="group relative block w-full overflow-hidden bg-[#f1efeb]" aria-label={`View ${alt} full screen`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt={alt} className={`w-full object-cover transition duration-700 group-hover:scale-[1.02] ${imgClassName}`} />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-[#17150f]/80 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white opacity-90 print:hidden">
          <Maximize2 className="h-3.5 w-3.5" /> View
        </span>
      </button>
      {images.length > 1 && (
        <div className="mt-2 grid grid-cols-5 gap-2 print:hidden">
          {images.slice(1, 6).map((src, n) => (
            <button key={src} type="button" onClick={() => setI(n + 1)} className="overflow-hidden bg-[#f1efeb]" aria-label={`View image ${n + 2}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <Lightbox photos={images} index={i} caption={caption ?? alt} onClose={() => setI(null)} onIndex={setI} />
    </div>
  )
}
