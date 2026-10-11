"use server"

import { revalidatePath } from "next/cache"
import { ApiError, api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { isBroker } from "@/lib/realty-roles"

/** The signed and notarized agreement → Laravel, for the developer to check. A new upload replaces the last one. */
export async function uploadSignedCopy(slug: string, formData: FormData): Promise<{ error?: string }> {
  const { user, token } = await requireRealtyUser(slug)
  if (!isBroker(user) || user.role !== "realty") return { error: "Only an accredited realty's admins can upload this." }
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) return { error: "Choose the scanned agreement first." }

  const body = new FormData()
  body.set("file", file)
  try {
    await api("/realty/accreditation/signed-copy", {
      method: "POST",
      token,
      body,
    })
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { error: Object.values(e.errors)[0]?.[0] ?? e.message }
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard/accreditation`)
  return {}
}
