"use server"

import { revalidatePath } from "next/cache"
import { api, errorMessage } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"

export type InviteState = { error?: string; sent?: string }

/** Create a realty and email it the registration link. */
export async function inviteRealty(_: InviteState, formData: FormData): Promise<InviteState> {
  const { token } = await requireAdmin()
  const name = String(formData.get("name") ?? "").trim()
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase()
  const email = String(formData.get("email") ?? "").trim()
  if (!name || !email) return { error: "Name and email are needed." }

  try {
    await api("/admin/realties", { method: "POST", token, body: { name, email, slug: slug || undefined } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath("/admin/realties")
  revalidatePath("/admin")
  return { sent: `Invite sent to ${email}.` }
}

export type ResendState = { error?: string; sent?: string }

/** A fresh link for a realty that hasn't registered yet. */
export async function resendInvite(_: ResendState, formData: FormData): Promise<ResendState> {
  const { token } = await requireAdmin()
  const id = Number(formData.get("id"))
  if (!id) return { error: "Unknown realty." }
  try {
    const realty = await api<{ email: string }>(`/admin/realties/${id}/invite`, { method: "POST", token })
    revalidatePath("/admin/realties")
    return { sent: `Sent again to ${realty.email}.` }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}
