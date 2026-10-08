"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Check, Home, LoaderCircle } from "lucide-react"
import { shortDate } from "@/lib/format"
import { type UnitHold, setUnitStatus } from "../actions"

const OPTIONS = [
  { value: "available", label: "Available", on: "bg-emerald-700 text-white" },
  { value: "reserved", label: "Reserved", on: "bg-amber-500 text-[#17150f]" },
  { value: "sold", label: "Sold", on: "bg-[#17150f] text-white" },
] as const

/**
 * The offer's unit: realty admins mark it reserved or sold to this buyer (or
 * available again), and the project's unit list shows who has it. Agents see it.
 */
export function UnitStatusPanel({ slug, offerId, unitName, project, initial, canChange }: { slug: string; offerId: number; unitName: string; project: string | null; initial: UnitHold; canChange: boolean }) {
  const [hold, setHold] = useState(initial)
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string }>({})
  const [pending, start] = useTransition()
  const d = hold.detail
  const heldElsewhere = hold.status !== "available" && !hold.this_offer && !!d?.offer_id

  const change = (status: UnitHold["status"]) =>
    start(async () => {
      const r = await setUnitStatus(slug, offerId, status)
      if (r.hold) setHold(r.hold)
      setMsg(r.error ? { error: r.error } : { ok: true })
    })

  return (
    <section className="mt-4 border border-[#e0dcd5] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#17150f]">
          <Home className="h-4 w-4 text-[var(--accent)]" /> Unit status
        </p>
        <span className="text-sm font-semibold">
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-[#6b665d]"><LoaderCircle className="h-4 w-4 animate-spin" /> Saving</span>
          ) : msg.error ? null : msg.ok ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700"><Check className="h-4 w-4" strokeWidth={3} /> Saved · the project shows it</span>
          ) : null}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="text-base font-bold">
          {unitName}
          {project && <span className="font-semibold text-[#6b665d]"> · {project}</span>}
        </p>
        {canChange && !heldElsewhere ? (
          <div role="group" aria-label="Unit status" className="flex border border-[#d9d4cb] sm:ml-auto">
            {OPTIONS.map((o) => {
              const on = hold.status === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  disabled={pending}
                  onClick={() => !on && change(o.value)}
                  className={`px-4 py-2.5 text-sm font-bold transition disabled:opacity-60 ${on ? o.on : "bg-white text-[#5a554d] hover:bg-[#f6f4f0] hover:text-[#17150f]"}`}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        ) : (
          <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] sm:ml-auto ${OPTIONS.find((o) => o.value === hold.status)?.on}`}>{hold.status}</span>
        )}
      </div>

      {msg.error && <p className="mt-3 text-sm font-bold text-red-700">{msg.error}</p>}
      {hold.status === "available" ? (
        <p className="mt-3 text-sm text-[#6b665d]">{canChange ? "When the buyer reserves or buys, mark it here. The project's unit list will show it's theirs." : "Your realty's admins mark it reserved or sold when the buyer goes ahead."}</p>
      ) : heldElsewhere ? (
        <p className="mt-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900">
          This unit is already {hold.status}
          {d?.buyer ? ` to ${d.buyer}` : ""}
          {d?.agent ? ` through ${d.agent}` : ""} on another offer
          {d?.offer_id && canChange && (
            <>
              {" "}
              (
              <Link href={`/${slug}/dashboard/offers/${d.offer_id}`} className="underline hover:text-[#17150f]">
                offer {d.offer_code}
              </Link>
              )
            </>
          )}
          .
        </p>
      ) : (
        <p className="mt-3 text-sm text-[#3d3a34]">
          <span className="font-bold capitalize">{hold.status}</span>
          {d?.buyer ? ` to ${d.buyer}` : ""}
          {d?.by ? ` · marked by ${d.by}` : ""}
          {d?.at ? `, ${shortDate(d.at)}` : ""}
        </p>
      )}
    </section>
  )
}
