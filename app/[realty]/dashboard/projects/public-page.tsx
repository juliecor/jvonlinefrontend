"use client"

import { useActionState, useState } from "react"
import { Eye, EyeOff, ExternalLink, LoaderCircle, Pencil, Plus, Trash2, Upload, X } from "lucide-react"
import { Panel, Tag, btn, field } from "@/components/dashboard-ui"
import { Alert, Label } from "@/components/form"
import type { PublicUnitType, PublicUpdate } from "@/lib/public-projects-types"
import { type PageState, addPageMedia, addUpdatePhotos, deleteUnitType, deleteUpdateMonth, removePageMedia, removeUpdatePhoto, savePageSettings, saveUnitType } from "./page-actions"

export type PageData = {
  slug: string | null
  region: string | null
  stage: string | null
  is_public: boolean
  official_url: string | null
  amenities: string[] | null
  hero_urls: string[]
  site_plan_urls: string[]
  unit_types: PublicUnitType[]
  updates: PublicUpdate[]
}

const fileInput = "mt-1.5 block w-full text-sm text-[#6b665d] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
const SPECS: [keyof NonNullable<PublicUnitType["specs"]>, string, string][] = [
  ["usable_floor_area", "Usable floor area (sqm)", "64"],
  ["typical_floor_area", "Typical floor area (sqm)", "54"],
  ["bedrooms", "Bedrooms", "3"],
  ["baths", "Toilet & bath", "2"],
  ["floors", "Floors", "2"],
  ["parking", "Parking", "1"],
]

