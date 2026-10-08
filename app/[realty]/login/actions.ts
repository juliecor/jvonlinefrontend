"use server"

import { redirect } from "next/navigation"
import type { AuthUser } from "@/lib/admin-auth"
import { api, errorMessage } from "@/lib/api"
import { clearRealtyToken, realtyToken, setRealtyToken } from "@/lib/realty-auth"

/** `email` comes back on an error so the form can keep it filled in. */
export type RealtyLoginState = { error?: string; email?: string }

/** Sign in at a realty's own login page. Laravel checks the account belongs to that realty. */
export async function signInRealty(slug: string, _: RealtyLoginState, formData: FormData): Promise<RealtyLoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  if (!email || !password) return { error: "Enter your email and password.", email }

  let token: string
  let mustChangePassword = false
  try {
    const res = await api<{ token: string; user: AuthUser }>("/auth/login", { method: "POST", body: { email, password, realty: slug, device: `realty-web:${slug}` } })
    token = res.token
    mustChangePassword = !!res.user?.must_change_password
  } catch (e) {
    return { error: errorMessage(e), email }
  }

  await setRealtyToken(token)
  // A realty that was just accepted signs in with the temporary password from its email, then chooses its own.
  redirect(mustChangePassword ? `/${slug}/password` : `/${slug}/dashboard`)
}

export async function signOutRealty(slug: string): Promise<void> {
  const token = await realtyToken()
  if (token) await api("/auth/logout", { method: "POST", token }).catch(() => {})
  await clearRealtyToken()
  redirect(`/${slug}/login`)
}
