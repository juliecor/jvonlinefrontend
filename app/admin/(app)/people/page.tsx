import { PeopleView } from "@/components/platform/people-view"
import { requireAdmin } from "@/lib/admin-auth"

export const metadata = { title: "People" }

/** jvconline.ph/admin/people — every realty admin and agent, with their realty. */
export default async function AdminPeoplePage({ searchParams }: { searchParams: Promise<{ realty?: string }> }) {
  const { user, token } = await requireAdmin()
  const { realty } = await searchParams
  return <PeopleView ctx={{ token, base: "/admin", from: "admin", superAdmin: !!user.is_superadmin }} realty={realty} eyebrow="Platform" />
}
