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

export async function createProject(slug: string, _: FormState, formData: FormData): Promise<FormState> {
  const token = await staff(slug)
  let id: number
  try {
    const p = await api<Project>("/realty/projects", { method: "POST", token, body: tidy(formData, "cover") })
    id = p.id
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard`, "layout")
  redirect(`/${slug}/dashboard/projects/${id}`)
}

export async function updateProject(slug: string, id: number, _: FormState, formData: FormData): Promise<FormState> {
  const token = await staff(slug)
  try {
    await api(`/realty/projects/${id}`, { method: "POST", token, body: tidy(formData, "cover") })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard`, "layout")
  return { ok: "Project saved." }
}

export async function createUnit(slug: string, projectId: number, _: FormState, formData: FormData): Promise<FormState> {
  const token = await staff(slug)
  try {
    await api(`/realty/projects/${projectId}/units`, { method: "POST", token, body: tidy(formData, "floor_plan") })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard`, "layout")
  return { ok: `Unit "${formData.get("name")}" added.` }
}

/** The status dropdown on a unit row. Sends the row's current values along, since the API wants the full unit. */
export async function setUnitStatus(slug: string, unitId: number, formData: FormData): Promise<void> {
  const token = await staff(slug)
  await api(`/realty/units/${unitId}`, { method: "POST", token, body: formData }).catch(() => {})
  revalidatePath(`/${slug}/dashboard`, "layout")
}

export async function createPlan(slug: string, projectId: number, _: FormState, formData: FormData): Promise<FormState> {
  const token = await staff(slug)
  const name = String(formData.get("name") ?? "").trim()
  // Milestone rows come as label[], percent[], days[].
  const labels = formData.getAll("label").map(String)
  const percents = formData.getAll("percent").map(String)
  const days = formData.getAll("days").map(String)
  const milestones = labels
    .map((label, i) => ({ label: label.trim(), percent: Number(percents[i]), days: days[i]?.trim() === "" ? null : Number(days[i]) }))
    .filter((m) => m.label || m.percent)
  if (!name || milestones.length === 0) return { error: "Give the plan a name and at least one milestone." }

  try {
    await api(`/realty/projects/${projectId}/plans`, { method: "POST", token, body: { name, milestones } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard`, "layout")
  return { ok: `Plan "${name}" added.` }
}
