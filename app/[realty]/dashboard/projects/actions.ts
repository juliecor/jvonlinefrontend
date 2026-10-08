"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import type { Project } from "./types"

export type FormState = { error?: string; ok?: string }

/** Drops the empty File an untouched file input sends, so Laravel doesn't see an invalid image. */
const tidy = (fd: FormData, field: string) => {
  const f = fd.get(field)
  if (f instanceof File && f.size === 0) fd.delete(field)
  return fd
}

async function staff(slug: string) {
  const session = await requireRealtyUser(slug)
  if (session.user.role !== "realty") redirect(`/${slug}/dashboard/projects`)
  return session.token
}

const refresh = (slug: string) => revalidatePath(`/${slug}/dashboard`, "layout")

export async function createProject(slug: string, _: FormState, formData: FormData): Promise<FormState> {
  const token = await staff(slug)
  // Site plans are saved with the project's page, right after the project exists.
  const plans = formData.getAll("site_plans").filter((f): f is File => f instanceof File && f.size > 0)
  formData.delete("site_plans")
  let id: number
  try {
    const p = await api<Project>("/realty/projects", { method: "POST", token, body: tidy(formData, "cover") })
    id = p.id
  } catch (e) {
    return { error: errorMessage(e) }
  }
  let planError = ""
  if (plans.length) {
    const media = new FormData()
    media.append("kind", "plan")
    for (const f of plans) media.append("files[]", f)
    await api(`/realty/projects/${id}/page/media`, { method: "POST", token, body: media }).catch((e) => (planError = errorMessage(e)))
  }
  refresh(slug)
  redirect(`/${slug}/dashboard/projects/${id}${planError ? `?plan_error=${encodeURIComponent(planError)}#website` : ""}`)
}

export async function updateProject(slug: string, id: number, _: FormState, formData: FormData): Promise<FormState> {
  const token = await staff(slug)
  try {
    await api(`/realty/projects/${id}`, { method: "POST", token, body: tidy(formData, "cover") })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: "Project saved." }
}

/* ─── Units ─── */

export async function createUnit(slug: string, projectId: number, _: FormState, formData: FormData): Promise<FormState> {
  const token = await staff(slug)
  try {
    await api(`/realty/projects/${projectId}/units`, { method: "POST", token, body: tidy(formData, "floor_plan") })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: `Unit "${formData.get("name")}" added.` }
}

export async function updateUnit(slug: string, unitId: number, _: FormState, formData: FormData): Promise<FormState> {
  const token = await staff(slug)
  try {
    await api(`/realty/units/${unitId}`, { method: "POST", token, body: tidy(formData, "floor_plan") })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: "Unit saved." }
}

export async function deleteUnit(slug: string, unitId: number): Promise<FormState> {
  const token = await staff(slug)
  try {
    await api(`/realty/units/${unitId}`, { method: "DELETE", token })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: "Unit deleted." }
}

/* ─── Payment plans ─── */

/** Milestone rows come as label[], percent[], days[], months[] (blank months = one payment). */
function milestonesFrom(formData: FormData) {
  const labels = formData.getAll("label").map(String)
  const percents = formData.getAll("percent").map(String)
  const days = formData.getAll("days").map(String)
  const months = formData.getAll("months").map(String)
  return labels
    .map((label, i) => ({ label: label.trim(), percent: Number(percents[i]), days: days[i]?.trim() === "" ? null : Number(days[i]), months: Number(months[i]) >= 2 ? Number(months[i]) : null }))
    .filter((m) => m.label || m.percent)
}

export async function createPlan(slug: string, projectId: number, _: FormState, formData: FormData): Promise<FormState> {
  const token = await staff(slug)
  const name = String(formData.get("name") ?? "").trim()
  const milestones = milestonesFrom(formData)
  if (!name || milestones.length === 0) return { error: "Give the plan a name and at least one milestone." }
  try {
    await api(`/realty/projects/${projectId}/plans`, { method: "POST", token, body: { name, milestones } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: `Plan "${name}" added.` }
}

export async function updatePlan(slug: string, planId: number, _: FormState, formData: FormData): Promise<FormState> {
  const token = await staff(slug)
  const name = String(formData.get("name") ?? "").trim()
  const milestones = milestonesFrom(formData)
  if (!name || milestones.length === 0) return { error: "Give the plan a name and at least one milestone." }
  try {
    await api(`/realty/plans/${planId}`, { method: "POST", token, body: { name, milestones } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: "Plan saved." }
}

export async function deletePlan(slug: string, planId: number): Promise<FormState> {
  const token = await staff(slug)
  try {
    await api(`/realty/plans/${planId}`, { method: "DELETE", token })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: "Plan deleted." }
}
