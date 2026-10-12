/**
 * The clickable site plan's data and its shapes. A row is four corners on the plan image (fractions
 * of its width and height), clockwise from the outer corner of the first lot; its lots are cut along
 * corner 1 → corner 2, each as wide as its lot area allows (equal when the areas aren't all known).
 */

export type Point = [number, number]

export type SiteMapRow = { id: number; block: string; corners: Point[]; first_lot: number; lot_count: number }

export type LotStatus = "available" | "reserved" | "sold"

export type SiteMapLot = {
  id: number
  row_id: number
  index: number
  block: string
  lot: string
  status: LotStatus
  model: string | null
  lot_area: string | null
  floor_area: string | null
  /** Null on the website and the buyer's page. */
  price: string | null
  tags: string[]
}

export type SiteMapData = { image: string; rows: SiteMapRow[]; lots: SiteMapLot[]; highlight?: number }

export const LOT_TAGS: Record<string, string> = { corner: "Corner lot", park: "Near the park", end: "End unit" }

export const STATUS_STYLE: Record<LotStatus, { fill: string; label: string; text: string }> = {
  available: { fill: "#10b981", label: "Available", text: "text-emerald-700" },
  reserved: { fill: "#f59e0b", label: "Reserved", text: "text-amber-700" },
  sold: { fill: "#dc2626", label: "Sold", text: "text-red-700" },
}

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/** Where each lot of a row starts and ends along the row (0…1), by lot area when every lot has one. */
export function cuts(count: number, areas?: (number | null)[]): number[] {
  const known = areas && areas.length === count && areas.every((a) => a !== null && a > 0)
  const weights = known ? (areas as number[]) : Array.from({ length: count }, () => 1)
  const total = weights.reduce((s, w) => s + w, 0)
  const out = [0]
  let run = 0
  for (const w of weights) out.push((run += w) / total)
  return out
}

/** The four corners of every lot in a row, in row order. */
export function lotQuads(corners: Point[], count: number, areas?: (number | null)[]): Point[][] {
  if (corners.length !== 4 || count < 1) return []
  const [p1, p2, p3, p4] = corners
  const t = cuts(count, areas)
  return Array.from({ length: count }, (_, i) => [lerp(p1, p2, t[i]), lerp(p1, p2, t[i + 1]), lerp(p4, p3, t[i + 1]), lerp(p4, p3, t[i])])
}

export const centroid = (pts: Point[]): Point => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]

export const svgPoints = (pts: Point[]) => pts.map((p) => `${p[0]},${p[1]}`).join(" ")

/** Every drawn lot with its shape: a row's lots by their place in it. */
export function shapes(map: SiteMapData): { lot: SiteMapLot; quad: Point[] }[] {
  const out: { lot: SiteMapLot; quad: Point[] }[] = []
  for (const row of map.rows) {
    const lots = map.lots.filter((l) => l.row_id === row.id)
    const byIndex = new Map(lots.map((l) => [l.index, l]))
    const areas = Array.from({ length: row.lot_count }, (_, i) => {
      const a = byIndex.get(i)?.lot_area
      return a ? Number(a) : null
    })
    lotQuads(row.corners, row.lot_count, areas).forEach((quad, i) => {
      const lot = byIndex.get(i)
      if (lot) out.push({ lot, quad })
    })
  }
  return out
}

export const lotName = (l: Pick<SiteMapLot, "block" | "lot">) => `Block ${l.block} · Lot ${l.lot}`

export const countBy = (lots: SiteMapLot[]) => ({
  available: lots.filter((l) => l.status === "available").length,
  reserved: lots.filter((l) => l.status === "reserved").length,
  sold: lots.filter((l) => l.status === "sold").length,
})
