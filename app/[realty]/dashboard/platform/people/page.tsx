import { PeopleView } from "@/components/platform/people-view"
import { superAdminContext } from "../super-admin"

export const metadata = { title: "People" }

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ realty?: string }> }

/** Every realty admin and agent on the platform, for a super admin inside a realty dashboard. */
export default async function SuperAdminPeoplePage({ params, searchParams }: Props) {
  const ctx = await superAdminContext((await params).realty)
  const { realty } = await searchParams
  return <PeopleView ctx={ctx} realty={realty} eyebrow="Super admin" />
}
