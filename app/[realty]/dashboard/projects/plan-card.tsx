"use client"

import { useActionState, useState } from "react"
import { LoaderCircle, Pencil, Trash2 } from "lucide-react"
import { btn } from "@/components/dashboard-ui"
import { confirmSubmit, toast } from "@/components/feedback"
import { type FormState, deletePlan } from "./actions"
import { PlanForm } from "./plan-form"
import type { PaymentPlan } from "./types"

/** One payment plan; staff can edit it in place or delete it (existing offers keep their own copy). */
export function PlanCard({ slug, projectId, plan, staff }: { slug: string; projectId: number; plan: PaymentPlan; staff: boolean }) {
  const [editing, setEditing] = useState(false)
  const [del, remove, deleting] = useActionState<FormState>(async () => {
    const r = await deletePlan(slug, plan.id)
    if (!r.error) toast(`Plan "${plan.name}" deleted`)
    return r
  }, {})

  if (editing) {
    return (
      <li className="py-5 sm:col-span-2">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Editing {plan.name}</p>
        <PlanForm slug={slug} projectId={projectId} plan={plan} onDone={() => setEditing(false)} />
      </li>
    )
  }

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">{plan.name}</p>
        {staff && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={() => setEditing(true)} className={btn.ghost}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <form
              action={remove}
              onSubmit={confirmSubmit({ title: `Delete the plan "${plan.name}"?`, body: "Agents can't pick it for new offers anymore. Offers already sent keep their own schedule.", confirm: "Delete plan", danger: true })}
            >
              <button type="submit" disabled={deleting} aria-label={`Delete ${plan.name}`} className="rounded-md p-2 text-[#a39d92] transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
                {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </form>
          </div>
        )}
      </div>
      <ol className="mt-2 space-y-1 text-sm text-[#6b665d]">
        {plan.milestones.map((m, i) => (
          <li key={i} className="flex justify-between gap-3">
            <span>
              {m.label}
              {m.days !== null && m.days > 0 ? <span className="text-[#a39d92]"> · {m.days} days</span> : m.days === null ? <span className="text-[#a39d92]"> · on completion</span> : null}
              {m.months ? <span className="text-[#a39d92]"> · {m.months} monthly payments</span> : null}
            </span>
            <span className="font-medium tabular-nums">{Number(m.percent.toFixed(2))}%</span>
          </li>
        ))}
      </ol>
      {del.error && <p className="mt-2 text-xs text-red-700">{del.error}</p>}
    </li>
  )
}
