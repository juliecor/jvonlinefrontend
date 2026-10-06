"use client"

import { useActionState, useEffect, useRef } from "react"
import { LoaderCircle, Plus } from "lucide-react"
import { Alert, Label, fieldClass } from "@/components/form"
import { type FormState, createUnit } from "./actions"

export function UnitForm({ slug, projectId }: { slug: string; projectId: number }) {
  const [state, submit, pending] = useActionState<FormState, FormData>(createUnit.bind(null, slug, projectId), {})
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.ok) form.current?.reset()
  }, [state])

  return (
    <form ref={form} action={submit} className="grid gap-4 sm:grid-cols-3">
      <label className="block">
        <Label>Unit name</Label>
        <input name="name" required placeholder="Unit 415 · Lot 12, Block 3" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Type</Label>
        <input name="unit_type" placeholder="1 Bedroom · Townhouse · Lot only" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Category</Label>
        <select name="category" defaultValue="Residential" className={fieldClass}>
          <option>Residential</option>
          <option>Commercial</option>
        </select>
      </label>
      <label className="block">
        <Label>Floor / phase (optional)</Label>
        <input name="floor" placeholder="4th floor · Phase 2" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Area (sqm)</Label>
        <input name="area_sqm" type="number" step="0.01" min="0" placeholder="67.15" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Price (₱)</Label>
        <input name="price" type="number" step="1" min="0" required placeholder="4850000" className={fieldClass} />
      </label>
      <label className="block sm:col-span-2">
        <Label>Floor plan image (optional)</Label>
        <input name="floor_plan" type="file" accept="image/*" className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700" />
      </label>
      <label className="block">
        <Label>Notes (optional)</Label>
        <input name="notes" placeholder="Corner unit, lagoon view…" className={fieldClass} />
      </label>
      {state.error && <div className="sm:col-span-3"><Alert kind="error">{state.error}</Alert></div>}
      {state.ok && <div className="sm:col-span-3"><Alert kind="success">{state.ok}</Alert></div>}
      <div className="sm:col-span-3">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add unit
        </button>
      </div>
    </form>
  )
}
