"use server"

import { redirect } from "next/navigation"
import { ApiError, api, errorMessage } from "@/lib/api"
import { realtyToken } from "@/lib/realty-auth"
import type { Requirement } from "@/lib/requirements-types"
import { offerAccessHeaders, setOfferAccess } from "./access"

/** Who's acting on the offer: the buyer's sign-in, or the realty's own people previewing it. */
const as = async (code: string) => ({ headers: await offerAccessHeaders(code), token: await realtyToken() })

export type UnlockState = { error?: string; username?: string }

/** The buyer types the username and password from their agent; on success the offer opens. */
export async function unlockOffer(code: string, _: UnlockState, fd: FormData): Promise<UnlockState> {
  const username = String(fd.get("username") ?? "").trim()
  const password = String(fd.get("password") ?? "")
  if (!username || !password) return { error: "Enter the username and password from your agent.", username }
  try {
    const { token } = await api<{ token: string | null }>(`/offers/${encodeURIComponent(code)}/unlock`, { method: "POST", body: { username, password } })
    if (token) await setOfferAccess(code, token)
  } catch (e) {
    return { error: e instanceof ApiError && e.status === 429 ? "Too many tries. Wait a minute and try again." : errorMessage(e), username }
  }
  redirect(`/offer/${encodeURIComponent(code)}`)
}

export type RespondState = { error?: string; done?: "interested" | "question"; name?: string }

/** The buyer's answer to the offer → Laravel, which saves the lead and emails the agent. */
export async function respondToOffer(code: string, _: RespondState, fd: FormData): Promise<RespondState> {
  const str = (k: string) => String(fd.get(k) ?? "").trim()
  const kind = str("kind") as NonNullable<RespondState["done"]>
  const name = str("name")
  if (!name) return { error: "Please enter your name." }
  if (!str("phone")) return { error: "Please enter your mobile number so we can reach you." }
  try {
    await api(`/offers/${encodeURIComponent(code)}/respond`, {
      ...(await as(code)),
      method: "POST",
      body: {
        kind,
        name,
        phone: str("phone") || null,
        email: str("email") || null,
        contact_via: str("contact_via") || null,
        message: str("message") || null,
        website: str("website"),
      },
    })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  return { done: kind, name }
}

export type ReqResult = { requirements?: Requirement[]; detailsAt?: string | null; error?: string; fields?: Record<string, string> }

const fieldErrors = (e: unknown) => (e instanceof ApiError ? Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])) : {})

/** The buyer information form. Sent as JSON; checkboxes become booleans. */
export async function submitDetails(code: string, fd: FormData): Promise<ReqResult> {
  const body: Record<string, unknown> = {}
  for (const [k, v] of fd.entries()) if (typeof v === "string") body[k] = v.trim() || null
  body.co_borrower = fd.get("co_borrower") === "on"
  body.consent = fd.get("consent") === "on"
  try {
    const r = await api<{ requirements: Requirement[]; details_submitted_at: string }>(`/offers/${encodeURIComponent(code)}/details`, { ...(await as(code)), method: "POST", body })
    return { requirements: r.requirements, detailsAt: r.details_submitted_at }
  } catch (e) {
    return { error: errorMessage(e), fields: fieldErrors(e) }
  }
}

/** Photos or PDFs for one requirement. */
export async function uploadDocuments(code: string, typeId: number, fd: FormData): Promise<ReqResult> {
  const out = new FormData()
  out.append("requirement_type_id", String(typeId))
  for (const f of fd.getAll("files")) if (f instanceof File && f.size > 0) out.append("files[]", f)
  if (!out.has("files[]")) return { error: "Choose a photo or a PDF." }
  try {
    const r = await api<{ requirements: Requirement[] }>(`/offers/${encodeURIComponent(code)}/documents`, { ...(await as(code)), method: "POST", body: out })
    return { requirements: r.requirements }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

export async function removeDocument(code: string, docId: number): Promise<ReqResult> {
  try {
    const r = await api<{ requirements: Requirement[] }>(`/offers/${encodeURIComponent(code)}/documents/${docId}/remove`, { ...(await as(code)), method: "POST" })
    return { requirements: r.requirements }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

export type Reservation = {
  fee: number
  status: "pending" | "paid" | "confirmed" | "declined" | null
  method: "online" | "proof" | null
  reference: string | null
  note: string | null
  has_proof: boolean
  requested_at: string | null
  paid_at: string | null
  confirmed_at: string | null
  /** Online payment (PayMongo) is set up for this developer. */
  online: boolean
  /** Where to pay by bank or GCash, as the developer typed it. */
  instructions: string | null
}
export type ReserveResult = { error?: string; reservation?: Reservation }

/** Proof of a bank deposit or GCash payment for the reservation fee. */
export async function uploadReservationProof(code: string, fd: FormData): Promise<ReserveResult> {
  const out = new FormData()
  const f = fd.get("proof")
  if (!(f instanceof File) || f.size === 0) return { error: "Add a photo or a PDF of your payment." }
  out.append("proof", f)
  for (const k of ["reference", "note"]) {
    const v = fd.get(k)
    if (typeof v === "string" && v.trim()) out.append(k, v.trim())
  }
  try {
    const r = await api<{ reservation: Reservation }>(`/offers/${encodeURIComponent(code)}/reservation/proof`, { ...(await as(code)), method: "POST", body: out })
    return { reservation: r.reservation }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

/** Pay the fee online: the address of PayMongo's checkout page for this offer. */
export async function startReservationCheckout(code: string): Promise<{ error?: string; url?: string }> {
  try {
    return await api<{ url: string }>(`/offers/${encodeURIComponent(code)}/reservation/checkout`, { ...(await as(code)), method: "POST" })
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

/** Back from PayMongo: where the reservation stands now. */
export async function reservationStatus(code: string): Promise<ReserveResult> {
  try {
    const r = await api<{ reservation: Reservation }>(`/offers/${encodeURIComponent(code)}/reservation`, { ...(await as(code)) })
    return { reservation: r.reservation }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}
