"use client"

import { useActionState, useRef, useState } from "react"
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react"
import { btn, field } from "@/components/dashboard-ui"
import { Alert, Label } from "@/components/form"
import { type FormState, createPlan, updatePlan } from "./actions"
import type { PaymentPlan } from "./types"

type Row = { id: number; label: string; percent: string; days: string; months: string }
let nextId = 1
const row = (label = "", percent = "", days = "", months = ""): Row => ({ id: nextId++, label, percent, days, months })
const fresh = () => [row("Reservation", "10", "0"), row("On completion", "90", "")]
const cols = "@2xl:grid-cols-[minmax(0,1fr)_6rem_10rem_8rem_2.75rem] @2xl:gap-3"
const small = "mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b665d] @2xl:hidden"
const fromPlan = (p: PaymentPlan) => p.milestones.map((m) => row(m.label, String(m.percent), m.days === null ? "" : String(m.days), m.months ? String(m.months) : ""))

/**
 * Milestones: label, % and days from the purchase date (blank = on completion), and optionally
 * the number of monthly payments it is spread over (the first is due on that day). Must total 100%.
 * Add a plan (no `plan`) or edit one; `onDone` closes the editor or the add dialog after a save.
 */
export function PlanForm({ slug, projectId, plan, onDone }: { slug: string; projectId: number; plan?: PaymentPlan; onDone?: () => void }) {
  const [rows, setRows] = useState<Row[]>(() => (plan ? fromPlan(plan) : fresh()))
  const form = useRef<HTMLFormElement>(null)
  const action = plan ? updatePlan.bind(null, slug, plan.id) : createPlan.bind(null, slug, projectId)
  // Reset (or close) from inside the action, not an effect, once the plan is saved.
  const [state, submit, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await action(prev, fd)
    if (result.ok) {
      if (onDone) onDone()
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
      {/* Columns when there's room; a small card per milestone in a narrow space (a phone). */}
      <div className="@container">
        <div className={`hidden pb-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8a847a] @2xl:grid ${cols}`}>
          <span>Milestone</span>
          <span>%</span>
          <span>Days after purchase</span>
          <span>Monthly payments</span>
        </div>
        <div className="space-y-3 @2xl:space-y-2">
          {rows.map((r, i) => (
            <div key={r.id} className={`grid grid-cols-2 items-end gap-3 border border-[#e6e2db] p-3 @2xl:items-center @2xl:border-0 @2xl:p-0 ${cols}`}>
              <label className="col-span-2 block @2xl:col-span-1">
                <span className={small}>Milestone {i + 1}</span>
                <input name="label" required value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} placeholder="Within 30 days" className={`${field} mt-0`} />
              </label>
              <label className="block">
                <span className={small}>%</span>
                <input name="percent" type="number" step="0.01" min="0.01" max="100" required value={r.percent} onChange={(e) => update(r.id, { percent: e.target.value })} className={`${field} mt-0`} />
              </label>
              <label className="block">
                <span className={small}>Days after purchase</span>
                <input name="days" type="number" min="0" value={r.days} onChange={(e) => update(r.id, { days: e.target.value })} placeholder="on completion" className={`${field} mt-0`} />
              </label>
              <label className="block">
                <span className={small}>Monthly payments</span>
                <input name="months" type="number" min="1" max="120" value={r.months} onChange={(e) => update(r.id, { months: e.target.value })} placeholder="once" title="Spread over this many monthly payments; the first is due on the day before" className={`${field} mt-0`} />
              </label>
              <button type="button" aria-label={`Remove milestone ${i + 1}`} disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} className="flex h-[46px] items-center justify-center self-end text-[#a39d92] hover:bg-[#f6f4f0] hover:text-red-600 disabled:opacity-30 @2xl:self-auto">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setRows((rs) => [...rs, row()])} className={btn.ghost}>
          <Plus className="h-3.5 w-3.5" /> Add milestone
        </button>
        <span className={`text-sm font-medium ${Math.abs(total - 100) < 0.01 ? "text-emerald-700" : "text-amber-700"}`}>Total {total.toLocaleString("en-PH", { maximumFractionDigits: 2 })}%</span>
      </div>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      {state.ok && !plan && <Alert kind="success">{state.ok}</Alert>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : plan ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {plan ? "Save plan" : "Add payment plan"}
        </button>
        {onDone && <button type="button" onClick={onDone} className={plan ? btn.ghost : "px-3 py-3 text-[15px] font-semibold text-[#6b665d] transition hover:text-[#17150f]"}>Cancel</button>}
      </div>
    </form>
  )
}
