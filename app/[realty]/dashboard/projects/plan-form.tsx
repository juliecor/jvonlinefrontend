"use client"

import { useActionState, useRef, useState } from "react"
import { LoaderCircle, Plus, Trash2 } from "lucide-react"
import { Alert, Label, fieldClass } from "@/components/form"
import { type FormState, createPlan } from "./actions"

type Row = { id: number; label: string; percent: string; days: string }
let nextId = 1
const row = (label = "", percent = "", days = ""): Row => ({ id: nextId++, label, percent, days })

/** Milestones: label, % and days from the purchase date (blank = on completion). Must total 100%. */
export function PlanForm({ slug, projectId }: { slug: string; projectId: number }) {
  const fresh = () => [row("Reservation", "10", "0"), row("On completion", "90", "")]
  const [rows, setRows] = useState<Row[]>(fresh)
  const form = useRef<HTMLFormElement>(null)
  // Reset the rows from inside the action (not an effect) once a plan is saved.
  const [state, submit, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await createPlan(slug, projectId, prev, fd)
    if (result.ok) {
      form.current?.reset()
      setRows(fresh())
    }
    return result
  }, {})
  const total = rows.reduce((s, r) => s + (Number(r.percent) || 0), 0)
  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <form ref={form} action={submit} className="space-y-4">
      <label className="block sm:max-w-sm">
        <Label>Plan name</Label>
        <input name="name" required placeholder="10 / 10 / 10 / 70 · Spot cash · 24 months" className={fieldClass} />
      </label>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              <th className="pb-2 pr-3">Milestone</th>
              <th className="pb-2 pr-3 w-24">%</th>
              <th className="pb-2 pr-3 w-40">Days after purchase</th>
              <th className="pb-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-1 pr-3"><input name="label" required value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} placeholder="Within 30 days" className={`${fieldClass} mt-0`} /></td>
                <td className="py-1 pr-3"><input name="percent" type="number" step="0.01" min="0.01" max="100" required value={r.percent} onChange={(e) => update(r.id, { percent: e.target.value })} className={`${fieldClass} mt-0`} /></td>
                <td className="py-1 pr-3"><input name="days" type="number" min="0" value={r.days} onChange={(e) => update(r.id, { days: e.target.value })} placeholder="blank = on completion" className={`${fieldClass} mt-0`} /></td>
                <td className="py-1">
                  <button type="button" aria-label="Remove milestone" disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-30">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setRows((rs) => [...rs, row()])} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900">
          <Plus className="h-3.5 w-3.5" /> Add milestone
        </button>
        <span className={`text-sm font-medium ${Math.abs(total - 100) < 0.01 ? "text-emerald-700" : "text-amber-700"}`}>Total {total.toLocaleString("en-PH", { maximumFractionDigits: 2 })}%</span>
      </div>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      {state.ok && <Alert kind="success">{state.ok}</Alert>}
      <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add payment plan
      </button>
    </form>
  )
}
