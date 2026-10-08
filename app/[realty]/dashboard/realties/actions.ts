"use server"

import { revalidatePath } from "next/cache"
import { api, errorMessage } from "@/lib/api"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { requireRealtyUser } from "@/lib/realty-auth"

/** What an invite or a resend gives back: the link too, in case the email can't be sent. */
type Sent = { id: number; email: string; expires_at: string; emailed: boolean; accreditation_url: string }

/** The login handed over to an accepted realty. `temporary_password` is only there when the email couldn't be sent. */
export type LoginResult = { realty: { id: number; name: string; slug: string }; username: string; login_url: string; emailed: boolean; temporary_password: string | null }

async function staff(slug: string) {
  const session = await requireRealtyUser(slug)
  return isDeveloperStaff(session.user) ? session : null
}

export type InviteRealtyState = { error?: string; sent?: Sent }

/** Johndorf's admin invites a realty by email: it gets a link to the accreditation form. */
export async function inviteRealty(slug: string, _: InviteRealtyState, formData: FormData): Promise<InviteRealtyState> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can invite realties." }
  const email = String(formData.get("email") ?? "").trim()
  if (!email) return { error: "Enter the email address to send the invite to." }

  try {
    const sent = await api<Sent>("/realty/realties/invite", { method: "POST", token: session.token, body: { email } })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { sent }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

/** A fresh link for an invite that was not filled in; the old one stops working. */
export async function resendInvite(slug: string, id: number): Promise<{ error?: string; sent?: Sent }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can resend invites." }
  try {
    const sent = await api<Sent>(`/realty/realties/invitations/${id}/resend`, { method: "POST", token: session.token })
    revalidatePath(`/${slug}/dashboard/realties`)
    return { sent }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

/** Accept: makes the broker realty and mails its login. The sidebar's "to review" count updates with it. */
export async function acceptAccreditation(slug: string, id: number): Promise<{ error?: string; login?: LoginResult }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can accept a realty." }
  try {
    const login = await api<LoginResult>(`/realty/realties/accreditations/${id}/approve`, { method: "POST", token: session.token })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { login }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

export async function rejectAccreditation(slug: string, id: number, note: string): Promise<{ error?: string }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can turn a realty down." }
  if (!note.trim()) return { error: 'Say why, e.g. "The PRC registration is unreadable".' }
  try {
    await api(`/realty/realties/accreditations/${id}/reject`, { method: "POST", token: session.token, body: { note: note.trim() } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard`, "layout")
  return {}
}

/** A new temporary password for a realty that has not signed in yet (its email got lost). */
export async function resendLoginDetails(slug: string, id: number): Promise<{ error?: string; login?: LoginResult }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can resend login details." }
  try {
    const login = await api<LoginResult>(`/realty/realties/accreditations/${id}/resend-login`, { method: "POST", token: session.token })
    revalidatePath(`/${slug}/dashboard/realties/${id}`)
    return { login }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}
