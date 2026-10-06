"use server"

import { revalidatePath } from "next/cache"
import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export type OfferState = { error?: string; url?: string; code?: string }

/** Agent (or staff) prepares an offer: unit + plan + buyer → a link to send. */
export async function createOffer(slug: string, _: OfferState, formData: FormData): Promise<OfferState> {
  const { token } = await requireRealtyUser(slug)
  const unit_id = Number(formData.get("unit_id"))
  const plan = String(formData.get("payment_plan_id") ?? "")
  const buyer_name = String(formData.get("buyer_name") ?? "").trim()
  const buyer_email = String(formData.get("buyer_email") ?? "").trim()
  const purchase_date = String(formData.get("purchase_date") ?? "")
  if (!unit_id || !buyer_name || !purchase_date) return { error: "Pick a unit, enter the buyer's name and the purchase date." }

  try {
    const res = await api<{ code: string; url: string }>("/realty/offers", {
      method: "POST",
      token,
      body: { unit_id, payment_plan_id: plan ? Number(plan) : null, buyer_name, buyer_email: buyer_email || null, purchase_date },
    })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { url: res.url, code: res.code }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

export async function voidOffer(slug: string, id: number): Promise<void> {
  const { token } = await requireRealtyUser(slug)
  await api(`/realty/offers/${id}/void`, { method: "POST", token }).catch(() => {})
  revalidatePath(`/${slug}/dashboard`, "layout")
}
