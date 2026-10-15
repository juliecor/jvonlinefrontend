"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Camera, Check, ImagePlus, LoaderCircle, MousePointerClick, Move, PencilRuler, Plus, Trash2, X } from "lucide-react"
import { confirmAction, toast } from "@/components/feedback"
import { LOT_TAGS, MAX_CORNERS, type Point, type SiteMapData, type SiteMapLot, type SiteMapRow, STATUS_STYLE, lotName, lotQuads, outline, shapes, svgPoints } from "@/components/site-map/geometry"
import { LotDetails, LotHolder, LotShape, LotTip, SiteMapCanvas, StatusLegend, photosFor, tipPhoto, useAspect } from "@/components/site-map/site-map"
import type { PublicUnitType } from "@/lib/public-projects-types"
import { type LotInput, type RowInput, addSiteRow, applyToSiteRow, moveSiteRow, removeLotPhoto, removeSiteRow, saveLot, setSiteMapImage, uploadLotPhotos, uploadRowPhotos } from "./site-map-actions"

type Props = {
  slug: string
  projectId: number
  projectName: string
  map: SiteMapData | null
  sitePlans: string[]
  models: PublicUnitType[]
  /** Johndorf's admins with Projects: draw and edit. Everyone else browses. */
  staff: boolean
  /** May make offers (shows "Make an offer for this lot"). */
  canOffer: boolean
}

const field = "block w-full rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const label = "mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5a554d]"
const num = (v: string) => (v.trim() === "" ? null : Number(v))
/** "36 sqm" → 36, for a model's floor area. */
const sqm = (v: string | null | undefined) => {
  const m = v?.match(/[\d.]+/)
  return m ? m[0] : ""
}
const MAX_PHOTOS = 12

/** What the next click is. Clicks go in pairs, from lot 1 on: the road side, then straight across at the back. */
const clickHint = (n: number) =>
  n === 0
    ? "Click the road-side corner of the first lot."
    : n === 1
      ? "Click straight across: the back corner of the first lot."
      : n % 2 === 1
        ? "Click straight across from your last click, at the back."
        : n === 2
          ? "Click the road side at the end of the row. If the row bends, click the first bend instead."
          : "Click the road side at the next bend, or at the end of the row."

/**
 * The project's Site map tab. Admins draw each row of lots on the plan (four clicks, then the block,
 * first lot and how many), click a lot to fill in its details and photos, and adjust, fill or remove a
 * row. Agents and staff without Projects see each lot, its status and photos, and start an offer from it.
 */
