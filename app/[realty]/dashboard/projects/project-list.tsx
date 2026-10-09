"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, MapPin, Search, X } from "lucide-react"
import { Tag } from "@/components/dashboard-ui"
import { DeleteButton } from "../delete-button"
import { deleteProject } from "./actions"
import { type Filters, NO_FILTERS, type Project, STAGES } from "./types"
import { Photo } from "@/components/photo"

const ready = (p: Project) => p.status === "active" && (p.ready_units_count ?? 0) > 0

function matches(p: Project, f: Filters) {
  const q = f.q.trim().toLowerCase()
  if (q && ![p.name, p.location, p.region].some((v) => v?.toLowerCase().includes(q))) return false
  if (f.status && p.status !== f.status) return false
  if (f.stage && (f.stage === "none" ? !!p.stage : p.stage !== f.stage)) return false
  if (f.region && p.region !== f.region) return false
  if (f.ready === "ready" && !ready(p)) return false
  if (f.ready === "not" && ready(p)) return false
  return true
}

/** The realty's projects with search and filters; the filters live in the address so Back returns to them. */
export function ProjectList({ slug, projects, staff, initial }: { slug: string; projects: Project[]; staff: boolean; initial: Filters }) {
  const [f, setF] = useState<Filters>(initial)
  const set = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch }
    setF(next)
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v)).toString()
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname)
  }

  const shown = projects.filter((p) => matches(p, f))
  const filtered = Object.values(f).some(Boolean)
  const count = (fn: (p: Project) => boolean) => projects.filter(fn).length
  const regions = [...new Set(projects.map((p) => p.region).filter((r): r is string => !!r))].sort()
  const stages = [...STAGES, ...new Set(projects.map((p) => p.stage).filter((s): s is string => !!s && !STAGES.includes(s)))]

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))]">
        <label className="relative col-span-2 block lg:col-span-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a847a]" />
          <input type="search" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search name or place" aria-label="Search projects" className="block w-full border border-[#d9d4cb] bg-white py-2.5 pl-10 pr-3 text-[15px] text-[#17150f] outline-none focus:border-[var(--accent)]" />
        </label>
        <Filter label="Status" value={f.status} onChange={(status) => set({ status })} options={[["", "All statuses"], ["active", `Open for offers (${count((p) => p.status === "active")})`], ["archived", `Archived (${count((p) => p.status === "archived")})`]]} />
        <Filter label="Stage" value={f.stage} onChange={(stage) => set({ stage })} options={[["", "All stages"], ...stages.map((s): [string, string] => [s, `${s} (${count((p) => p.stage === s)})`]), ["none", `Stage not set (${count((p) => !p.stage)})`]]} />
        <Filter label="Region" value={f.region} onChange={(region) => set({ region })} options={[["", "All regions"], ...regions.map((r): [string, string] => [r, `${r} (${count((p) => p.region === r)})`])]} />
        <Filter label="Offers" value={f.ready} onChange={(r) => set({ ready: r })} options={[["", "Ready or not"], ["ready", `Ready to offer (${count(ready)})`], ["not", `Not ready yet (${count((p) => !ready(p))})`]]} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold text-[#5a554d]">{filtered ? `Showing ${shown.length} of ${projects.length}` : `${projects.length} project${projects.length === 1 ? "" : "s"}`}</span>
        {filtered && (
          <button type="button" onClick={() => set(NO_FILTERS)} className="inline-flex items-center gap-1 font-bold text-[var(--accent)] hover:underline">
            <X className="h-4 w-4" /> Clear filters
          </button>
        )}
      </div>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.id} className="relative">
            <Link href={`/${slug}/dashboard/projects/${p.id}`} className={`group flex h-full flex-col overflow-hidden border border-[#e6e2db] bg-white transition hover:border-[var(--accent)] ${p.status === "archived" ? "opacity-75 hover:opacity-100" : ""}`}>
              <div className="relative">
                {p.cover_url ? (
                  <Photo src={p.cover_url} sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw" className="aspect-[16/9] w-full object-cover" />
                ) : (
                  <div className="aspect-[16/9] w-full bg-[#efece6]" />
                )}
                {p.stage && <span className="absolute left-0 top-0 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#17150f]">{p.stage}</span>}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-bold">{p.name}</p>
                  <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    {p.status === "archived" && <Tag>Archived</Tag>}
                    {!p.is_public && <Tag tone="warn">Hidden</Tag>}
                  </span>
                </div>
                {p.location && (
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-[#6b665d]">
                    <MapPin className="h-3.5 w-3.5" /> {p.location}
                  </p>
                )}
                <p className="mt-4 text-xs text-[#8a847a]">
                  {p.units_count} unit{p.units_count === 1 ? "" : "s"} · {p.payment_plans_count} plan{p.payment_plans_count === 1 ? "" : "s"} · {p.offers_count} offer{p.offers_count === 1 ? "" : "s"}
                </p>
                {p.status === "active" && (
                  <p className={`mt-1 text-xs font-bold ${ready(p) ? "text-emerald-700" : "text-amber-700"}`}>{ready(p) ? `${p.ready_units_count} ready to offer` : "Not ready to offer: no unit with a price"}</p>
                )}
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-[var(--accent)]">
                  Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
            {staff && (
              <DeleteButton
                action={() => deleteProject(slug, p.id)}
                title={`Delete ${p.name}?`}
                body={`${p.name}, its ${p.units_count} unit${p.units_count === 1 ? "" : "s"}, payment plans and public page pictures are deleted for good. A project that has offers can't be deleted: archive it instead. This can't be undone.`}
                success={`${p.name} deleted`}
                className="absolute right-2 top-2 border border-[#d9d4cb] bg-white/95 px-2.5 py-1.5 text-xs font-bold text-[#17150f] shadow-sm hover:border-red-400 hover:text-red-700"
              />
            )}
          </li>
        ))}
        {shown.length === 0 && (
          <li className="border border-dashed border-[#d9d4cb] p-10 text-center text-sm text-[#8a847a] sm:col-span-2 lg:col-span-3">
            {filtered ? (
              <>
                No projects match these filters.{" "}
                <button type="button" onClick={() => set(NO_FILTERS)} className="font-bold text-[var(--accent)] hover:underline">
                  Clear filters
                </button>
              </>
            ) : (
              <>No projects yet.{staff ? " Use Add project to create the first one." : " Ask your realty to add one."}</>
            )}
          </li>
        )}
      </ul>
    </>
  )
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`block w-full min-w-0 border bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] ${value ? "border-[#17150f] font-bold text-[#17150f]" : "border-[#d9d4cb] font-semibold text-[#5a554d]"}`}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  )
}
