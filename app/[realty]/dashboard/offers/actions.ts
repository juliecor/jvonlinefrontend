"use server"

import { revalidatePath } from "next/cache"
import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export type OfferState = { error?: string; url?: string; code?: string; id?: number; emailed?: string | null; approval?: string | null; emailOnApproval?: boolean }

/** Agent (or staff) prepares an offer: unit + plan + buyer → a link to send. */
export async function createOffer(slug: string, _: OfferState, formData: FormData): Promise<OfferState> {
  const { token } = await requireRealtyUser(slug)
  const unit_id = Number(formData.get("unit_id"))
  const plan = String(formData.get("payment_plan_id") ?? "")
  const buyer_name = String(formData.get("buyer_name") ?? "").trim()
  const buyer_email = String(formData.get("buyer_email") ?? "").trim()
  const buyer_phone = String(formData.get("buyer_phone") ?? "").trim()
  // Only when there's an address to send to; otherwise the agent shares the link themselves.
  const email_buyer = formData.get("email_buyer") === "on" && buyer_email !== ""
  const purchase_date = String(formData.get("purchase_date") ?? "")
  if (!unit_id || !buyer_name || !purchase_date) return { error: "Pick a unit, enter the buyer's name and the purchase date." }
  const custom = plan === "custom"
  const custom_milestones = custom ? JSON.parse(String(formData.get("custom_milestones") ?? "[]")) : undefined
  const approval_reason = String(formData.get("approval_reason") ?? "").trim() || null

  try {
    const res = await api<{ id: number; code: string; url: string; emailed_to: string | null; approval_status: string | null }>("/realty/offers", {
      method: "POST",
      token,
      body: { unit_id, payment_plan_id: plan && !custom ? Number(plan) : null, buyer_name, buyer_email: buyer_email || null, buyer_phone: buyer_phone || null, purchase_date, email_buyer, custom, custom_milestones, approval_reason },
    })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { url: res.url, code: res.code, id: res.id, emailed: res.emailed_to, approval: res.approval_status, emailOnApproval: email_buyer }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

export async function voidOffer(slug: string, id: number): Promise<void> {
  const { token } = await requireRealtyUser(slug)
  await api(`/realty/offers/${id}/void`, { method: "POST", token }).catch(() => {})
  revalidatePath(`/${slug}/dashboard`, "layout")
}

/** Re-reads the dashboard (sidebar counts included) after responses were marked as seen. */
export async function refreshCounts(slug: string): Promise<void> {
  await requireRealtyUser(slug)
  revalidatePath(`/${slug}/dashboard`, "layout")
}

export type MailState = { error?: string; ok?: string }

/** Approve a buyer's file, or send it back with a reason they'll see. */
export async function reviewDocument(slug: string, offerId: number, docId: number, status: "approved" | "rejected" | "pending", note?: string): Promise<MailState> {
  const { token } = await requireRealtyUser(slug)
  try {
    await api(`/realty/offers/${offerId}/documents/${docId}/review`, { method: "POST", token, body: { status, note: note || null } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard`, "layout")
  return { ok: status === "approved" ? "Approved." : status === "rejected" ? "Sent back to the buyer." : "Marked for review again." }
}

/** Email the buyer what's still missing. */
export async function remindBuyer(slug: string, offerId: number): Promise<MailState> {
  const { token } = await requireRealtyUser(slug)
  try {
    const r = await api<{ sent_to: string }>(`/realty/offers/${offerId}/remind`, { method: "POST", token })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { ok: `Reminder sent to ${r.sent_to}.` }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

/** Email the offer link to the buyer. */
export async function emailOffer(slug: string, offerId: number): Promise<MailState> {
  const { token } = await requireRealtyUser(slug)
  try {
    const r = await api<{ sent_to: string }>(`/realty/offers/${offerId}/send`, { method: "POST", token })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { ok: `Offer sent to ${r.sent_to}.` }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

/** A realty admin approves custom terms, or sends them back with a note (and may keep them as an official plan). */
export async function decideTerms(slug: string, offerId: number, decision: "approve" | "reject", note: string, savePlan: string | null): Promise<MailState> {
  const { token } = await requireRealtyUser(slug)
  try {
    const r = await api<{ emailed_to: string | null; plan_id: number | null }>(`/realty/offers/${offerId}/approval`, {
      method: "POST",
      token,
      body: { decision, note: note || null, save_as_plan: !!savePlan, plan_name: savePlan },
    })
    revalidatePath(`/${slug}/dashboard`, "layout")
    if (decision === "reject") return { ok: "Sent back to the agent." }
    return { ok: ["Approved.", r.emailed_to ? `The offer was emailed to ${r.emailed_to}.` : "", r.plan_id ? "Saved as an official plan too." : ""].filter(Boolean).join(" ") }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

/** The agent changes custom terms and sends them for approval again. */
export async function resubmitTerms(slug: string, offerId: number, milestones: unknown, reason: string): Promise<MailState> {
  const { token } = await requireRealtyUser(slug)
  try {
    const r = await api<{ approval_status: string }>(`/realty/offers/${offerId}/terms`, { method: "POST", token, body: { custom_milestones: milestones, approval_reason: reason || null } })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { ok: r.approval_status === "approved" ? "Terms saved." : "Sent for approval again." }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}
