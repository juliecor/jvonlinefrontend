"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { Empty } from "@/components/dashboard-ui"
import { byUnitName } from "@/lib/format"
import type { Unit } from "./types"
import { UnitRow } from "./unit-row"

const PAGE = 25
const STATUSES = [
  { value: "", label: "All" },
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
] as const

/**
 * A project's units, findable even when there are hundreds (Plumera has 334):
 * search by name, filter by status and type, and 25 at a time.
 */
export function UnitList({ slug, projectId, units, staff }: { slug: string; projectId: number; units: Unit[]; staff: boolean }) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [type, setType] = useState("")
  const [shown, setShown] = useState(PAGE)

  const sorted = useMemo(() => [...units].sort(byUnitName), [units])
  const types = useMemo(() => [...new Set(units.map((u) => u.unit_type).filter((t): t is string => !!t))].sort(), [units])
  const count = (s: string) => (s ? units.filter((u) => u.status === s).length : units.length)

  const needle = q.trim().toLowerCase()
  const matches = sorted.filter((u) => (!status || u.status === status) && (!type || u.unit_type === type) && (!needle || [u.name, u.unit_type, u.floor].some((v) => v?.toLowerCase().includes(needle))))
  const filtered = !!(needle || status || type)
  const reset = (fn: () => void) => {
    fn()
    setShown(PAGE)
  }

  return (
    <div className="pt-5">
      {units.length > 0 && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a847a]" />
            <input type="search" value={q} onChange={(e) => reset(() => setQ(e.target.value))} placeholder="Search a unit: Block 24, Unit 101…" aria-label="Search units" className="block w-full border border-[#d9d4cb] bg-white py-2.5 pl-10 pr-3 text-[15px] outline-none focus:border-[var(--accent)]" />
          </label>
          <div className="flex flex-wrap gap-2">
            <div role="group" aria-label="Status" className="flex border border-[#d9d4cb] bg-white">
              {STATUSES.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  aria-pressed={status === st.value}
                  onClick={() => reset(() => setStatus(st.value))}
                  className={`px-3 py-2 text-sm font-bold transition ${status === st.value ? "bg-[#17150f] text-white" : "text-[#5a554d] hover:bg-[#f6f4f0] hover:text-[#17150f]"}`}
                >
                  {st.label} <span className={`tabular-nums ${status === st.value ? "text-white/70" : "text-[#a39d92]"}`}>{count(st.value)}</span>
                </button>
              ))}
            </div>
            {types.length > 1 && (
              <select value={type} onChange={(e) => reset(() => setType(e.target.value))} aria-label="Unit type" className={`border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)] ${type ? "border-[#17150f] font-bold" : "border-[#d9d4cb] font-semibold text-[#5a554d]"}`}>
                <option value="">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t} ({units.filter((u) => u.unit_type === t).length})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {filtered && (
        <p className="mt-3 flex items-center gap-3 text-sm font-semibold text-[#5a554d]">
          {matches.length} of {units.length} units
          <button type="button" onClick={() =>
              reset(() => {
                setQ("")
                setStatus("")
                setType("")
              })
            } className="inline-flex items-center gap-1 font-bold text-[var(--accent)] hover:underline">
            <X className="h-4 w-4" /> Clear
          </button>
        </p>
      )}

      <ul className="mt-2 divide-y divide-[#e6e2db]">
        {matches.slice(0, shown).map((u) => (
          <UnitRow key={u.id} slug={slug} projectId={projectId} unit={u} staff={staff} />
        ))}
        {units.length === 0 && (
          <li>
            <Empty>No units yet.{staff ? " Use Add unit to add the first one." : ""}</Empty>
          </li>
        )}
        {units.length > 0 && matches.length === 0 && (
          <li>
            <Empty>No unit matches. Try another search or filter.</Empty>
          </li>
        )}
      </ul>

      {matches.length > shown && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#e6e2db] pt-4">
          <button type="button" onClick={() => setShown((n) => n + PAGE)} className="border border-[#d9d4cb] bg-white px-5 py-2.5 text-sm font-bold text-[#17150f] transition hover:border-[#17150f]">
            Show {Math.min(PAGE, matches.length - shown)} more
          </button>
          <button type="button" onClick={() => setShown(matches.length)} className="px-2 py-2.5 text-sm font-semibold text-[#6b665d] hover:text-[#17150f]">
            Show all {matches.length}
          </button>
          <span className="text-sm text-[#8a847a]">
            Showing {shown} of {matches.length}
          </span>
        </div>
      )}
    </div>
  )
}
