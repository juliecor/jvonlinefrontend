import "server-only"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { type AuthUser } from "./admin-auth"
import { ApiError, api } from "./api"

/**
 * Sessions for realty staff and agents. One cookie for the whole site; the
 * dashboard checks that the signed-in person belongs to the realty in the URL,
 * so someone from realty A never sees realty B's pages.
 */

export const REALTY_COOKIE = "jv_realty"
export const REALTY_SESSION_SECONDS = 12 * 60 * 60

export type PublicRealty = { id: number; name: string; slug: string; logo_url: string | null; status: "invited" | "active" }

export type RealtyUser = AuthUser & { role: "realty" | "agent"; realty: PublicRealty }

export async function realtyToken(): Promise<string | null> {
  return (await cookies()).get(REALTY_COOKIE)?.value ?? null
}

export async function setRealtyToken(token: string): Promise<void> {
  ;(await cookies()).set(REALTY_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REALTY_SESSION_SECONDS,
  })
}

export async function clearRealtyToken(): Promise<void> {
  ;(await cookies()).delete({ name: REALTY_COOKIE, path: "/" })
}

/** The realty behind a /<slug> URL, or a 404 page when there's no active realty there. */
export async function realtyBySlug(slug: string): Promise<PublicRealty> {
  try {
    return await api<PublicRealty>(`/realties/${encodeURIComponent(slug)}`)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }
}

/** The signed-in realty person, or null when there's no usable session. */
export async function currentRealtyUser(): Promise<{ user: RealtyUser; token: string } | null> {
  const token = await realtyToken()
  if (!token) return null
  try {
    const user = await api<AuthUser & { realty: PublicRealty | null }>("/auth/me", { token })
    if ((user.role !== "realty" && user.role !== "agent") || !user.realty) return null
    return { user: user as RealtyUser, token }
  } catch {
    return null
  }
}

/** For pages under /<slug>/dashboard: the signed-in member of *this* realty, or off to its login. */
export async function requireRealtyUser(slug: string): Promise<{ user: RealtyUser; token: string }> {
  const session = await currentRealtyUser()
  if (!session || session.user.realty.slug !== slug) redirect(`/${slug}/login`)
  return session
}
