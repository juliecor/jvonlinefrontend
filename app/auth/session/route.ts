import { currentRealtyUser } from "@/lib/realty-auth"

/**
 * GET /auth/session — whether this browser is signed in to a realty dashboard.
 * The public pages are cached for everyone, so they ask here (from the
 * browser) to swap "Sign in" for "Dashboard". Never cached; no token leaves.
 */
export async function GET() {
  const session = await currentRealtyUser()
  const body = session ? { name: session.user.name, dashboard: `/${session.user.realty.slug}/dashboard` } : null
  return Response.json(body, { headers: { "Cache-Control": "private, no-store" } })
}
