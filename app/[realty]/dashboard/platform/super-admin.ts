import "server-only"
import { notFound } from "next/navigation"
import type { PlatformContext } from "@/components/platform/realties-view"
import { requireRealtyUser } from "@/lib/realty-auth"

/** The platform pages inside a realty dashboard: super admins only; everyone else gets a 404. */
export async function superAdminContext(slug: string): Promise<PlatformContext> {
  const { user, token } = await requireRealtyUser(slug)
  if (!user.is_superadmin) notFound()
  return { token, base: `/${slug}/dashboard/platform`, from: "realty", superAdmin: true, currentSlug: slug }
}
