import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/dashboard-ui"
import { todayManila } from "@/lib/format"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { OfferForm } from "../offer-form"
import { loadNewOffer, termsFromQuery } from "./load"

export const metadata = { title: "New offer" }

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ project?: string; unit?: string; plan?: string; terms?: string; date?: string }> }

/** jvconline.ph/<realty>/dashboard/offers/new — prepare a sales offer for a buyer. */
export default async function NewOfferPage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const query = await searchParams
  // Every active project with its units and plans, so the form can switch between them without round trips.
  const { user, projects } = await loadNewOffer(slug)

  return (
    <div>
      <Link href={`/${slug}/dashboard/offers`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Offers
      </Link>
      <div className="mt-3 mb-8">
        <PageHeader eyebrow="Sales" title="New sales offer" lede="The buyer gets a link to a page with the unit, the price, the payment schedule and your contact details." />
      </div>
      <OfferForm slug={slug} projects={projects} initialProject={query.project ? Number(query.project) : undefined} initialUnit={query.unit ? Number(query.unit) : undefined} initialPlan={query.plan ? Number(query.plan) : undefined} initialTerms={termsFromQuery(query.terms)} initialDate={query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : undefined} today={todayManila()} isStaff={isDeveloperStaff(user)} realtyName={user.realty.developer?.name ?? user.realty.name} />
    </div>
  )
}
