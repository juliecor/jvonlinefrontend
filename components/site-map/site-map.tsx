"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Maximize2, Minimize2, Minus, Plus, Scan, X } from "lucide-react"
import { php } from "@/lib/format"
import { LOT_TAGS, type Point, type SiteMapData, type SiteMapLot, STATUS_STYLE, centroid, countBy, lotName, shapes, svgPoints } from "./geometry"

const MIN_ZOOM = 1
const MAX_ZOOM = 8

/** The plan's width ÷ height once its picture loads (1 until then), so a bent row's lots are cut by their real length. */
export function useAspect(src: string) {
  const [got, setGot] = useState<{ src: string; aspect: number } | null>(null)
  useEffect(() => {
    const img = new Image()
    img.onload = () => img.naturalHeight && setGot({ src, aspect: img.naturalWidth / img.naturalHeight })
    img.src = src
  }, [src])
  return got?.src === src ? got.aspect : 1
}

/** Lots smaller than this on screen (px) are too small to tap: a tap zooms in on them first. */
const TAP_MIN = 18

/**
 * The plan image with a drawing layer over it, in plan fractions (0…1 both ways). Zoom with the
 * buttons, or with a pinch / Ctrl+scroll (plain scroll too in full screen) at the pointer; drag to
 * move around once zoomed in. A click that didn't drag is a click on the plan. Full screen fills the
 * window, with `side` (the editor's panel) beside the plan; on a phone held upright the plan fills
 * its height. On a touch screen, two fingers zoom the plan (not the page), and with `tapZoom` a tap
 * on the small plan opens full screen, and a tap on a lot still too small to hit zooms in there.
 */
