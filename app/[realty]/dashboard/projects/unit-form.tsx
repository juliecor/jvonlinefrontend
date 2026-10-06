"use client"

import { useActionState, useEffect, useRef } from "react"
import { LoaderCircle, Plus, Save } from "lucide-react"
import { btn, field } from "@/components/dashboard-ui"
import { Alert, Label } from "@/components/form"
import { type FormState, createUnit, updateUnit } from "./actions"
import type { Unit } from "./types"

const fileInput = "mt-1.5 block w-full text-sm text-[#6b665d] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"

/** Add a unit (no `unit`) or edit one. `onDone` closes an inline editor after a save. */
export function UnitForm({ slug, projectId, unit, onDone }: { slug: string; projectId: number; unit?: Unit; onDone?: () => void }) {
  const action = unit ? updateUnit.bind(null, slug, unit.id) : createUnit.bind(null, slug, projectId)
  const [state, submit, pending] = useActionState<FormState, FormData>(action, {})
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (!state.ok) return
    if (unit) onDone?.()
    else form.current?.reset()
  }, [state, unit, onDone])

  return (
    <form ref={form} action={submit} className="grid gap-4 sm:grid-cols-3">
      <label className="block">
        <Label>Unit name</Label>
        <input name="name" required defaultValue={unit?.name} placeholder="Unit 415 · Lot 12, Block 3" className={field} />
      </label>
      <label className="block">
        <Label>Type</Label>
        <input name="unit_type" defaultValue={unit?.unit_type ?? ""} placeholder="1 Bedroom · Townhouse · Lot only" className={field} />
      </label>
      <label className="block">
        <Label>Category</Label>
        <select name="category" defaultValue={unit?.category ?? "Residential"} className={field}>
          <option>Residential</option>
          <option>Commercial</option>
        </select>
      </label>
      <label className="block">
        <Label>Floor / phase (optional)</Label>
        <input name="floor" defaultValue={unit?.floor ?? ""} placeholder="4th floor · Phase 2" className={field} />
      </label>
      <label className="block">
        <Label>Area (sqm)</Label>
        <input name="area_sqm" type="number" step="0.01" min="0" defaultValue={unit?.area_sqm ?? ""} placeholder="67.15" className={field} />
      </label>
      <label className="block">
        <Label>Price (₱) — blank = price on request</Label>
        <input name="price" type="number" step="1" min="0" defaultValue={unit?.price ? Number(unit.price) : ""} placeholder="4850000" className={field} />
      </label>
      {unit && (
        <label className="block">
          <Label>Status</Label>
          <select name="status" defaultValue={unit.status} className={field}>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </label>
      )}
      <label className={`block ${unit ? "sm:col-span-2" : "sm:col-span-2"}`}>
        <Label>Floor plan image{unit?.floor_plan_url ? " (replace)" : " (optional)"}</Label>
        <input name="floor_plan" type="file" accept="image/*" className={fileInput} />
      </label>
      <label className="block sm:col-span-3">
        <Label>Notes (optional)</Label>
        <input name="notes" defaultValue={unit?.notes ?? ""} placeholder="Corner unit, lagoon view… / where the price comes from" className={field} />
      </label>
      {state.error && <div className="sm:col-span-3"><Alert kind="error">{state.error}</Alert></div>}
      {state.ok && !unit && <div className="sm:col-span-3"><Alert kind="success">{state.ok}</Alert></div>}
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : unit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {unit ? "Save unit" : "Add unit"}
        </button>
        {unit && onDone && (
          <button type="button" onClick={onDone} className={btn.ghost}>Cancel</button>
        )}
      </div>
    </form>
  )
}
