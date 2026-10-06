"use client"

import { useActionState } from "react"
import { LoaderCircle } from "lucide-react"
import { Alert, Label, fieldClass } from "@/components/form"
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
        <span className="mt-1 block text-xs text-slate-500">Used for &quot;on completion&quot; payments.</span>
      </label>
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
        <input name="cover" type="file" accept="image/*" className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700" />
      </label>
      {project && (
        <label className="block">
          <Label>Status</Label>
          <select name="status" defaultValue={project.status} className={fieldClass}>
            <option value="active">Active</option>
            <option value="archived">Archived (hidden from new offers)</option>
          </select>
        </label>
      )}
      {state.error && <div className="sm:col-span-2"><Alert kind="error">{state.error}</Alert></div>}
      {state.ok && <div className="sm:col-span-2"><Alert kind="success">{state.ok}</Alert></div>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {project ? "Save project" : "Create project"}
        </button>
      </div>
    </form>
  )
}
