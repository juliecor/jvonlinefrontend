"use server"

import { redirect } from "next/navigation"
import { api, errorMessage } from "@/lib/api"
import type { PublicRealty } from "@/lib/realty-auth"

export type JoinState = { error?: string; name?: string; email?: string; phone?: string }

/**
 * The agent's application: name, login email, contact number and password. Laravel creates
 * the account as pending; the realty's staff approve it before they can sign in.
 */
export async function joinRealty(token: string, _: JoinState, formData: FormData): Promise<JoinState> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("password_confirmation") ?? "")
  const keep = { name, email, phone }
  if (!name || !email || !phone) return { error: "Enter your name, email and contact number.", ...keep }
  if (!/^09\d{9}$/.test(phone)) return { error: "Enter an 11-digit mobile number starting with 09, numbers only, like 09171234567.", ...keep }
  if (password !== confirm) return { error: "The two passwords don't match.", ...keep }

  let slug: string
  try {
    const res = await api<{ realty: PublicRealty }>(`/join/${encodeURIComponent(token)}`, { method: "POST", body: { name, email, phone, password, password_confirmation: confirm } })
    slug = res.realty.slug
  } catch (e) {
    return { error: errorMessage(e), ...keep }
  }
  redirect(`/${slug}/login?applied=1`)
}