export function SiteMapCanvas({
  image,
  alt,
  onPoint,
  onMove,
  layers,
  labels,
  cursor,
  maxHeight = "75vh",
  side,
  fullscreen: controlled,
  onFullscreen,
  tapZoom = true,
}: {
  image: string
  alt: string
  /** A click on the plan, in fractions. */
  onPoint?: (p: Point) => void
  onMove?: (p: Point | null) => void
  layers?: React.ReactNode
  /** HTML on top (tooltips, pins, handles), placed with left/top in percent. */
  labels?: React.ReactNode
  cursor?: string
  maxHeight?: string
  /** Shown beside the plan in full screen. */
  side?: React.ReactNode
  fullscreen?: boolean
  onFullscreen?: (on: boolean) => void
  /** Touch: taps open full screen and zoom in on lots too small to hit (off while drawing). */
  tapZoom?: boolean
}) {
  const [zoom, setZoom] = useState(1)
  const [own, setOwn] = useState(false)
  const full = controlled ?? own
  const setFull = (on: boolean) => (onFullscreen ? onFullscreen(on) : setOwn(on))
  // Going in or out of full screen starts from the whole plan again.
  const [wasFull, setWasFull] = useState(full)
  if (wasFull !== full) {
    setWasFull(full)
    setZoom(1)
  }
  const aspect = useAspect(image)
  const scroller = useRef<HTMLDivElement>(null)
  const pointer = useRef("mouse")
  const pinch = useRef<{ spread: number; zoom: number } | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  // Where to keep still while zooming: a point of the plan (fractions) under a spot of the view (px).
  const anchor = useRef<{ fx: number; fy: number; vx: number; vy: number } | null>(null)
  const pan = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null)
  const panned = useRef(false)

  const at = (e: { clientX: number; clientY: number }): Point | null => {
    const r = svg.current?.getBoundingClientRect()
    if (!r) return null
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]
  }

  /** Zoom to `next`, keeping the plan point under (vx, vy) of the view where it is (the middle when not given). */
  const zoomTo = (next: number, vx?: number, vy?: number) => {
    const el = scroller.current
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
    if (!el || z === zoom) return
    const x = vx ?? el.clientWidth / 2
    const y = vy ?? el.clientHeight / 2
    anchor.current = { fx: (el.scrollLeft + x) / el.scrollWidth, fy: (el.scrollTop + y) / el.scrollHeight, vx: x, vy: y }
    setZoom(z)
  }

  useLayoutEffect(() => {
    const el = scroller.current
    const a = anchor.current
    if (!el || !a) return
    el.scrollLeft = a.fx * el.scrollWidth - a.vx
    el.scrollTop = a.fy * el.scrollHeight - a.vy
    anchor.current = null
  }, [zoom, full])

  // Pinch (Ctrl+wheel on a trackpad) or Ctrl+scroll zooms at the pointer; in full screen plain scroll does too.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && !full) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomTo(zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), e.clientX - r.left, e.clientY - r.top)
    }
    // Two fingers zoom the plan where they are; one finger keeps scrolling as usual.
    const spread = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      e.preventDefault()
      pinch.current = { spread: spread(e.touches), zoom }
    }
    const onTouchMove = (e: TouchEvent) => {
      const p = pinch.current
      if (!p || e.touches.length !== 2) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomTo((p.zoom * spread(e.touches)) / p.spread, (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top)
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch.current = null
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("touchstart", onTouchStart, { passive: false })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd)
    el.addEventListener("touchcancel", onTouchEnd)
    return () => {
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("touchcancel", onTouchEnd)
    }
  })

  // A plan wider than the screen (a phone held upright) opens on its middle.
  useLayoutEffect(() => {
    const el = scroller.current
    if (full && el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [full, aspect])

  // Full screen: no page scroll behind it. Esc leaves it, unless the parent controls full screen (and Esc) itself.
  useEffect(() => {
    if (!full) return
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !onFullscreen) setOwn(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.documentElement.style.overflow = overflow
      window.removeEventListener("keydown", onKey)
    }
  }, [full, onFullscreen])

  const zoomBar = (
    <div className="absolute right-3 top-3 z-20 flex border border-[#d9d4cb] bg-white shadow-sm">
      <button type="button" onClick={() => zoomTo(zoom / 1.5)} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out" className="p-2.5 text-[#17150f] hover:bg-[#f6f4f0] disabled:opacity-30">
        <Minus className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => setZoom(1)} aria-label="Fit the whole plan" className="min-w-[3.25rem] border-x border-[#e6e2db] px-2.5 text-xs font-bold tabular-nums text-[#3d3a34] hover:bg-[#f6f4f0]">
        {zoom <= 1.01 ? <Scan className="mx-auto h-4 w-4" /> : `${Math.round(zoom * 100)}%`}
      </button>
      <button type="button" onClick={() => zoomTo(zoom * 1.5)} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in" className="p-2.5 text-[#17150f] hover:bg-[#f6f4f0] disabled:opacity-30">
        <Plus className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => setFull(!full)} aria-label={full ? "Leave full screen" : "Full screen"} title={full ? "Leave full screen" : "Full screen"} className="border-l border-[#e6e2db] p-2.5 text-[#17150f] hover:bg-[#f6f4f0]">
        {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  )

  const plan = (
    <div className={`relative border border-[#e6e2db] bg-[#f6f4f0] ${full ? "flex min-h-0 min-w-0 flex-1 flex-col" : ""}`}>
      {zoomBar}
      <div
        ref={scroller}
        className={`touch-pan-x touch-pan-y overflow-auto ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""} ${full ? "min-h-0 flex-1" : ""}`}
        style={full ? undefined : { maxHeight }}
        onPointerDown={(e) => {
          pointer.current = e.pointerType
          // Fingers scroll the plan natively; the mouse drags it.
          if (e.pointerType === "touch" || e.button !== 0 || zoom <= 1 || (e.target as HTMLElement).closest("[data-handle]")) return
          pan.current = { x: e.clientX, y: e.clientY, left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop, moved: false }
          panned.current = false
        }}
        onPointerMove={(e) => {
          const p = pan.current
          if (!p) return
          const dx = e.clientX - p.x
          const dy = e.clientY - p.y
          if (!p.moved && Math.hypot(dx, dy) < 5) return
          p.moved = true
          e.currentTarget.scrollLeft = p.left - dx
          e.currentTarget.scrollTop = p.top - dy
        }}
        onPointerUp={() => {
          panned.current = !!pan.current?.moved
          pan.current = null
        }}
        onPointerLeave={() => (pan.current = null)}
        // A drag that moved the plan is not a click on it.
        onClickCapture={(e) => {
          if (panned.current) {
            e.stopPropagation()
            e.preventDefault()
            panned.current = false
            return
          }
          if (!tapZoom || pointer.current !== "touch") return
          // A finger can't hit a lot a few pixels wide: open the plan big, then zoom in where it tapped.
          const lot = (e.target as Element).closest("[data-lot]")
          const box = lot?.getBoundingClientRect()
          const tooSmall = !box || Math.min(box.width, box.height) < TAP_MIN
          if (!tooSmall || (full && !lot)) return
          e.stopPropagation()
          e.preventDefault()
          if (!full) return setFull(true)
          const r = e.currentTarget.getBoundingClientRect()
          zoomTo(zoom * 2.5, e.clientX - r.left, e.clientY - r.top)
        }}
      >
        <div
          className={`relative [--base:100%] ${full ? "portrait:[--base:max(100%,calc((100dvh_-_4rem)*var(--aspect)))]" : ""}`}
          style={{ width: `calc(var(--base) * ${zoom})`, ["--aspect" as string]: aspect }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={alt} draggable={false} className="block w-full select-none" />
          <svg
            ref={svg}
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            style={{ cursor }}
            onClick={(e) => {
              const p = at(e)
              if (p && onPoint) onPoint(p)
            }}
            onPointerMove={onMove ? (e) => onMove(at(e)) : undefined}
            onPointerLeave={onMove ? () => onMove(null) : undefined}
          >
            {layers}
          </svg>
          {labels}
        </div>
      </div>
      {!full && tapZoom && (
        <span className="pointer-events-none absolute bottom-12 left-1/2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap bg-[#17150f]/85 px-4 py-2.5 text-sm font-bold text-white shadow-lg pointer-coarse:flex">
          <Maximize2 className="h-4 w-4" /> Tap to explore the map
        </span>
      )}
      <p className="border-t border-[#e6e2db] bg-white px-3 py-1.5 text-xs text-[#8a847a]">
        <span className="pointer-coarse:hidden">{full ? "Scroll or pinch to zoom where you point. Drag to move around." : "Pinch or Ctrl + scroll to zoom where you point. Drag to move around."}</span>
        <span className="hidden pointer-coarse:inline">{full ? "Pinch to zoom, swipe to move around. Tap a lot to see it." : "Tap the map to open it big."}</span>
      </p>
    </div>
  )

  if (!full) return plan
  return (
    <div className="fixed inset-0 z-[90] flex flex-col gap-3 bg-white p-3 sm:flex-row sm:p-4">
      {plan}
      {side && <div className="max-h-[45vh] shrink-0 overflow-y-auto border border-[#e6e2db] bg-white p-5 sm:max-h-none sm:w-[360px]">{side}</div>}
      {!side && (
        <button type="button" onClick={() => setFull(false)} aria-label="Close" className="absolute left-5 top-5 z-30 bg-white p-2 shadow">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

/** One lot's shape, coloured by status. */
export function LotShape({ quad, lot, selected, dim, onClick, onHover }: { quad: Point[]; lot: SiteMapLot; selected?: boolean; dim?: boolean; onClick?: () => void; onHover?: (on: boolean) => void }) {
  return (
    <polygon
      points={svgPoints(quad)}
      fill={STATUS_STYLE[lot.status].fill}
      fillOpacity={dim ? 0.15 : selected ? 0.75 : 0.45}
      stroke={selected ? "#17150f" : "#ffffff"}
      strokeWidth={selected ? 2.5 : 0.8}
      vectorEffect="non-scaling-stroke"
      style={{ cursor: onClick ? "pointer" : "default" }}
      data-lot={onClick ? "" : undefined}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation()
              onClick()
            }
          : undefined
      }
      onPointerEnter={onHover ? () => onHover(true) : undefined}
      onPointerLeave={onHover ? () => onHover(false) : undefined}
    >
      <title>{`${lotName(lot)} · ${STATUS_STYLE[lot.status].label}`}</title>
    </polygon>
  )
}

/** Available · Reserved · Sold, with counts. */
export function StatusLegend({ lots }: { lots: SiteMapLot[] }) {
  const c = countBy(lots)
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      {(["available", "reserved", "sold"] as const).map((s) => (
        <span key={s} className="inline-flex items-center gap-2 font-semibold text-[#3d3a34]">
          <span className="h-3.5 w-3.5 border border-white" style={{ background: STATUS_STYLE[s].fill, opacity: 0.8 }} />
          {STATUS_STYLE[s].label} <span className="font-bold tabular-nums text-[#17150f]">{c[s]}</span>
        </span>
      ))}
    </div>
  )
}

/** What hovering a lot says: its name, status, areas and model (and price where known). */
/** The tip over a hovered lot, with a picture of its house when there is one; under the lot when it is near the top of the plan. */
export function LotTip({ lot, quad, photo }: { lot: SiteMapLot; quad: Point[]; photo?: string | null }) {
  const top = Math.min(...quad.map((p) => p[1]))
  const below = !!photo && top < 0.35
  const y = below ? Math.max(...quad.map((p) => p[1])) : top
  return (
    <div
      className={`pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap bg-[#17150f] px-3 py-2 text-xs text-white shadow-lg ${below ? "translate-y-[10px]" : "-translate-y-[calc(100%+10px)]"}`}
      style={{ left: `${centroid(quad)[0] * 100}%`, top: `${y * 100}%` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo && <img src={photo} alt="" className="-mx-1 mb-2 mt-1 aspect-[4/3] w-48 max-w-none bg-[#2a2722] object-cover" />}
      <p className="font-bold">
        {lotName(lot)} · <span style={{ color: STATUS_STYLE[lot.status].fill }}>{STATUS_STYLE[lot.status].label}</span>
      </p>
      <p className="mt-0.5 text-[#d9d4cb]">{[lot.lot_area && `${Number(lot.lot_area)} sqm lot`, lot.model, lot.price && `₱${Number(lot.price).toLocaleString("en-PH")}`].filter(Boolean).join(" · ") || "No details yet"}</p>
    </div>
  )
}

/** A lot's photos: its own first, else the pictures it is given (its house model's). Click a thumbnail to show it big. */
export function LotPhotos({ photos, fallback = [], name }: { photos: string[]; fallback?: string[]; name: string }) {
  const list = photos.length ? photos : fallback
  const [i, setI] = useState(0)
  if (!list.length) return null
  const shown = list[Math.min(i, list.length - 1)]
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shown} alt={name} className="aspect-[4/3] w-full border border-[#e6e2db] bg-[#f6f4f0] object-cover" />
      {list.length > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto">
          {list.map((src, n) => (
            <button key={src} type="button" onClick={() => setI(n)} aria-label={`Photo ${n + 1}`} className={`shrink-0 border-2 ${n === i ? "border-[var(--accent,#b4241c)]" : "border-transparent"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-12 w-16 object-cover" />
            </button>
          ))}
        </div>
      )}
      {!photos.length && <p className="mt-1 text-xs text-[#8a847a]">Photos of the house model.</p>}
    </div>
  )
}

/** A lot's name, status, model, areas, price (where shown), tags and photos. */
export function LotDetails({ lot, modelPhotos = [], noPrice = "Ask an agent", onClose, children }: { lot: SiteMapLot; modelPhotos?: string[]; noPrice?: string; onClose?: () => void; children?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: STATUS_STYLE[lot.status].fill }}>
            {STATUS_STYLE[lot.status].label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{lotName(lot)}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 p-2 text-[#6b665d] hover:text-[#17150f]">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <LotPhotos photos={lot.photos} fallback={modelPhotos} name={lotName(lot)} />
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[15px]">
        {[
          ["House model", lot.model ?? "—"],
          ...(lot.price !== null || lot.status === "available" ? [["Price", lot.price ? php(lot.price) : noPrice]] : []),
          ["Lot area", lot.lot_area ? `${Number(lot.lot_area)} sqm` : "—"],
          ["Floor area", lot.floor_area ? `${Number(lot.floor_area)} sqm` : "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[#8a847a]">{k}</dt>
            <dd className="mt-0.5 font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      {lot.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {lot.tags.map((t) => (
            <span key={t} className="border border-[#d9d4cb] px-2 py-1 text-xs font-bold text-[#3d3a34]">
              {LOT_TAGS[t] ?? t}
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * The read-only map: lots coloured by status, a tip on hover, and a click on the lots `canPick`
 * allows (every lot when it's left out). `highlight` marks one lot as "Your home". With `details`,
 * a click opens the lot's card (photos and details) beside the map instead.
 */
export function SiteMapViewer({
  map,
  alt,
  selectedId,
  onPick,
  canPick,
  maxHeight,
  details,
  modelPhotos,
}: {
  map: SiteMapData
  alt: string
  selectedId?: number | null
  onPick?: (lot: SiteMapLot) => void
  canPick?: (lot: SiteMapLot) => boolean
  maxHeight?: string
  details?: boolean
  /** A house model's pictures by name, for lots without photos of their own. */
  modelPhotos?: Record<string, string[]>
}) {
  const aspect = useAspect(map.image)
  const all = useMemo(() => shapes(map, aspect), [map, aspect])
  const [hover, setHover] = useState<number | null>(null)
  const [open, setOpen] = useState<number | null>(details && map.highlight ? map.highlight : null)
  const hovered = all.find((s) => s.lot.id === hover)
  const mine = map.highlight ? all.find((s) => s.lot.id === map.highlight) : undefined
  const opened = open ? map.lots.find((l) => l.id === open) : undefined
  // Picking a lot in full screen takes the picker back to the form it is for.
  const [full, setFull] = useState(false)
  useEffect(() => {
    if (!full) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [full])
  const click = (lot: SiteMapLot) => {
    if (details) return setOpen(lot.id)
    onPick?.(lot)
    setFull(false)
  }
  const card = opened && (
    <LotDetails key={opened.id} lot={opened} modelPhotos={(opened.model && modelPhotos?.[opened.model]) || []} onClose={() => setOpen(null)}>
      {opened.id === map.highlight && <p className="text-sm font-semibold text-[#b4241c]">This is your home.</p>}
    </LotDetails>
  )

  return (
    <div className="space-y-3">
      <StatusLegend lots={map.lots} />
      <div className={details && opened ? "grid gap-4 lg:grid-cols-[1fr_320px]" : ""}>
        <div className="min-w-0">
          <SiteMapCanvas
            image={map.image}
            alt={alt}
            maxHeight={maxHeight}
            fullscreen={full}
            onFullscreen={setFull}
            side={card || undefined}
            layers={all.map(({ lot, quad }) => {
              const pickable = details || (onPick && (!canPick || canPick(lot)))
              return <LotShape key={lot.id} quad={quad} lot={lot} selected={lot.id === selectedId || lot.id === map.highlight || lot.id === open} dim={!details && !!onPick && !!canPick && !canPick(lot)} onClick={pickable ? () => click(lot) : undefined} onHover={(on) => setHover(on ? lot.id : null)} />
            })}
            labels={
              <>
                {mine && (
                  <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+6px)] bg-[#b4241c] px-2.5 py-1 text-xs font-bold text-white shadow" style={{ left: `${centroid(mine.quad)[0] * 100}%`, top: `${Math.min(...mine.quad.map((p) => p[1])) * 100}%` }}>
                    Your home
                  </div>
                )}
                {hovered && <LotTip lot={hovered.lot} quad={hovered.quad} photo={hovered.lot.photos[0] ?? (hovered.lot.model && modelPhotos?.[hovered.lot.model]?.[0])} />}
              </>
            }
          />
        </div>
        {details && opened && <aside className="border border-[#e6e2db] bg-white p-4 lg:self-start">{card}</aside>}
      </div>
    </div>
  )
}
