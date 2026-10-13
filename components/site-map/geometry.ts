/**
 * The clickable site plan's data and its shapes. A row is its outline on the plan image (fractions of
 * its width and height), clockwise from the outer corner of the first lot: the road side first (two
 * points, or more where the row bends), then the back side, with as many points, returning. Its lots
 * are cut along both sides by length, each as wide as its lot area allows (equal when the areas aren't
 * all known). A straight row is four corners.
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
  /** The lot's own photos (the actual house or lot). */
  photos: string[]
}

export type SiteMapData = { image: string; rows: SiteMapRow[]; lots: SiteMapLot[]; highlight?: number }

export const LOT_TAGS: Record<string, string> = { corner: "Corner lot", park: "Near the park", end: "End unit" }

export const STATUS_STYLE: Record<LotStatus, { fill: string; label: string; text: string }> = {
  available: { fill: "#10b981", label: "Available", text: "text-emerald-700" },
  reserved: { fill: "#f59e0b", label: "Reserved", text: "text-amber-700" },
  sold: { fill: "#dc2626", label: "Sold", text: "text-red-700" },
}

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/** The most points a row's outline can have (Laravel checks the same). */
export const MAX_CORNERS = 40

/** A row's road side (from lot 1) and back side (also from lot 1), from its outline. */
export function sides(corners: Point[]): { front: Point[]; back: Point[] } {
  const n = Math.floor(corners.length / 2)
  return { front: corners.slice(0, n), back: corners.slice(n, 2 * n).reverse() }
}

/** Clicks made in pairs (road side, then straight across, from lot 1 on) as the row's outline. */
export function outline(pairs: Point[]): Point[] {
  const n = Math.floor(pairs.length / 2)
  const front = Array.from({ length: n }, (_, i) => pairs[2 * i])
  const back = Array.from({ length: n }, (_, i) => pairs[2 * i + 1])
  return [...front, ...back.reverse()]
}

/** Where along a line of points each point is (0…1), measured on the picture (`aspect` = its width ÷ height). */
function along(line: Point[], aspect: number): number[] {
  const out = [0]
  for (let i = 1; i < line.length; i++) out.push(out[i - 1] + Math.hypot((line[i][0] - line[i - 1][0]) * aspect, line[i][1] - line[i - 1][1]))
  const total = out[out.length - 1]
  return total > 0 ? out.map((d) => d / total) : out.map((_, i) => i / Math.max(1, line.length - 1))
}

/** The part of a line from `a` to `b` (0…1): its two ends plus any bend in between. */
function piece(line: Point[], at: number[], a: number, b: number): Point[] {
  const point = (t: number): Point => {
    let i = 1
    while (i < line.length - 1 && at[i] < t) i++
    const span = at[i] - at[i - 1]
    return lerp(line[i - 1], line[i], span > 0 ? (t - at[i - 1]) / span : 0)
  }
  const bends = line.filter((_, i) => i > 0 && i < line.length - 1 && at[i] > a + 1e-9 && at[i] < b - 1e-9)
  return [point(a), ...bends, point(b)]
}
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

/** The outline of every lot in a row, in row order: four corners, more where the row bends. */
export function lotQuads(corners: Point[], count: number, areas?: (number | null)[], aspect = 1): Point[][] {
  if (corners.length < 4 || count < 1) return []
  const { front, back } = sides(corners)
  const atFront = along(front, aspect)
  const atBack = along(back, aspect)
  const t = cuts(count, areas)
  return Array.from({ length: count }, (_, i) => [...piece(front, atFront, t[i], t[i + 1]), ...piece(back, atBack, t[i], t[i + 1]).reverse()])
}

export const centroid = (pts: Point[]): Point => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]

/** The box around a shape: [left, top, right, bottom] in plan fractions. */
export const bounds = (pts: Point[]): [number, number, number, number] => [
  Math.min(...pts.map((p) => p[0])),
  Math.min(...pts.map((p) => p[1])),
  Math.max(...pts.map((p) => p[0])),
  Math.max(...pts.map((p) => p[1])),
]

export const svgPoints = (pts: Point[]) => pts.map((p) => `${p[0]},${p[1]}`).join(" ")

/** Every drawn lot with its shape: a row's lots by their place in it. `aspect` is the plan's width ÷ height. */
export function shapes(map: SiteMapData, aspect = 1): { lot: SiteMapLot; quad: Point[] }[] {
  const out: { lot: SiteMapLot; quad: Point[] }[] = []
  for (const row of map.rows) {
    const lots = map.lots.filter((l) => l.row_id === row.id)
    const byIndex = new Map(lots.map((l) => [l.index, l]))
    const areas = Array.from({ length: row.lot_count }, (_, i) => {
      const a = byIndex.get(i)?.lot_area
      return a ? Number(a) : null
    })
    lotQuads(row.corners, row.lot_count, areas, aspect).forEach((quad, i) => {
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
