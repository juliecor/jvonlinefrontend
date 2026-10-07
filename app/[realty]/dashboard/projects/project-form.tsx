"use client"

import { useActionState } from "react"
import { LoaderCircle } from "lucide-react"
import { btn, field as fieldClass } from "@/components/dashboard-ui"
import { Alert, Label } from "@/components/form"
import { type FormState, createProject, updateProject } from "./actions"
import type { Project } from "./types"

/** Create (no `project`) or edit a project. */
export function ProjectForm({ slug, project }: { slug: string; project?: Project }) {
  const action = project ? updateProject.bind(null, slug, project.id) : createProject.bind(null, slug)
  const [state, submit, pending] = useActionState<FormState, FormData>(action, {})

  return (
    <form action={submit} className="grid gap-5 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <Label>Project name</Label>
        <input name="name" required defaultValue={project?.name} placeholder="e.g. Montierra" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Location</Label>
        <input name="location" defaultValue={project?.location ?? ""} placeholder="City / province" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Turnover / completion date</Label>
        <input name="completion_date" type="date" defaultValue={project?.completion_date ?? ""} className={fieldClass} />
        <span className="mt-1 block text-xs text-[#8a847a]">Used for &quot;on completion&quot; payments.</span>
      </label>
      <div className="grid grid-cols-2 gap-5 sm:col-span-2 sm:max-w-md">
        <label className="block">
          <Label>Map pin — latitude</Label>
          <input name="lat" type="number" step="any" min="-90" max="90" defaultValue={project?.lat ?? ""} placeholder="8.4292355" className={fieldClass} />
        </label>
        <label className="block">
          <Label>Longitude</Label>
          <input name="lng" type="number" step="any" min="-180" max="180" defaultValue={project?.lng ?? ""} placeholder="124.6203083" className={fieldClass} />
        </label>
        <span className="col-span-2 -mt-3 text-xs text-[#8a847a]">Right-click the spot in Google Maps and copy the two numbers. Shown as a map on every offer.</span>
      </div>
      <label className="block sm:col-span-2">
        <Label>Description (optional)</Label>
        <textarea name="description" rows={3} defaultValue={project?.description ?? ""} placeholder="What buyers should know about the project." className={fieldClass} />
      </label>
      <label className="block sm:col-span-2">
        <Label>Fee notes shown on every offer (optional)</Label>
        <textarea name="fee_notes" rows={2} defaultValue={project?.fee_notes ?? ""} placeholder="e.g. Transfer fees and documentary stamps are for the buyer's account. Prices may change without notice." className={fieldClass} />
      </label>
      <label className="block">
        <Label>Cover photo{project?.cover_url ? " (replace)" : ""}</Label>
        <input name="cover" type="file" accept="image/*" className="mt-1.5 block w-full text-sm text-[#6b665d] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
      </label>
      {!project && (
        <label className="block">
          <Label>Site plan image (optional)</Label>
          <input name="site_plans" type="file" accept="image/*" multiple className="mt-1.5 block w-full text-sm text-[#6b665d] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
          <span className="mt-1 block text-xs text-[#8a847a]">The drawn layout of lots and roads. Shown on every offer; you can add more later.</span>
        </label>
      )}
      {state.error && <div className="sm:col-span-2"><Alert kind="error">{state.error}</Alert></div>}
      {state.ok && <div className="sm:col-span-2"><Alert kind="success">{state.ok}</Alert></div>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {project ? "Save project" : "Create project"}
        </button>
      </div>
    </form>
  )
}