export function SiteMapTab(p: Props) {
  if (!p.map) {
    return (
      <div className="rounded-xl mt-6 border-2 border-dashed border-[#d9d4cb] px-6 py-12 text-center">
        <p className="text-lg font-bold">No site development plan yet</p>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-[#5a554d]">{p.staff ? "Upload the plan in the Website tab, under Site development plan. Then come back here to draw the lots on it." : "Johndorf hasn't uploaded this project's site plan yet."}</p>
      </div>
    )
  }
  return p.staff ? <Editor {...p} map={p.map} /> : <Browser {...p} map={p.map} />
}

const photosByModel = (models: PublicUnitType[]) => Object.fromEntries(models.map((m) => [m.name, m.images]))

/* ---------------------------------------------------------------- browse (agents) */

function Browser({ slug, projectId, projectName, map, models, canOffer }: Props & { map: SiteMapData }) {
  const [sel, setSel] = useState<SiteMapLot | null>(null)
  const aspect = useAspect(map.image)
  const all = useMemo(() => shapes(map, aspect), [map, aspect])
  const [hover, setHover] = useState<number | null>(null)
  const hovered = all.find((s) => s.lot.id === hover)
  const modelPhotos = useMemo(() => photosByModel(models), [models])

  const panel = sel ? (
    <LotDetails key={sel.id} lot={sel} modelPhotos={photosFor(sel, modelPhotos)} modelNames={Object.keys(modelPhotos)} noPrice="Not priced yet" onClose={() => setSel(null)}>
      <LotHolder lot={sel} offerHref={(id) => `/${slug}/dashboard/offers/${id}`} />
      {canOffer && sel.status === "available" && sel.price && (
        <Link href={`/${slug}/dashboard/offers/new?project=${projectId}&unit=${sel.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-[15px] font-bold text-white hover:brightness-110">
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Make an offer for this lot
        </Link>
      )}
      {sel.status === "available" && !sel.price && <p className="text-sm text-[#6b665d]">No price yet, so it can&apos;t be offered. Ask Johndorf&apos;s admin.</p>}
    </LotDetails>
  ) : (
    <p className="flex items-start gap-3 text-[15px] text-[#5a554d]">
      <MousePointerClick className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" /> Click a lot to see its details and photos. Green lots are available.
    </p>
  )

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-3">
        <StatusLegend lots={map.lots} />
        <SiteMapCanvas
          image={map.image}
          alt={`${projectName} site development plan`}
          side={panel}
          layers={all.map(({ lot, quad }) => <LotShape key={lot.id} quad={quad} lot={lot} selected={lot.id === sel?.id} onClick={() => setSel(lot)} onHover={(on) => setHover(on ? lot.id : null)} />)}
          labels={hovered && <LotTip lot={hovered.lot} quad={hovered.quad} photo={tipPhoto(hovered.lot, modelPhotos)} />}
        />
        {map.lots.length === 0 && <p className="text-sm text-[#6b665d]">The lots haven&apos;t been drawn on this plan yet.</p>}
      </div>
      <aside className="rounded-2xl border border-[#e8eaed] bg-white shadow-[0_2px_12px_-2px_rgba(23,21,15,0.06)] p-5 lg:self-start">{panel}</aside>
    </div>
  )
}

/* ---------------------------------------------------------------- edit (admins) */

type Mode = { kind: "idle" } | { kind: "draw"; points: Point[] } | { kind: "lot"; id: number } | { kind: "adjust"; rowId: number; corners: Point[] }

function Editor({ slug, projectId, projectName, map: initial, sitePlans, models }: Props & { map: SiteMapData }) {
  const router = useRouter()
  const [map, setMap] = useState(initial)
  const [mode, setMode] = useState<Mode>({ kind: "idle" })
  const [full, setFull] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const [cursorAt, setCursorAt] = useState<Point | null>(null)
  const [pending, start] = useTransition()
  const [row, setRow] = useState({ block: "", first_lot: "1", lot_count: "", unit_type: "", lot_area_sqm: "", area_sqm: "", price: "" })
  const [rowPhotos, setRowPhotos] = useState<File[]>([])
  const [rowError, setRowError] = useState<Record<string, string>>({})
  const modelPhotos = useMemo(() => photosByModel(models), [models])

  // A fresh map from the server (after a save elsewhere) replaces ours.
  const [seen, setSeen] = useState(initial)
  if (initial !== seen) {
    setSeen(initial)
    setMap(initial)
  }
  // Esc: undo the last click, then close the panel, then leave full screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("dialog[open]")) return
      if (mode.kind === "draw" && mode.points.length) setMode({ kind: "draw", points: mode.points.slice(0, -1) })
      else if (mode.kind !== "idle") setMode({ kind: "idle" })
      else setFull(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mode])

  const aspect = useAspect(map.image)
  const all = useMemo(() => shapes(map, aspect), [map, aspect])
  const selectedLot = mode.kind === "lot" ? map.lots.find((l) => l.id === mode.id) : undefined
  const selectedRow = mode.kind === "lot" ? map.rows.find((r) => r.id === selectedLot?.row_id) : mode.kind === "adjust" ? map.rows.find((r) => r.id === mode.rowId) : undefined
  const hovered = all.find((s) => s.lot.id === hover)
  const points = mode.kind === "draw" ? mode.points : []
  const previewCount = Math.max(0, Math.min(200, Number(row.lot_count) || 0))
  const drawing = mode.kind === "draw"
  const adjusting = mode.kind === "adjust"
  // The new row's outline from its complete pairs of clicks; it can be saved once it has two pairs and no half pair.
  const corners = outline(points)
  const shaped = points.length >= 4
  const halfPair = points.length % 2 === 1
  // Points that can be dragged: a row being adjusted, or a new row once it has its first 4 clicks.
  const handles = adjusting ? mode.corners : drawing && shaped ? points : null
  // While drawing, the road side and the back side so far, and the line to the pointer for the next click.
  const road = points.filter((_, i) => i % 2 === 0)
  const back = points.filter((_, i) => i % 2 === 1)
  const nextOnRoad = !halfPair

  const run = (task: () => Promise<{ error?: string; fieldErrors?: Record<string, string>; map?: SiteMapData | null }>, done: string, after?: (m: SiteMapData | null | undefined) => void | Promise<void>) =>
    start(async () => {
      const r = await task()
      if (r.error) {
        toast(r.error, "error")
        if (r.fieldErrors) setRowError(r.fieldErrors)
        return
      }
      setRowError({})
      if (r.map) setMap(r.map)
      toast(done)
      await after?.(r.map)
      router.refresh()
    })

  const setLotPhotos = (id: number, photos: string[]) => setMap((m) => ({ ...m, lots: m.lots.map((l) => (l.id === id ? { ...l, photos } : l)) }))

  const pickModel = (name: string) => {
    const m = models.find((x) => x.name === name)
    setRow((r) => ({ ...r, unit_type: name, area_sqm: r.area_sqm || sqm(m?.specs?.usable_floor_area ?? m?.specs?.typical_floor_area) }))
  }

  const saveRow = () => {
    if (!shaped || halfPair) return
    const input: RowInput = {
      block: row.block.trim(),
      corners,
      first_lot: Number(row.first_lot) || 1,
      lot_count: Number(row.lot_count) || 0,
      unit_type: row.unit_type.trim() || null,
      lot_area_sqm: num(row.lot_area_sqm),
      area_sqm: num(row.area_sqm),
      price: num(row.price),
    }
    const photos = rowPhotos
    run(() => addSiteRow(slug, projectId, input), `Block ${input.block}, lots ${input.first_lot}–${input.first_lot + input.lot_count - 1} added`, async (m) => {
      // Photos chosen for the row go on all its lots, once the row exists.
      const created = m?.rows.find((r) => r.block === input.block && r.first_lot === input.first_lot)
      if (created && photos.length) {
        const fd = new FormData()
        photos.forEach((f) => fd.append("photos", f))
        const up = await uploadRowPhotos(slug, projectId, created.id, fd)
        if (up.error) toast(`The lots were added, but the photos didn't upload: ${up.error}`, "error")
        else if (up.map) setMap(up.map)
      }
      setMode({ kind: "draw", points: [] })
      setRowPhotos([])
      // The next row usually carries on in the same block with the same model and price.
      setRow((r) => ({ ...r, first_lot: String(input.first_lot + input.lot_count), lot_count: "" }))
    })
  }

  const panel = (
    <>
      {drawing && !shaped && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Draw a row · click {points.length + 1}</p>
          <p className="mt-2 text-lg font-bold leading-snug">{clickHint(points.length)}</p>
          <p className="mt-3 text-sm text-[#5a554d]">A row is one line of lots, like the top row of a block. You click in pairs: the road side, then straight across at the back. Lot numbers count up from your first pair.</p>
          <p className="mt-3 text-sm text-[#5a554d]">A straight row is 4 clicks. If it bends, click a pair at every bend too. Zoom in close first: it makes the clicks exact.</p>
          {points.length > 0 && (
            <button type="button" onClick={() => setMode({ kind: "draw", points: points.slice(0, -1) })} className="mt-4 text-sm font-bold text-[var(--accent)] hover:underline">
              Undo the last click
            </button>
          )}
        </div>
      )}

      {drawing && shaped && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveRow()
          }}
          className="space-y-3"
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">New row of lots</p>
          {halfPair ? (
            <p className="rounded-xl border-l-4 border-[#1d4ed8] bg-[#eff4ff] px-3 py-2 text-sm font-semibold text-[#1e3a8a]">{clickHint(points.length)} That finishes this bend.</p>
          ) : (
            <p className="text-xs text-[#6b665d]">
              Drag the blue points if a line is off. Row bends? Keep clicking in pairs: the road side, then straight across.{points.length >= MAX_CORNERS ? ` That's the most (${MAX_CORNERS / 2} pairs).` : ""}
            </p>
          )}
          {points.length > 4 && (
            <button type="button" onClick={() => setMode({ kind: "draw", points: points.slice(0, -1) })} className="text-xs font-bold text-[var(--accent)] hover:underline">
              Undo the last click
            </button>
          )}
          <div className="grid grid-cols-3 gap-2">
            <label>
              <span className={label}>Block</span>
              <input autoFocus required value={row.block} onChange={(e) => setRow({ ...row, block: e.target.value })} className={field} placeholder="4" />
            </label>
            <label>
              <span className={label}>First lot</span>
              <input required type="number" min={1} value={row.first_lot} onChange={(e) => setRow({ ...row, first_lot: e.target.value })} className={field} />
            </label>
            <label>
              <span className={label}>How many</span>
              <input required type="number" min={1} max={200} value={row.lot_count} onChange={(e) => setRow({ ...row, lot_count: e.target.value })} className={field} placeholder="17" />
            </label>
          </div>
          {(rowError.first_lot || rowError.block || rowError.lot_count) && <p className="text-sm font-semibold text-red-700">{rowError.first_lot ?? rowError.block ?? rowError.lot_count}</p>}
          <p className="text-xs text-[#8a847a]">For every lot in the row (you can change single lots after):</p>
          <ModelField value={row.unit_type} models={models} onChange={pickModel} />
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className={label}>Lot area (sqm)</span>
              <input type="number" min={0} step="0.01" value={row.lot_area_sqm} onChange={(e) => setRow({ ...row, lot_area_sqm: e.target.value })} className={field} placeholder="42" />
            </label>
            <label>
              <span className={label}>Floor area (sqm)</span>
              <input type="number" min={0} step="0.01" value={row.area_sqm} onChange={(e) => setRow({ ...row, area_sqm: e.target.value })} className={field} />
            </label>
          </div>
          <label className="block">
            <span className={label}>Price (₱)</span>
            <input type="number" min={0} step="1" value={row.price} onChange={(e) => setRow({ ...row, price: e.target.value })} className={field} placeholder="Leave empty if not priced yet" />
          </label>
          <PhotoPicker files={rowPhotos} onChange={setRowPhotos} hint="Photos for every lot in this row (optional)" />
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={pending || halfPair || !row.block.trim() || !Number(row.lot_count)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />} Add {Number(row.lot_count) || ""} lots
            </button>
            <button type="button" onClick={() => setMode({ kind: "draw", points: [] })} className="px-3 py-2.5 text-sm font-semibold text-[#8a847a] hover:text-[#17150f]">
              Redraw
            </button>
          </div>
        </form>
      )}

      {mode.kind === "lot" && selectedLot && selectedRow && (
        <div className="space-y-5">
          <LotHolder lot={selectedLot} offerHref={(id) => `/${slug}/dashboard/offers/${id}`} />
          <LotEditor
            key={selectedLot.id}
            lot={selectedLot}
            models={models}
            pending={pending}
            onSave={(input) =>
              run(() => saveLot(slug, projectId, selectedLot.id, input), `${lotName(selectedLot)} saved`, () =>
                setMap((m) => ({ ...m, lots: m.lots.map((l) => (l.id === selectedLot.id ? { ...l, model: input.unit_type, lot_area: input.lot_area_sqm?.toString() ?? null, floor_area: input.area_sqm?.toString() ?? null, price: input.price?.toString() ?? null, status: input.status as SiteMapLot["status"], tags: input.tags } : l)) })),
              )
            }
            onClose={() => setMode({ kind: "idle" })}
          />
          <LotPhotoManager
            lot={selectedLot}
            modelPhotos={photosFor(selectedLot, modelPhotos)}
            onUpload={async (fd) => {
              const r = await uploadLotPhotos(slug, projectId, selectedLot.id, fd)
              if (r.error) return toast(r.error, "error")
              setLotPhotos(selectedLot.id, r.photos ?? [])
              toast("Photos added")
            }}
            onRemove={async (url) => {
              const r = await removeLotPhoto(slug, projectId, selectedLot.id, url)
              if (r.error) return toast(r.error, "error")
              setLotPhotos(selectedLot.id, r.photos ?? [])
              toast("Photo removed")
            }}
          />
          <RowPanel
            row={selectedRow}
            models={models}
            pending={pending}
            onAdjust={() => setMode({ kind: "adjust", rowId: selectedRow.id, corners: selectedRow.corners })}
            onApply={(v) => run(() => applyToSiteRow(slug, projectId, selectedRow.id, v), "Every lot in the row updated")}
            onPhotos={(fd) =>
              start(async () => {
                const r = await uploadRowPhotos(slug, projectId, selectedRow.id, fd)
                if (r.error) return toast(r.error, "error")
                if (r.map) setMap(r.map)
                toast(r.skipped ? `Photos added. ${r.skipped} lot${r.skipped === 1 ? " already had" : "s already had"} ${MAX_PHOTOS} photos and were skipped.` : "Photos added to every lot in the row")
              })
            }
            onRemove={async () => {
              if (!(await confirmAction({ title: `Remove Block ${selectedRow.block}, lots ${selectedRow.first_lot}–${selectedRow.first_lot + selectedRow.lot_count - 1}?`, body: "The lots and their photos are deleted from the project. Lots that have offers stay as units, just off the map.", confirm: "Remove row", danger: true }))) return
              start(async () => {
                const r = await removeSiteRow(slug, projectId, selectedRow.id)
                if (r.error) return toast(r.error, "error")
                if (r.map) setMap(r.map)
                setMode({ kind: "idle" })
                toast(r.kept ? `Row removed. ${r.kept} lot${r.kept === 1 ? " has" : "s have"} offers and stayed as units.` : "Row removed")
                router.refresh()
              })
            }}
          />
        </div>
      )}

      {adjusting && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">
            <Move className="mr-1 inline h-3.5 w-3.5" /> Adjusting Block {selectedRow?.block}
          </p>
          <p className="mt-2 text-[15px] text-[#3d3a34]">Drag the blue points until the lots sit on the drawing, then save.</p>
          <div className="mt-4 flex gap-2">
            <button type="button" disabled={pending} onClick={() => run(() => moveSiteRow(slug, projectId, mode.rowId, mode.corners), "Row moved", () => setMode({ kind: "idle" }))} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />} Save position
            </button>
            <button type="button" onClick={() => setMode({ kind: "idle" })} className="px-3 py-2.5 text-sm font-semibold text-[#8a847a] hover:text-[#17150f]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode.kind === "idle" && <Help map={map} />}
    </>
  )

  const drawButton = drawing ? (
    <button type="button" onClick={() => setMode({ kind: "idle" })} className="inline-flex items-center gap-2 rounded-xl border border-[#17150f] bg-white px-4 py-2.5 text-sm font-bold hover:bg-[#f6f4f0]">
      <X className="h-4 w-4" /> Done drawing
    </button>
  ) : (
    <button type="button" onClick={() => setMode({ kind: "draw", points: [] })} disabled={adjusting} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
      <PencilRuler className="h-4 w-4" /> Draw a row of lots
    </button>
  )

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusLegend lots={map.lots} />
        <div className="flex flex-wrap items-center gap-2">
          {sitePlans.length > 1 && (
            <select
              value={sitePlans.includes(map.image) ? map.image : sitePlans[0]}
              disabled={pending || drawing || adjusting}
              onChange={async (e) => {
                const image = e.target.value
                if (map.rows.length && !(await confirmAction({ title: "Draw on another plan?", body: "The rows already drawn stay where they are, so they won't line up with a different picture.", confirm: "Change plan" }))) return
                run(() => setSiteMapImage(slug, projectId, image), "Plan changed")
              }}
              aria-label="Which site plan to draw on"
              className="rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-sm font-semibold"
            >
              {sitePlans.map((s, i) => (
                <option key={s} value={s}>
                  Site plan {i + 1}
                </option>
              ))}
            </select>
          )}
          {drawButton}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <AdjustableCanvas
            image={map.image}
            alt={`${projectName} site development plan`}
            fullscreen={full}
            onFullscreen={setFull}
            side={
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6e2db] pb-3">
                  <StatusLegend lots={map.lots} />
                  {drawButton}
                </div>
                {panel}
              </div>
            }
            cursor={drawing && points.length < MAX_CORNERS ? "crosshair" : undefined}
            onPoint={(pt) => {
              if (drawing && points.length < MAX_CORNERS) setMode({ kind: "draw", points: [...points, pt] })
            }}
            onMove={drawing ? setCursorAt : undefined}
            handles={handles}
            numbered={drawing}
            tapZoom={!drawing && !adjusting}
            onHandles={(c) => {
              if (adjusting) setMode({ ...mode, corners: c })
              else if (drawing) setMode({ kind: "draw", points: c })
            }}
            layers={
              <>
                {all.map(({ lot, quad }) => (
                  <LotShape
                    key={lot.id}
                    quad={quad}
                    lot={lot}
                    selected={lot.id === selectedLot?.id}
                    dim={(drawing || adjusting) && lot.row_id !== selectedRow?.id}
                    onClick={drawing || adjusting ? undefined : () => setMode({ kind: "lot", id: lot.id })}
                    onHover={(on) => setHover(on ? lot.id : null)}
                  />
                ))}
                {selectedRow && !adjusting && <polygon points={svgPoints(selectedRow.corners)} fill="none" stroke="#17150f" strokeWidth={1.5} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
                {adjusting &&
                  lotQuads(mode.corners, selectedRow?.lot_count ?? 1, undefined, aspect).map((q, i) => <polygon key={i} points={svgPoints(q)} fill="#2563eb" fillOpacity={0.25} stroke="#1d4ed8" strokeWidth={1.2} vectorEffect="non-scaling-stroke" pointerEvents="none" />)}
                {drawing && (
                  <g fill="none" stroke="#1d4ed8" strokeWidth={2} vectorEffect="non-scaling-stroke" pointerEvents="none">
                    {road.length > 1 && <polyline points={svgPoints(road)} vectorEffect="non-scaling-stroke" />}
                    {back.length > 1 && <polyline points={svgPoints(back)} vectorEffect="non-scaling-stroke" />}
                    {back.map((b, i) => (
                      <line key={i} x1={road[i][0]} y1={road[i][1]} x2={b[0]} y2={b[1]} vectorEffect="non-scaling-stroke" />
                    ))}
                    {cursorAt && points.length > 0 && (!shaped || halfPair) && (
                      <g strokeDasharray="5 4" strokeOpacity={0.8}>
                        {/* the road side going on, or (for a half pair) the line straight across */}
                        <line x1={road[road.length - 1][0]} y1={road[road.length - 1][1]} x2={cursorAt[0]} y2={cursorAt[1]} vectorEffect="non-scaling-stroke" />
                        {!nextOnRoad && back.length > 0 && <line x1={back[back.length - 1][0]} y1={back[back.length - 1][1]} x2={cursorAt[0]} y2={cursorAt[1]} vectorEffect="non-scaling-stroke" />}
                      </g>
                    )}
                  </g>
                )}
                {drawing && shaped && previewCount > 0 && lotQuads(corners, previewCount, undefined, aspect).map((q, i) => <polygon key={i} points={svgPoints(q)} fill="#2563eb" fillOpacity={0.25} stroke="#1d4ed8" strokeWidth={1.2} vectorEffect="non-scaling-stroke" pointerEvents="none" />)}
              </>
            }
            labels={
              <>
                {drawing &&
                  !shaped &&
                  points.map((pt, i) => (
                    <span key={i} className="pointer-events-none absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#1d4ed8] text-[10px] font-bold text-white shadow" style={{ left: `${pt[0] * 100}%`, top: `${pt[1] * 100}%` }}>
                      {i + 1}
                    </span>
                  ))}
                {drawing && shaped && previewCount > 0 && (
                  <span className="rounded-full pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[160%] bg-[#1d4ed8] px-2 py-0.5 text-xs font-bold text-white" style={{ left: `${points[0][0] * 100}%`, top: `${points[0][1] * 100}%` }}>
                    Lot {row.first_lot || 1}
                  </span>
                )}
                {hovered && !drawing && !adjusting && <LotTip lot={hovered.lot} quad={hovered.quad} photo={tipPhoto(hovered.lot, modelPhotos)} />}
              </>
            }
          />
        </div>

        {!full && <aside className="rounded-2xl border border-[#e8eaed] bg-white shadow-[0_2px_12px_-2px_rgba(23,21,15,0.06)] p-5 lg:self-start">{panel}</aside>}
      </div>
    </div>
  )
}

