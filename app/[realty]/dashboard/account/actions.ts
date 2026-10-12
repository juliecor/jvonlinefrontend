"use server"

import { revalidatePath } from "next/cache"
import type { AccountState } from "@/components/account-settings"
import { saveAccount } from "@/lib/account"
import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export async function saveDetails(slug: string, _prev: AccountState, form: FormData): Promise<AccountState> {
  const { token } = await requireRealtyUser(slug)
  const result = await saveAccount(token, "details", form)
  // The sidebar shows the name and email.
  if (result.ok) revalidatePath(`/${slug}/dashboard`, "layout")
  return result
}

export async function changePassword(slug: string, _prev: AccountState, form: FormData): Promise<AccountState> {
  const { token } = await requireRealtyUser(slug)
  return saveAccount(token, "password", form)
}

export type PhotoResult = { error?: string; photo?: string | null }

/** A new profile photo (shown at the top of the sidebar). */
export async function uploadPhoto(slug: string, fd: FormData): Promise<PhotoResult> {
  const { token } = await requireRealtyUser(slug)
  const file = fd.get("photo")
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo." }
  const body = new FormData()
  body.append("photo", file)
  try {
    const r = await api<{ photo_url: string | null }>("/account/photo", { method: "POST", token, body })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { photo: r.photo_url }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

/** Back to initials. */
export async function removePhoto(slug: string): Promise<PhotoResult> {
  const { token } = await requireRealtyUser(slug)
  try {
    await api("/account/photo", { method: "DELETE", token })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { photo: null }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}
