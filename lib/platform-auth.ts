import "server-only"
import { redirect } from "next/navigation"
import { currentAdmin } from "./admin-auth"
import { currentRealtyUser } from "./realty-auth"

/**
 * A token for the platform pages (/api/admin/*): the admin's own session on
 * /admin pages, or a super admin's realty session inside a realty dashboard
 * (the admin cookie only travels to /admin paths).
 */
export async function platformToken(): Promise<string> {
  const admin = await currentAdmin()
  if (admin) return admin.token
  const realty = await currentRealtyUser()
  if (realty?.user.is_superadmin) return realty.token
  redirect("/admin/login")
}
