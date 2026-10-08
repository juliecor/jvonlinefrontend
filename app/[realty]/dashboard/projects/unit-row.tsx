"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { LoaderCircle, Pencil, Trash2 } from "lucide-react"
import { Tag, btn } from "@/components/dashboard-ui"
import { php, shortDate, sqm } from "@/lib/format"
import { type FormState, deleteUnit } from "./actions"
import type { Unit, UnitStatusDetail } from "./types"
import { UnitForm } from "./unit-form"

const TONE = { available: "good", reserved: "warn", sold: "neutral" } as const

/** One unit in the project's list; staff can open it for editing or delete it. */
export function UnitRow({ slug, projectId, unit, staff }: { slug: string; projectId: number; unit: Unit; staff: boolean }) {
  const [editing, setEditing] = useState(false)
  const [del, remove, deleting] = useActionState<FormState>(deleteUnit.bind(null, slug, unit.id), {})

  if (editing) {
    return (
      <li className="py-5">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Editing {unit.name}</p>
        <UnitForm slug={slug} projectId={projectId} unit={unit} onDone={() => setEditing(false)} />
      </li>
    )
  }

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {unit.floor_plan_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={unit.floor_plan_url} alt="" className="h-14 w-14 shrink-0 rounded-md border border-[#e6e2db] object-cover" />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded-md bg-[#efece6]" />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{unit.name}</p>
            <Tag tone={TONE[unit.status]}>{unit.status}</Tag>
          </div>
          <p className="mt-0.5 text-sm text-[#6b665d]">
            {[unit.unit_type !== unit.name ? unit.unit_type : null, unit.category, unit.floor, unit.area_sqm ? sqm(unit.area_sqm) : null].filter(Boolean).join(" · ")}
          </p>
          {unit.status !== "available" && unit.status_detail && <StatusLine slug={slug} status={unit.status} d={unit.status_detail} />}
          {unit.buyer_notes && <p className="mt-1 max-w-2xl text-sm font-semibold text-[#3d3a34]">On the offer: {unit.buyer_notes}</p>}
          {unit.notes && <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-[#8a847a]">Internal: {unit.notes}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4 sm:justify-end">
        <p className="text-base font-semibold tabular-nums">{unit.price === null ? <span className="text-sm font-medium text-[#a39d92]">Price on request</span> : php(unit.price)}</p>
        {staff && (
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setEditing(true)} className={btn.ghost}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <form
              action={remove}
              onSubmit={(e) => {
                if (!confirm(`Delete "${unit.name}"? This can't be undone.`)) e.preventDefault()
              }}
            >
              <button type="submit" disabled={deleting} aria-label={`Delete ${unit.name}`} className="rounded-md p-2 text-[#a39d92] transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
                {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </form>
          </div>
        )}
      </div>
      {del.error && <p className="w-full text-xs text-red-700 sm:text-right">{del.error}</p>}
    </li>
  )
}

/** Who has a reserved or sold unit: the buyer (admins see the name), the agent and the offer, and who marked it. */
function StatusLine({ slug, status, d }: { slug: string; status: Unit["status"]; d: UnitStatusDetail }) {
  return (
    <p className={`mt-1.5 max-w-2xl border-l-4 py-0.5 pl-2.5 text-sm font-semibold ${status === "sold" ? "border-[#17150f] text-[#17150f]" : "border-amber-500 text-amber-900"}`}>
      <span className="capitalize">{status}</span>
      {d.buyer ? ` to ${d.buyer}` : ""}
      {d.agent ? ` · agent ${d.agent}` : ""}
      {d.offer_id && (
        <>
          {" · "}
          <Link href={`/${slug}/dashboard/offers/${d.offer_id}`} className="underline underline-offset-2 hover:text-[var(--accent)]">
            offer {d.offer_code}
          </Link>
        </>
      )}
      <span className="font-normal text-[#6b665d]">
        {d.by ? ` · marked by ${d.by}` : ""}
        {d.at ? `, ${shortDate(d.at)}` : ""}
      </span>
    </p>
  )
}
