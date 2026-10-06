"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export type PageState = { error?: string; ok?: string }

async function staff(slug: string) {
  const session = await requireRealtyUser(slug)
  if (session.user.role !== "realty") redirect(`/${slug}/dashboard/projects`)
  return session.token
}

/** Everything that changes a public page also changes the public site, so both get revalidated. */
const refresh = (slug: string) => {
  revalidatePath(`/${slug}/dashboard`, "layout")
  revalidatePath("/", "layout")
}

/** Browser forms send several files under one name; Laravel wants `name[]`. Empty inputs are dropped. */
function files(fd: FormData, from: string, to: string, out: FormData) {
  for (const f of fd.getAll(from)) if (f instanceof File && f.size > 0) out.append(to, f)
}

export async function savePageSettings(slug: string, projectId: number, _: PageState, fd: FormData): Promise<PageState> {
  const token = await staff(slug)
  const body = {
    slug: String(fd.get("slug") ?? "").trim().toLowerCase() || undefined,
    region: String(fd.get("region") ?? "").trim() || null,
    stage: String(fd.get("stage") ?? "").trim() || null,
    official_url: String(fd.get("official_url") ?? "").trim() || null,
    is_public: fd.get("is_public") === "on",
    amenities: String(fd.get("amenities") ?? ""),
  }
  try {
    await api(`/realty/projects/${projectId}/page`, { method: "POST", token, body })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: body.is_public ? "Saved. The page is live." : "Saved. The page is hidden until you publish it." }
}

export async function addPageMedia(slug: string, projectId: number, kind: "hero" | "plan", _: PageState, fd: FormData): Promise<PageState> {
  const token = await staff(slug)
  const out = new FormData()
  out.append("kind", kind)
  files(fd, "files", "files[]", out)
  if (!out.has("files[]")) return { error: "Choose at least one image." }
  try {
    await api(`/realty/projects/${projectId}/page/media`, { method: "POST", token, body: out })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: kind === "hero" ? "Hero photos added." : "Site plan added." }
}

export async function removePageMedia(slug: string, projectId: number, kind: "hero" | "plan", url: string): Promise<void> {
  const token = await staff(slug)
  await api(`/realty/projects/${projectId}/page/media/remove`, { method: "POST", token, body: { kind, url } }).catch(() => {})
  refresh(slug)
}

export async function saveUnitType(slug: string, projectId: number, unitTypeId: number | null, _: PageState, fd: FormData): Promise<PageState> {
  const token = await staff(slug)
  const out = new FormData()
  for (const k of ["name", "usable_floor_area", "typical_floor_area", "bedrooms", "baths", "floors", "parking"]) out.append(k, String(fd.get(k) ?? ""))
  files(fd, "images", "images[]", out)
  for (const r of fd.getAll("remove")) out.append("remove[]", String(r))
  if (!out.get("name")) return { error: "Give the model a name." }
  try {
    await api(unitTypeId ? `/realty/unit-types/${unitTypeId}` : `/realty/projects/${projectId}/unit-types`, { method: "POST", token, body: out })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: unitTypeId ? "Model saved." : "Model added." }
}

export async function deleteUnitType(slug: string, unitTypeId: number): Promise<void> {
  const token = await staff(slug)
  await api(`/realty/unit-types/${unitTypeId}`, { method: "DELETE", token }).catch(() => {})
  refresh(slug)
}

export async function addUpdatePhotos(slug: string, projectId: number, _: PageState, fd: FormData): Promise<PageState> {
  const token = await staff(slug)
  const out = new FormData()
  const month = String(fd.get("month") ?? "")
  if (!/^\d{4}-\d{2}$/.test(month)) return { error: "Pick the month." }
  out.append("month", month)
  const label = String(fd.get("label") ?? "").trim()
  if (label) out.append("label", label)
  files(fd, "photos", "photos[]", out)
  if (!out.has("photos[]")) return { error: "Choose at least one photo." }
  try {
    await api(`/realty/projects/${projectId}/updates`, { method: "POST", token, body: out })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh(slug)
  return { ok: `Photos added to ${month}.` }
}

export async function removeUpdatePhoto(slug: string, updateId: number, url: string): Promise<void> {
  const token = await staff(slug)
  await api(`/realty/updates/${updateId}/remove-photo`, { method: "POST", token, body: { url } }).catch(() => {})
  refresh(slug)
}

export async function deleteUpdateMonth(slug: string, updateId: number): Promise<void> {
  const token = await staff(slug)
  await api(`/realty/updates/${updateId}`, { method: "DELETE", token }).catch(() => {})
  refresh(slug)
}
