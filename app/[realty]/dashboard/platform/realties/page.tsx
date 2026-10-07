import { RealtiesView } from "@/components/platform/realties-view"
import { superAdminContext } from "../super-admin"

export const metadata = { title: "Realties" }

/** jvconline.ph/<realty>/dashboard/platform/realties — a super admin's realties, in the realty's own dashboard. */
export default async function SuperAdminRealtiesPage({ params }: { params: Promise<{ realty: string }> }) {
  const ctx = await superAdminContext((await params).realty)
  return <RealtiesView ctx={ctx} eyebrow="Super admin" showStats />
}
