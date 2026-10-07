import { RealtyView } from "@/components/platform/realty-view"
import { superAdminContext } from "../../super-admin"

type Props = { params: Promise<{ realty: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  return { title: `Realty ${(await params).id}` }
}

/** One realty's details, for a super admin inside a realty dashboard. */
export default async function SuperAdminRealtyPage({ params }: Props) {
  const { realty, id } = await params
  return <RealtyView ctx={await superAdminContext(realty)} id={id} />
}