function Help({ map }: { map: SiteMapData }) {
  const blocks = new Set(map.rows.map((r) => r.block)).size
  return (
    <div className="space-y-4 text-[15px] text-[#3d3a34]">
      <p className="text-lg font-bold text-[#17150f]">{map.lots.length ? `${map.lots.length} lots in ${blocks} block${blocks === 1 ? "" : "s"} on the map` : "Put the lots on the map"}</p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Open <b>full screen</b> (the arrows at the top right of the plan) and zoom in on a block.
        </li>
        <li>
          Click <b>Draw a row of lots</b>, then click in pairs along one row: the road side, then straight across at the back. A straight row is 4 clicks; add a pair at every bend.
        </li>
        <li>Type the block, the first lot number and how many lots. Add the house model, lot area, price and photos they share.</li>
        <li>Repeat for every row. A block usually has two rows, back to back.</li>
        <li>Click any lot to change it alone: a corner lot, a different price, its own photos, reserved or sold.</li>
      </ol>
      <p className="text-sm text-[#6b665d]">Agents see this map, the buyer sees where their home is, and the website shows which lots are still available (without prices).</p>
    </div>
  )
}

function ModelField({ value, models, onChange }: { value: string; models: PublicUnitType[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className={label}>House model</span>
      <input list="site-map-models" value={value} onChange={(e) => onChange(e.target.value)} className={field} placeholder={models[0]?.name ?? "e.g. Two-Storey Townhouse"} />
      <datalist id="site-map-models">
        {models.map((m) => (
          <option key={m.id} value={m.name} />
        ))}
      </datalist>
    </label>
  )
}

/** Choose photos (kept until the form is sent), with their thumbnails. */
function PhotoPicker({ files, onChange, hint }: { files: File[]; onChange: (f: File[]) => void; hint: string }) {
  const input = useRef<HTMLInputElement>(null)
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  return (
    <div>
      <span className={label}>{hint}</span>
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <span key={u} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-14 w-20 border border-[#e6e2db] object-cover" />
            <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} aria-label="Remove this photo" className="absolute -right-1.5 -top-1.5 rounded-full bg-[#17150f] p-0.5 text-white">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <button type="button" onClick={() => input.current?.click()} className="rounded-xl inline-flex h-14 items-center gap-1.5 border border-dashed border-[#a39d92] px-3 text-xs font-bold text-[#3d3a34] hover:border-[#17150f]">
          <ImagePlus className="h-4 w-4" /> Add photos
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/") && f.size <= 8 * 1024 * 1024)
          if (picked.length < (e.target.files?.length ?? 0)) toast("Only photos up to 8 MB each are added.", "error")
          onChange([...files, ...picked].slice(0, MAX_PHOTOS))
          e.target.value = ""
        }}
      />
    </div>
  )
}

