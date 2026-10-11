"use server"

import { revalidatePath } from "next/cache"
import { ApiError, api, errorMessage } from "@/lib/api"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { requireRealtyUser } from "@/lib/realty-auth"
import type { Term } from "./term-choice"

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

/** A fresh link for an invite that was not filled in; the old one stops working. `mail` false only makes the link, to send yourself. */
export async function resendInvite(slug: string, id: number, mail = true): Promise<{ error?: string; sent?: Sent }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can resend invites." }
  try {
    const sent = await api<Sent>(`/realty/realties/invitations/${id}/resend`, { method: "POST", token: session.token, body: { email: mail } })
    revalidatePath(`/${slug}/dashboard/realties`)
    return { sent }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

/** Accept for a term: makes the broker realty and mails its login. The sidebar's "to review" count updates with it. */
export async function acceptAccreditation(slug: string, id: number, term: Term): Promise<{ error?: string; login?: LoginResult }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can accept a realty." }
  if (term.term === "custom" && !term.until) return { error: "Pick the last day of the accreditation." }
  try {
    const login = await api<LoginResult>(`/realty/realties/accreditations/${id}/approve`, { method: "POST", token: session.token, body: { term: term.term, until: term.term === "custom" ? term.until : null } })
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

/** Delete an invite or a form that was turned down, with its attached files. */
export async function deleteAccreditation(slug: string, id: number): Promise<{ error?: string }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can delete these." }
  try {
    await api(`/realty/realties/accreditations/${id}`, { method: "DELETE", token: session.token })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard`, "layout")
  return {}
}

/** Delete an accredited realty with its people. Not possible once it has sold offers. */
export async function deleteBroker(slug: string, id: number): Promise<{ error?: string }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can delete a realty." }
  try {
    await api(`/realty/realties/${id}`, { method: "DELETE", token: session.token })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard`, "layout")
  return {}
}

/** Renew or extend an accepted realty's accreditation (it also starts one that was ended early again). */
export async function renewAccreditation(slug: string, id: number, term: Term): Promise<{ error?: string }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can renew an accreditation." }
  if (term.term === "custom" && !term.until) return { error: "Pick the last day of the accreditation." }
  try {
    await api(`/realty/realties/accreditations/${id}/term`, { method: "POST", token: session.token, body: { term: term.term, until: term.term === "custom" ? term.until : null } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard/realties`, "layout")
  return {}
}

/** End an accreditation now: the realty makes no new offers from today. Offers already made carry on. */
export async function endAccreditation(slug: string, id: number, note: string): Promise<{ error?: string }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can end an accreditation." }
  if (!note.trim()) return { error: 'Say why, e.g. "Advertised without approval".' }
  try {
    await api(`/realty/realties/accreditations/${id}/end`, { method: "POST", token: session.token, body: { note: note.trim() } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard/realties`, "layout")
  return {}
}

/** The signed and notarized agreement a realty uploaded: accept it, or send it back saying what to fix. */
export async function checkSignedCopy(slug: string, id: number, verdict: "verified" | "returned", note = ""): Promise<{ error?: string }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can check the signed agreement." }
  if (verdict === "returned" && !note.trim()) return { error: 'Say what to fix, e.g. "Page 2 has no signature".' }
  try {
    await api(`/realty/realties/accreditations/${id}/signed-copy`, { method: "POST", token: session.token, body: { verdict, note: note.trim() || null } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard/realties`, "layout")
  return {}
}

export type AgreementSettings = { representative_name: string; representative_title: string; office_address: string; commission: { classification: string; rate: string }[]; signed_copy_days: number }

/** The developer's details on the agreement. Once they are filled in, every new realty signs the agreement on its form. */
export async function saveAgreementSettings(slug: string, settings: AgreementSettings): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  const session = await staff(slug)
  if (!session) return { error: "Only the developer's admins can change the agreement." }
  try {
    await api("/realty/realties/agreement", { method: "POST", token: session.token, body: settings })
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { error: "Some details need another look.", fieldErrors: Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])) }
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard/realties`, "layout")
  return {}
}
