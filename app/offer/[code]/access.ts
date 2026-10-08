import "server-only"
import { cookies } from "next/headers"

/**
 * A buyer who signed in to a private offer keeps a token in an httpOnly
 * cookie (one per offer); every call for that offer sends it to Laravel.
 */
const cookieName = (code: string) => `jv_offer_${code.toUpperCase().replace(/[^A-Z0-9]/g, "")}`

export async function setOfferAccess(code: string, token: string): Promise<void> {
  ;(await cookies()).set(cookieName(code), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/offer",
    maxAge: 90 * 24 * 60 * 60,
  })
}

/** The header Laravel checks before it shows a private offer or takes the buyer's answer. */
export async function offerAccessHeaders(code: string): Promise<Record<string, string>> {
  const token = (await cookies()).get(cookieName(code))?.value
  return token ? { "X-Offer-Access": token } : {}
}
