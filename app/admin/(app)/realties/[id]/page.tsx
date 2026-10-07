import { RealtyView } from "@/components/platform/realty-view"
import { requireAdmin } from "@/lib/admin-auth"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  return { title: `Realty ${(await params).id}` }
}

/** jvconline.ph/admin/realties/<id> — everything about one realty, read-only. */
export default async function AdminRealtyPage({ params }: Props) {
  const { id } = await params
  const { user, token } = await requireAdmin()
  return <RealtyView ctx={{ token, base: "/admin", from: "admin", superAdmin: !!user.is_superadmin }} id={id} />
}
