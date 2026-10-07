"use server"

import { revalidatePath } from "next/cache"
import { api, errorMessage } from "@/lib/api"
import { platformToken } from "@/lib/platform-auth"

export type InviteState = { error?: string; sent?: string; url?: string }

/** Create a realty and email it the registration link (platform admins and super admins). */
export async function inviteRealty(_: InviteState, formData: FormData): Promise<InviteState> {
  const token = await platformToken()
  const name = String(formData.get("name") ?? "").trim()
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase()
  const email = String(formData.get("email") ?? "").trim()
  if (!name || !email) return { error: "Name and email are needed." }

  let url: string | undefined
  try {
    const r = await api<{ registration_url?: string }>("/admin/realties", { method: "POST", token, body: { name, email, slug: slug || undefined } })
    url = r.registration_url
  } catch (e) {
    return { error: errorMessage(e) }
  }
  // The realty list shows on /admin and inside super admins' realty dashboards.
  revalidatePath("/", "layout")
  return { sent: `Invite emailed to ${email}. You can also send them this link yourself:`, url }
}

export type ResendState = { error?: string; sent?: string; url?: string }

/** A fresh link for a realty that hasn't registered yet. */
export async function resendInvite(_: ResendState, formData: FormData): Promise<ResendState> {
  const token = await platformToken()
  const id = Number(formData.get("id"))
  if (!id) return { error: "Unknown realty." }
  try {
    const realty = await api<{ email: string; registration_url?: string }>(`/admin/realties/${id}/invite`, { method: "POST", token })
    revalidatePath("/", "layout")
    return { sent: `Sent again to ${realty.email}.`, url: realty.registration_url }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}
