import { RealtiesView } from "@/components/platform/realties-view"
import { requireAdmin } from "@/lib/admin-auth"

export const metadata = { title: "Realties" }

/** jvconline.ph/admin/realties — every realty on the platform, and the invite form. */
export default async function AdminRealtiesPage() {
  const { user, token } = await requireAdmin()
  return <RealtiesView ctx={{ token, base: "/admin", from: "admin", superAdmin: !!user.is_superadmin }} eyebrow="Platform" />
}