/** A lot's own photos: add (upload at once) and remove. Without its own, the model's pictures are shown. */
function LotPhotoManager({ lot, modelPhotos, onUpload, onRemove }: { lot: SiteMapLot; modelPhotos: string[]; onUpload: (fd: FormData) => Promise<unknown>; onRemove: (url: string) => Promise<unknown> }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const room = MAX_PHOTOS - lot.photos.length
  return (
    <div className="border-t border-[#e6e2db] pt-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a847a]">
        <Camera className="h-3.5 w-3.5" /> Photos of this lot · {lot.photos.length}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {lot.photos.map((u) => (
          <span key={u} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={lotName(lot)} className="h-16 w-24 border border-[#e6e2db] object-cover" />
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!(await confirmAction({ title: "Remove this photo from the lot?", confirm: "Remove", danger: true }))) return
                setBusy(true)
                await onRemove(u)
                setBusy(false)
              }}
              aria-label="Remove this photo"
              className="absolute -right-1.5 -top-1.5 rounded-full bg-[#17150f] p-0.5 text-white hover:bg-red-700"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {room > 0 && (
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="rounded-xl inline-flex h-16 items-center gap-1.5 border border-dashed border-[#a39d92] px-3 text-xs font-bold text-[#3d3a34] hover:border-[#17150f] disabled:opacity-50">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {busy ? "Uploading…" : "Add photos"}
          </button>
        )}
      </div>
      {lot.photos.length === 0 && <p className="mt-2 text-xs text-[#8a847a]">{modelPhotos.length ? (lot.model ? `Without its own photos, the lot shows the ${lot.model} model's ${modelPhotos.length} picture${modelPhotos.length === 1 ? "" : "s"}.` : `No house model set: the lot shows the pictures of every model in this project (${modelPhotos.length}). Set its model above to show the right one.`) : "Add photos of the actual house or lot."}</p>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const picked = Array.from(e.target.files ?? []).slice(0, room)
          e.target.value = ""
          if (!picked.length) return
          const fd = new FormData()
          picked.forEach((f) => fd.append("photos", f))
          setBusy(true)
          await onUpload(fd)
          setBusy(false)
        }}
      />
    </div>
  )
}

