"use server"

import { revalidatePath } from "next/cache"
import { ApiError, api, errorMessage } from "@/lib/api"
import { requireSection } from "@/lib/realty-auth"

/** errors: Laravel's, one message per field. */
export type StaffResult = { error?: string; errors?: Record<string, string> }
export type Access = { access: "full" | "sections"; sections: string[] }

async function call(slug: string, path: string, method: "POST" | "DELETE", body?: unknown): Promise<StaffResult> {
  const { token } = await requireSection(slug, "staff")
  try {
    await api(`/realty/staff${path}`, { method, token, body })
  } catch (e) {
    if (e instanceof ApiError && Object.keys(e.errors).length) return { errors: Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k.replace(/\.\d+$/, ""), v[0]])) }
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard/staff`)
  return {}
}

export async function addStaff(slug: string, person: { name: string; email: string; phone: string; password: string; must_change_password: boolean } & Access): Promise<StaffResult> {
  return call(slug, "", "POST", { ...person, phone: person.phone || null })
}

export async function setAccess(slug: string, id: number, access: Access): Promise<StaffResult> {
  return call(slug, `/${id}/access`, "POST", access)
}

export async function resetPassword(slug: string, id: number, password: string, mustChange: boolean): Promise<StaffResult> {
  return call(slug, `/${id}/password`, "POST", { password, must_change_password: mustChange })
}

export async function setStatus(slug: string, id: number, status: "active" | "disabled"): Promise<StaffResult> {
  return call(slug, `/${id}/status`, "POST", { status })
}

export async function deleteStaff(slug: string, id: number): Promise<StaffResult> {
  return call(slug, `/${id}`, "DELETE")
}
