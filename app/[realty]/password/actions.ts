"use server"

import { redirect } from "next/navigation"
import { ApiError, api, errorMessage } from "@/lib/api"
import { currentRealtyUser } from "@/lib/realty-auth"

export type PasswordState = { error?: string; fieldErrors?: { current_password?: string; password?: string } }

/** Replaces the temporary password from the accreditation email, through the same endpoint as My account. Laravel keeps this sign-in and ends the others. */
export async function changePassword(slug: string, _: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await currentRealtyUser()
  if (!session || session.user.realty.slug !== slug) redirect(`/${slug}/login`)

  const current = String(formData.get("current_password") ?? "")
  const next = String(formData.get("password") ?? "")
  const confirm = String(formData.get("password_confirmation") ?? "")
  if (!current) return { fieldErrors: { current_password: "Enter the temporary password from your email." } }
  if (next.length < 8) return { fieldErrors: { password: "Use at least 8 characters." } }
  if (next !== confirm) return { fieldErrors: { password: "The two passwords don't match." } }
  if (next === current) return { fieldErrors: { password: "Choose a password that is different from the temporary one." } }

  try {
    await api("/account/password", { method: "POST", token: session.token, body: { current_password: current, password: next, password_confirmation: confirm } })
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) {
      return { fieldErrors: { current_password: e.errors.current_password?.[0], password: e.errors.password?.[0] }, error: e.errors.current_password || e.errors.password ? undefined : errorMessage(e) }
    }
    return { error: errorMessage(e) }
  }
  redirect(`/${slug}/dashboard`)
}