function LotEditor({ lot, models, pending, onSave, onClose }: { lot: SiteMapLot; models: PublicUnitType[]; pending: boolean; onSave: (input: LotInput) => void; onClose: () => void }) {
  const [v, setV] = useState({ model: lot.model ?? "", lot_area: lot.lot_area ? String(Number(lot.lot_area)) : "", floor_area: lot.floor_area ? String(Number(lot.floor_area)) : "", price: lot.price ? String(Number(lot.price)) : "", status: lot.status, tags: lot.tags })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ name: lotName(lot), unit_type: v.model.trim() || null, lot_area_sqm: num(v.lot_area), area_sqm: num(v.floor_area), price: num(v.price), status: v.status, tags: v.tags })
      }}
      className="space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Lot details</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{lotName(lot)}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 p-2 text-[#6b665d] hover:text-[#17150f]">
          <X className="h-5 w-5" />
        </button>
      </div>
      <ModelField value={v.model} models={models} onChange={(model) => setV({ ...v, model })} />
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className={label}>Lot area (sqm)</span>
          <input type="number" min={0} step="0.01" value={v.lot_area} onChange={(e) => setV({ ...v, lot_area: e.target.value })} className={field} />
        </label>
        <label>
          <span className={label}>Floor area (sqm)</span>
          <input type="number" min={0} step="0.01" value={v.floor_area} onChange={(e) => setV({ ...v, floor_area: e.target.value })} className={field} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className={label}>Price (₱)</span>
          <input type="number" min={0} value={v.price} onChange={(e) => setV({ ...v, price: e.target.value })} className={field} placeholder="On request" />
        </label>
        <label>
          <span className={label}>Status</span>
          <select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as SiteMapLot["status"] })} className={field}>
            {(["available", "reserved", "sold"] as const).map((s) => (
              <option key={s} value={s}>
                {STATUS_STYLE[s].label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset>
        <legend className={label}>Special lot</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LOT_TAGS).map(([k, name]) => {
            const on = v.tags.includes(k)
            return (
              <label key={k} className={`rounded-xl inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm font-semibold ${on ? "border-[var(--accent)] bg-[#fff4f3] text-[#17150f]" : "border-[#d9d4cb] text-[#5a554d]"}`}>
                <input type="checkbox" checked={on} onChange={() => setV({ ...v, tags: on ? v.tags.filter((t) => t !== k) : [...v.tags, k] })} className="h-4 w-4 accent-[var(--accent)]" />
                {name}
              </label>
            )
          })}
        </div>
      </fieldset>
      <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />} Save lot
      </button>
    </form>
  )
}

