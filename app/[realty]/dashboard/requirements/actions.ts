"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export type ReqTypeState = { error?: string; ok?: string }

async function staff(slug: string) {
  const session = await requireRealtyUser(slug)
  if (session.user.role !== "realty") redirect(`/${slug}/dashboard`)
  return session.token
}

const refresh = (slug: string) => revalidatePath(`/${slug}/dashboard`, "layout")

/** Add (id null) or edit one checklist item. */
export async function saveRequirement(slug: string, id: number | null, _: ReqTypeState, fd: FormData): Promise<ReqTypeState> {
  const token = await staff(slug)
  const body = {
    name: String(fd.get("name") ?? "").trim(),
    help: String(fd.get("help") ?? "").trim() || null,
    applies: String(fd.get("applies") ?? "all"),
    ...(id ? { active: fd.get("active") !== "off" } : {}),
  }
  if (!body.name) return { error: "Give it a name, e.g. Valid government ID." }
  try {
    await api(id ? `/realty/requirements/${id}` : "/realty/requirements", { method: "POST", token, body })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: id ? "Saved." : `"${body.name}" added. Buyers see it on their offers right away.` }
}

export async function setRequirementActive(slug: string, item: { id: number; name: string; help: string | null; applies: string }, active: boolean): Promise<void> {
  const token = await staff(slug)
  await api(`/realty/requirements/${item.id}`, { method: "POST", token, body: { name: item.name, help: item.help, applies: item.applies, active } }).catch(() => {})
  refresh(slug)
}

export async function moveRequirement(slug: string, id: number, direction: "up" | "down"): Promise<void> {
  const token = await staff(slug)
  await api(`/realty/requirements/${id}/move`, { method: "POST", token, body: { direction } }).catch(() => {})
  refresh(slug)
}

export async function deleteRequirement(slug: string, id: number): Promise<ReqTypeState> {
  const token = await staff(slug)
  try {
    await api(`/realty/requirements/${id}`, { method: "DELETE", token })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: "Deleted." }
}
