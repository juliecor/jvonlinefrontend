"use server"

import { revalidatePath } from "next/cache"
import { ApiError, api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { can, isDeveloperStaff } from "@/lib/realty-roles"
import type { Point, SiteMapData } from "@/components/site-map/geometry"

export type MapResult = { error?: string; fieldErrors?: Record<string, string>; map?: SiteMapData | null }

/** The developer's admins with Projects draw the map; Laravel checks the same. */
async function staff(slug: string) {
  const session = await requireRealtyUser(slug)
  if (!isDeveloperStaff(session.user) || !can(session.user, "projects")) throw new Error("Only Johndorf's admins with Projects can change the site map.")
  return session.token
}

async function call(slug: string, projectId: number | null, run: (token: string) => Promise<SiteMapData | null>): Promise<MapResult> {
  try {
    const map = await run(await staff(slug))
    revalidatePath(projectId ? `/${slug}/dashboard/projects/${projectId}` : `/${slug}/dashboard/projects`, projectId ? "page" : "layout")
    return { map }
  } catch (e) {
    if (e instanceof ApiError && e.status === 422 && Object.keys(e.errors).length) {
      return { error: Object.values(e.errors)[0][0], fieldErrors: Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])) }
    }
    return { error: e instanceof Error && !(e instanceof ApiError) ? e.message : errorMessage(e) }
  }
}

export type RowInput = { block: string; corners: Point[]; first_lot: number; lot_count: number; unit_type?: string | null; lot_area_sqm?: number | null; area_sqm?: number | null; price?: number | null }
export type LotValues = { unit_type?: string | null; lot_area_sqm?: number | null; area_sqm?: number | null; price?: number | null }

export async function setSiteMapImage(slug: string, projectId: number, image: string) {
  return call(slug, projectId, (token) => api<SiteMapData>(`/realty/projects/${projectId}/site-map/image`, { method: "POST", token, body: { image } }))
}

export async function addSiteRow(slug: string, projectId: number, row: RowInput) {
  return call(slug, projectId, (token) => api<SiteMapData>(`/realty/projects/${projectId}/site-map/rows`, { method: "POST", token, body: row }))
}

export async function moveSiteRow(slug: string, projectId: number, rowId: number, corners: Point[]) {
  return call(slug, projectId, (token) => api<SiteMapData>(`/realty/site-rows/${rowId}`, { method: "POST", token, body: { corners } }))
}

/** Every lot in the row gets these values (only the ones given). */
export async function applyToSiteRow(slug: string, projectId: number, rowId: number, values: LotValues) {
  return call(slug, projectId, (token) => api<SiteMapData>(`/realty/site-rows/${rowId}/apply`, { method: "POST", token, body: values }))
}

export async function removeSiteRow(slug: string, projectId: number, rowId: number): Promise<MapResult & { kept?: number }> {
  let kept = 0
  const r = await call(slug, projectId, async (token) => {
    const res = await api<{ kept: number; site_map: SiteMapData | null }>(`/realty/site-rows/${rowId}`, { method: "DELETE", token })
    kept = res.kept
    return res.site_map
  })
  return { ...r, kept }
}

export type LotInput = { name: string; unit_type: string | null; lot_area_sqm: number | null; area_sqm: number | null; price: number | null; status: string; tags: string[] }

/** One lot's details (it is a unit): its model, areas, price, status and what makes it special. */
export async function saveLot(slug: string, projectId: number, unitId: number, lot: LotInput): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  const r = await call(slug, projectId, async (token) => {
    await api(`/realty/units/${unitId}`, { method: "POST", token, body: lot })
    return null
  })
  return { error: r.error, fieldErrors: r.fieldErrors }
}