function RowPanel({
  row,
  models,
  pending,
  onAdjust,
  onApply,
  onPhotos,
  onRemove,
}: {
  row: SiteMapRow
  models: PublicUnitType[]
  pending: boolean
  onAdjust: () => void
  onApply: (v: { unit_type?: string; lot_area_sqm?: number; area_sqm?: number; price?: number }) => void
  onPhotos: (fd: FormData) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [v, setV] = useState({ model: "", lot_area: "", floor_area: "", price: "" })
  const photoInput = useRef<HTMLInputElement>(null)
  const values = Object.fromEntries(
    [
      ["unit_type", v.model.trim()],
      ["lot_area_sqm", num(v.lot_area)],
      ["area_sqm", num(v.floor_area)],
      ["price", num(v.price)],
    ].filter(([, x]) => x !== null && x !== ""),
  )
  return (
    <div className="border-t border-[#e6e2db] pt-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a847a]">This row</p>
      <p className="mt-1 font-bold">
        Block {row.block} · lots {row.first_lot}–{row.first_lot + row.lot_count - 1}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onAdjust} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold hover:border-[#17150f]">
          <Move className="h-3.5 w-3.5" /> Adjust position
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold hover:border-[#17150f]">
          Fill in every lot
        </button>
        <button type="button" disabled={pending} onClick={() => photoInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold hover:border-[#17150f] disabled:opacity-50">
          {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} Photos for every lot
        </button>
        <button type="button" onClick={onRemove} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold hover:border-red-400 hover:text-red-700">
          <Trash2 className="h-3.5 w-3.5" /> Remove row
        </button>
      </div>
      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS)
          e.target.value = ""
          if (!picked.length) return
          const fd = new FormData()
          picked.forEach((f) => fd.append("photos", f))
          onPhotos(fd)
        }}
      />
      {open && (
        <form
          className="rounded-xl mt-3 space-y-2 border border-[#e6e2db] bg-[#faf8f5] p-3"
          onSubmit={(e) => {
            e.preventDefault()
            onApply(values)
          }}
        >
          <p className="text-xs text-[#6b665d]">Only what you fill in changes, on every lot in this row.</p>
          <ModelField value={v.model} models={models} onChange={(model) => setV({ ...v, model })} />
          <div className="grid grid-cols-3 gap-2">
            <label>
              <span className={label}>Lot sqm</span>
              <input type="number" min={0} value={v.lot_area} onChange={(e) => setV({ ...v, lot_area: e.target.value })} className={field} />
            </label>
            <label>
              <span className={label}>Floor sqm</span>
              <input type="number" min={0} value={v.floor_area} onChange={(e) => setV({ ...v, floor_area: e.target.value })} className={field} />
            </label>
            <label>
              <span className={label}>Price</span>
              <input type="number" min={0} value={v.price} onChange={(e) => setV({ ...v, price: e.target.value })} className={field} />
            </label>
          </div>
          <button type="submit" disabled={pending || Object.keys(values).length === 0} className="inline-flex items-center gap-2 rounded-xl bg-[#17150f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
            Apply to all {row.lot_count} lots
          </button>
        </form>
      )}
    </div>
  )
}

/** The canvas, plus draggable point handles (a row being adjusted, or a new row before it is saved), numbered in click order while drawing. */
function AdjustableCanvas({ handles, onHandles, numbered, labels, ...rest }: Omit<React.ComponentProps<typeof SiteMapCanvas>, "labels"> & { labels?: React.ReactNode; handles: Point[] | null; onHandles: (c: Point[]) => void; numbered?: boolean }) {
  const drag = useRef<number | null>(null)
  return (
    <SiteMapCanvas
      {...rest}
      labels={
        <>
          {labels}
          {handles?.map((pt, i) => (
            <span
              key={i}
              data-handle
              role="slider"
              aria-label={`Point ${i + 1}`}
              aria-valuenow={Math.round(pt[0] * 100)}
              tabIndex={0}
              onPointerDown={(e) => {
                e.stopPropagation()
                drag.current = i
                e.currentTarget.setPointerCapture(e.pointerId)
              }}
              onPointerMove={(e) => {
                if (drag.current !== i) return
                const box = e.currentTarget.parentElement!.getBoundingClientRect()
                const next = handles.map((h, j) => (j === i ? ([Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)), Math.min(1, Math.max(0, (e.clientY - box.top) / box.height))] as Point) : h))
                onHandles(next)
              }}
              onPointerUp={() => (drag.current = null)}
              onClick={(e) => e.stopPropagation()}
              className="absolute z-20 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full border-2 border-white bg-[#1d4ed8] text-[10px] font-bold text-white shadow-lg active:cursor-grabbing"
              style={{ left: `${pt[0] * 100}%`, top: `${pt[1] * 100}%` }}
            >
              {numbered ? i + 1 : ""}
            </span>
          ))}
        </>
      }
    />
  )
}
