"use server"

import { revalidatePath } from "next/cache"
import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export type OfferState = { error?: string; url?: string; code?: string; id?: number; emailed?: string | null }

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

  try {
    const res = await api<{ id: number; code: string; url: string; emailed_to: string | null }>("/realty/offers", {
      method: "POST",
      token,
      body: { unit_id, payment_plan_id: plan ? Number(plan) : null, buyer_name, buyer_email: buyer_email || null, buyer_phone: buyer_phone || null, purchase_date, email_buyer },
    })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { url: res.url, code: res.code, id: res.id, emailed: res.emailed_to }
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
