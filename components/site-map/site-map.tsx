"use client"

import { useMemo, useRef, useState } from "react"
import { Minus, Plus, Scan } from "lucide-react"
import { type Point, type SiteMapData, type SiteMapLot, STATUS_STYLE, centroid, countBy, lotName, shapes, svgPoints } from "./geometry"

const ZOOMS = [1, 1.5, 2, 3, 4]

/**
 * The plan image with a drawing layer over it, in plan fractions (0…1 both ways), zoomable. The
 * drawing stretches with the picture, so a shape drawn on it stays on its lot at every zoom.
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
}: {
  image: string
  alt: string
  /** A click on the plan, in fractions. */
  onPoint?: (p: Point) => void
  onMove?: (p: Point | null) => void
  layers?: React.ReactNode
  /** HTML on top (tooltips, pins), placed with left/top in percent. */
  labels?: React.ReactNode
  cursor?: string
  maxHeight?: string
}) {
  const [zoom, setZoom] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const at = (e: React.PointerEvent | React.MouseEvent): Point | null => {
    const r = svg.current?.getBoundingClientRect()
    if (!r) return null
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]
  }

  return (
    <div className="relative border border-[#e6e2db] bg-[#f6f4f0]">
      <div className="absolute right-3 top-3 z-20 flex border border-[#d9d4cb] bg-white shadow-sm">
        <button type="button" onClick={() => setZoom((z) => Math.max(0, z - 1))} disabled={zoom === 0} aria-label="Zoom out" className="p-2.5 text-[#17150f] hover:bg-[#f6f4f0] disabled:opacity-30">
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setZoom(0)} aria-label="Fit the whole plan" className="border-x border-[#e6e2db] px-2.5 text-xs font-bold tabular-nums text-[#3d3a34] hover:bg-[#f6f4f0]">
          {zoom === 0 ? <Scan className="h-4 w-4" /> : `${ZOOMS[zoom] * 100}%`}
        </button>
        <button type="button" onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} disabled={zoom === ZOOMS.length - 1} aria-label="Zoom in" className="p-2.5 text-[#17150f] hover:bg-[#f6f4f0] disabled:opacity-30">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        <div className="relative" style={{ width: `${ZOOMS[zoom] * 100}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={alt} draggable={false} className="block w-full select-none" />
          <svg
            ref={svg}
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full touch-manipulation"
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
export function LotTip({ lot, at }: { lot: SiteMapLot; at: Point }) {
  return (
    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap bg-[#17150f] px-3 py-2 text-xs text-white shadow-lg" style={{ left: `${at[0] * 100}%`, top: `${at[1] * 100}%` }}>
      <p className="font-bold">
        {lotName(lot)} · <span style={{ color: STATUS_STYLE[lot.status].fill }}>{STATUS_STYLE[lot.status].label}</span>
      </p>
      <p className="mt-0.5 text-[#d9d4cb]">{[lot.lot_area && `${Number(lot.lot_area)} sqm lot`, lot.model, lot.price && `₱${Number(lot.price).toLocaleString("en-PH")}`].filter(Boolean).join(" · ") || "No details yet"}</p>
    </div>
  )
}

/**
 * The read-only map: lots coloured by status, a tip on hover, and a click on the lots `canPick`
 * allows (every lot when it's left out). `highlight` marks one lot as "Your home".
 */
export function SiteMapViewer({
  map,
  alt,
  selectedId,
  onPick,
  canPick,
  maxHeight,
}: {
  map: SiteMapData
  alt: string
  selectedId?: number | null
  onPick?: (lot: SiteMapLot) => void
  canPick?: (lot: SiteMapLot) => boolean
  maxHeight?: string
}) {
  const all = useMemo(() => shapes(map), [map])
  const [hover, setHover] = useState<number | null>(null)
  const hovered = all.find((s) => s.lot.id === hover)
  const mine = map.highlight ? all.find((s) => s.lot.id === map.highlight) : undefined

  return (
    <div className="space-y-3">
      <StatusLegend lots={map.lots} />
      <SiteMapCanvas
        image={map.image}
        alt={alt}
        maxHeight={maxHeight}
        layers={all.map(({ lot, quad }) => {
          const pickable = onPick && (!canPick || canPick(lot))
          return <LotShape key={lot.id} quad={quad} lot={lot} selected={lot.id === selectedId || lot.id === map.highlight} dim={!!onPick && !!canPick && !canPick(lot)} onClick={pickable ? () => onPick(lot) : undefined} onHover={(on) => setHover(on ? lot.id : null)} />
        })}
        labels={
          <>
            {mine && (
              <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+6px)] bg-[#b4241c] px-2.5 py-1 text-xs font-bold text-white shadow" style={{ left: `${centroid(mine.quad)[0] * 100}%`, top: `${Math.min(...mine.quad.map((p) => p[1])) * 100}%` }}>
                Your home
              </div>
            )}
            {hovered && <LotTip lot={hovered.lot} at={[centroid(hovered.quad)[0], Math.min(...hovered.quad.map((p) => p[1]))]} />}
          </>
        }
      />
    </div>
  )
}