/** Everything on the project's public page, editable in place. Only realty staff see this. */
export function PublicPageEditor({ slug, projectId, projectName, data }: { slug: string; projectId: number; projectName: string; data: PageData }) {
  const live = data.is_public && data.slug
  return (
    <>
      <Panel
        title="Public project page"
        aside={
          live ? (
            <a href={`/projects/${data.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent)]">
              <Eye className="h-3.5 w-3.5" /> Live at jvconline.ph/projects/{data.slug} <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5" /> Not published</span>
          )
        }
      >
        <div className="pt-6">
          <SettingsForm slug={slug} projectId={projectId} projectName={projectName} data={data} />
        </div>
      </Panel>

      <Panel title={`Hero photos · ${data.hero_urls.length}`} aside="The big pictures at the top of the page; several crossfade">
        <MediaGrid slug={slug} projectId={projectId} kind="hero" urls={data.hero_urls} />
      </Panel>

      <div id="site-plan" className="scroll-mt-24">
        <Panel title={`Site development plan · ${data.site_plan_urls.length}`} aside="The drawn plan; shown on every offer, and buyers can open it full screen">
          <MediaGrid slug={slug} projectId={projectId} kind="plan" urls={data.site_plan_urls} />
        </Panel>
      </div>

      <Panel title={`House & unit models · ${data.unit_types.length}`} aside="Each model with its renders and spec sheet">
        <ul className="divide-y divide-[#e6e2db]">
          {data.unit_types.map((u) => (
            <UnitTypeRow key={u.id} slug={slug} projectId={projectId} unit={u} />
          ))}
        </ul>
        <div className="mt-6 border-t border-[#e6e2db] pt-6">
          <h3 className="mb-4 text-sm font-semibold">Add a model</h3>
          <UnitTypeForm slug={slug} projectId={projectId} />
        </div>
      </Panel>

      <Panel title={`Construction updates · ${data.updates.length} month${data.updates.length === 1 ? "" : "s"}`} aside="Photos by month; the newest month shows first">
        <ul className="divide-y divide-[#e6e2db]">
          {[...data.updates].reverse().map((m) => (
            <UpdateRow key={m.id} slug={slug} update={m} />
          ))}
          {data.updates.length === 0 && <li className="py-6 text-sm text-[#8a847a]">No updates yet.</li>}
        </ul>
        <div className="mt-6 border-t border-[#e6e2db] pt-6">
          <h3 className="mb-4 text-sm font-semibold">Add photos to a month</h3>
          <UpdateForm slug={slug} projectId={projectId} />
        </div>
      </Panel>
    </>
  )
}

function SettingsForm({ slug, projectId, projectName, data }: { slug: string; projectId: number; projectName: string; data: PageData }) {
  const [state, action, pending] = useActionState<PageState, FormData>(savePageSettings.bind(null, slug, projectId), {})
  const suggested = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <p className="text-sm text-[#5a554d] sm:col-span-2">Show or hide this page, and set the project&apos;s stage, in <a href="#status" className="font-semibold text-[var(--accent)] hover:underline">Status</a> at the top.</p>
      <label className="block">
        <Label>Page address</Label>
        <div className="mt-1.5 flex items-center rounded-md border border-[#d9d4cb] bg-white focus-within:border-[var(--accent)]">
          <span className="pl-3 text-sm text-[#a39d92]">/projects/</span>
          <input name="slug" defaultValue={data.slug ?? suggested} pattern="[a-z0-9]+(-[a-z0-9]+)*" className="block w-full bg-transparent py-2.5 pr-3 pl-0.5 text-[15px] outline-none" />
        </div>
      </label>
      <label className="block">
        <Label>Region</Label>
        <input name="region" defaultValue={data.region ?? ""} placeholder="Cebu · Cagayan de Oro · Davao · Iligan" className={field} />
      </label>
      <label className="block">
        <Label>Official page link (optional)</Label>
        <input name="official_url" type="url" defaultValue={data.official_url ?? ""} placeholder="https://…" className={field} />
      </label>
      <label className="block sm:col-span-2">
        <Label>Amenities & facilities — one per line</Label>
        <textarea name="amenities" rows={6} defaultValue={(data.amenities ?? []).join("\n")} placeholder={"Clubhouse\nSwimming Pool\n24 Hour Security"} className={field} />
      </label>
      {state.error && <div className="sm:col-span-2"><Alert kind="error">{state.error}</Alert></div>}
      {state.ok && <div className="sm:col-span-2"><Alert kind="success">{state.ok}</Alert></div>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Save page settings
        </button>
      </div>
    </form>
  )
}

function MediaGrid({ slug, projectId, kind, urls }: { slug: string; projectId: number; kind: "hero" | "plan"; urls: string[] }) {
  const [state, action, pending] = useActionState<PageState, FormData>(addPageMedia.bind(null, slug, projectId, kind), {})
  return (
    <div className="pt-5">
      {urls.length > 0 && (
        <ul className={`grid gap-3 ${kind === "hero" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
          {urls.map((u) => (
            <li key={u} className="group relative overflow-hidden border border-[#e6e2db] bg-[#efece6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className={`w-full object-cover ${kind === "hero" ? "aspect-[4/3]" : "aspect-[16/10]"}`} />
              <form
                action={removePageMedia.bind(null, slug, projectId, kind, u)}
                onSubmit={(e) => {
                  if (!confirm("Remove this image from the page?")) e.preventDefault()
                }}
                className="absolute right-2 top-2"
              >
                <button type="submit" aria-label="Remove image" className="flex h-8 w-8 items-center justify-center bg-white/90 text-[#17150f] hover:bg-red-600 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[240px]">
          <Label>{kind === "hero" ? "Add hero photos" : "Add a site plan image"}</Label>
          <input name="files" type="file" accept="image/*" multiple className={fileInput} />
        </label>
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
        </button>
        {state.error && <div className="w-full"><Alert kind="error">{state.error}</Alert></div>}
        {state.ok && <div className="w-full"><Alert kind="success">{state.ok}</Alert></div>}
      </form>
    </div>
  )
}

function UnitTypeForm({ slug, projectId, unit, onDone }: { slug: string; projectId: number; unit?: PublicUnitType; onDone?: () => void }) {
  const [state, action, pending] = useActionState<PageState, FormData>(async (prev, fd) => {
    const r = await saveUnitType(slug, projectId, unit?.id ?? null, prev, fd)
    if (r.ok && unit) onDone?.()
    return r
  }, {})
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-3">
      <label className="block sm:col-span-3">
        <Label>Model name</Label>
        <input name="name" required defaultValue={unit?.name} placeholder="Two-Storey Townhouse" className={field} />
      </label>
      {SPECS.map(([k, label, ph]) => (
        <label key={k} className="block">
          <Label>{label}</Label>
          <input name={k} defaultValue={unit?.specs?.[k] ?? ""} placeholder={ph} className={field} />
        </label>
      ))}
      {unit && unit.images.length > 0 && (
        <div className="sm:col-span-3">
          <Label>Current renders — untick to remove</Label>
          <ul className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {unit.images.map((u) => (
              <li key={u} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="aspect-[4/3] w-full border border-[#e6e2db] object-cover" />
                <label className="mt-1 flex items-center gap-1.5 text-[11px] text-[#6b665d]">
                  <input type="checkbox" name="remove" value={u} className="h-3.5 w-3.5 accent-red-600" /> remove
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      <label className="block sm:col-span-3">
        <Label>{unit ? "Add renders" : "Renders / floor plans"}</Label>
        <input name="images" type="file" accept="image/*" multiple className={fileInput} />
      </label>
      {state.error && <div className="sm:col-span-3"><Alert kind="error">{state.error}</Alert></div>}
      {state.ok && !unit && <div className="sm:col-span-3"><Alert kind="success">{state.ok}</Alert></div>}
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {unit ? "Save model" : "Add model"}
        </button>
        {unit && onDone && <button type="button" onClick={onDone} className={btn.ghost}>Cancel</button>}
      </div>
    </form>
  )
}

function UnitTypeRow({ slug, projectId, unit }: { slug: string; projectId: number; unit: PublicUnitType }) {
  const [editing, setEditing] = useState(false)
  if (editing) {
    return (
      <li className="py-5">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Editing {unit.name}</p>
        <UnitTypeForm slug={slug} projectId={projectId} unit={unit} onDone={() => setEditing(false)} />
      </li>
    )
  }
  const specs = unit.specs ? SPECS.filter(([k]) => unit.specs?.[k]).map(([k, label]) => `${label.replace(/ \(sqm\)/, "")} ${unit.specs?.[k]}`) : []
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {unit.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={unit.images[0]} alt="" className="h-16 w-24 shrink-0 border border-[#e6e2db] object-cover" />
        ) : (
          <div className="h-16 w-24 shrink-0 bg-[#efece6]" />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{unit.name}</p>
            <Tag>{unit.images.length} render{unit.images.length === 1 ? "" : "s"}</Tag>
          </div>
          <p className="mt-0.5 text-sm text-[#6b665d]">{specs.join(" · ") || "No specs yet"}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button type="button" onClick={() => setEditing(true)} className={btn.ghost}><Pencil className="h-3.5 w-3.5" /> Edit</button>
        <form
          action={deleteUnitType.bind(null, slug, unit.id)}
          onSubmit={(e) => {
            if (!confirm(`Delete the model "${unit.name}" from the public page?`)) e.preventDefault()
          }}
        >
          <button type="submit" aria-label={`Delete ${unit.name}`} className="rounded-md p-2 text-[#a39d92] hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
        </form>
      </div>
    </li>
  )
}

function UpdateForm({ slug, projectId }: { slug: string; projectId: number }) {
  const [state, action, pending] = useActionState<PageState, FormData>(addUpdatePhotos.bind(null, slug, projectId), {})
  const thisMonth = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }).slice(0, 7)
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
      <label className="block">
        <Label>Month</Label>
        <input name="month" type="month" required defaultValue={thisMonth} className={field} />
      </label>
      <label className="block">
        <Label>Photos</Label>
        <input name="photos" type="file" accept="image/*" multiple required className={fileInput} />
      </label>
      <button type="submit" disabled={pending} className={btn.primary}>
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
      </button>
      {state.error && <div className="sm:col-span-3"><Alert kind="error">{state.error}</Alert></div>}
      {state.ok && <div className="sm:col-span-3"><Alert kind="success">{state.ok}</Alert></div>}
    </form>
  )
}

function UpdateRow({ slug, update }: { slug: string; update: PublicUpdate }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 text-left">
          <span className="font-semibold">{update.label}</span>
          <Tag>{update.photos.length} photo{update.photos.length === 1 ? "" : "s"}</Tag>
          <span className="text-xs text-[#8a847a]">{open ? "hide" : "show"}</span>
        </button>
        <form
          action={deleteUpdateMonth.bind(null, slug, update.id)}
          onSubmit={(e) => {
            if (!confirm(`Delete all ${update.photos.length} photos for ${update.label}?`)) e.preventDefault()
          }}
        >
          <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a847a] hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /> Delete month</button>
        </form>
      </div>
      {open && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {update.photos.map((u) => (
            <li key={u} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="aspect-video w-full border border-[#e6e2db] object-cover" />
              <form action={removeUpdatePhoto.bind(null, slug, update.id, u)} className="absolute right-1 top-1">
                <button type="submit" aria-label="Remove photo" className="flex h-6 w-6 items-center justify-center bg-white/90 text-[#17150f] hover:bg-red-600 hover:text-white"><X className="h-3 w-3" /></button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
