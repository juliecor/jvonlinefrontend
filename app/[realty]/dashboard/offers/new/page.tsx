import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
import { todayManila } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import type { Project, ProjectDetail } from "../../projects/types"
import { OfferForm } from "../offer-form"

export const metadata = { title: "New offer" }

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ project?: string }> }

/** jvconline.ph/<realty>/dashboard/offers/new — prepare a sales offer for a buyer. */
export default async function NewOfferPage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const { token } = await requireRealtyUser(slug)
  const query = await searchParams

  // Every active project with its units and plans, so the form can switch between them without round trips.
  const list = (await api<Project[]>("/realty/projects", { token })).filter((p) => p.status === "active")
  const projects = (await Promise.all(list.map((p) => api<ProjectDetail>(`/realty/projects/${p.id}`, { token })))).filter((p) => p.units.length > 0)

  return (
    <div>
      <Link href={`/${slug}/dashboard/offers`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Offers
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">New sales offer</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">The buyer gets a link to a page with the unit, the price, the payment schedule and your contact details.</p>
      <OfferForm slug={slug} projects={projects} initialProject={query.project ? Number(query.project) : undefined} today={todayManila()} />
    </div>
  )
}
