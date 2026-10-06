"use client"

import { useActionState, useRef, useState } from "react"
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react"
import { btn, field } from "@/components/dashboard-ui"
import { Alert, Label } from "@/components/form"
import { type FormState, createPlan, updatePlan } from "./actions"
import type { PaymentPlan } from "./types"

type Row = { id: number; label: string; percent: string; days: string }
let nextId = 1
const row = (label = "", percent = "", days = ""): Row => ({ id: nextId++, label, percent, days })
const fresh = () => [row("Reservation", "10", "0"), row("On completion", "90", "")]
const fromPlan = (p: PaymentPlan) => p.milestones.map((m) => row(m.label, String(m.percent), m.days === null ? "" : String(m.days)))

/**
 * Milestones: label, % and days from the purchase date (blank = on completion). Must total 100%.
 * Add a plan (no `plan`) or edit one; `onDone` closes an inline editor after a save.
 */
export function PlanForm({ slug, projectId, plan, onDone }: { slug: string; projectId: number; plan?: PaymentPlan; onDone?: () => void }) {
  const [rows, setRows] = useState<Row[]>(() => (plan ? fromPlan(plan) : fresh()))
  const form = useRef<HTMLFormElement>(null)
  const action = plan ? updatePlan.bind(null, slug, plan.id) : createPlan.bind(null, slug, projectId)
  // Reset (or close) from inside the action, not an effect, once the plan is saved.
  const [state, submit, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await action(prev, fd)
    if (result.ok) {
      if (plan) onDone?.()
      else {
        form.current?.reset()
        setRows(fresh())
      }
    }
    return result
  }, {})
  const total = rows.reduce((s, r) => s + (Number(r.percent) || 0), 0)
  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <form ref={form} action={submit} className="space-y-4">
      <label className="block sm:max-w-sm">
        <Label>Plan name</Label>
        <input name="name" required defaultValue={plan?.name} placeholder="10 / 10 / 10 / 70 · Spot cash · 24 months" className={field} />
      </label>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8a847a]">
              <th className="pb-2 pr-3">Milestone</th>
              <th className="w-24 pb-2 pr-3">%</th>
              <th className="w-40 pb-2 pr-3">Days after purchase</th>
              <th className="w-10 pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-1 pr-3"><input name="label" required value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} placeholder="Within 30 days" className={`${field} mt-0`} /></td>
                <td className="py-1 pr-3"><input name="percent" type="number" step="0.01" min="0.01" max="100" required value={r.percent} onChange={(e) => update(r.id, { percent: e.target.value })} className={`${field} mt-0`} /></td>
                <td className="py-1 pr-3"><input name="days" type="number" min="0" value={r.days} onChange={(e) => update(r.id, { days: e.target.value })} placeholder="blank = on completion" className={`${field} mt-0`} /></td>
                <td className="py-1">
                  <button type="button" aria-label="Remove milestone" disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} className="rounded-md p-2 text-[#a39d92] hover:bg-[#f6f4f0] hover:text-red-600 disabled:opacity-30">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setRows((rs) => [...rs, row()])} className={btn.ghost}>
          <Plus className="h-3.5 w-3.5" /> Add milestone
        </button>
        <span className={`text-sm font-medium ${Math.abs(total - 100) < 0.01 ? "text-emerald-700" : "text-amber-700"}`}>Total {total.toLocaleString("en-PH", { maximumFractionDigits: 2 })}%</span>
      </div>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      {state.ok && !plan && <Alert kind="success">{state.ok}</Alert>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : plan ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {plan ? "Save plan" : "Add payment plan"}
        </button>
        {plan && onDone && <button type="button" onClick={onDone} className={btn.ghost}>Cancel</button>}
      </div>
    </form>
  )
}
