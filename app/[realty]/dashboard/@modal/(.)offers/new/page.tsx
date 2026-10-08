import { RouteModal } from "@/components/route-modal"
import { todayManila } from "@/lib/format"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { OfferForm } from "../../../offers/offer-form"
import { loadNewOffer, termsFromQuery } from "../../../offers/new/load"

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ project?: string; unit?: string; plan?: string; terms?: string; date?: string }> }

/** "New offer" from anywhere in the dashboard opens here, over the page you were on. */
export default async function NewOfferModal({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const query = await searchParams
  const { user, projects } = await loadNewOffer(slug)

  return (
    <RouteModal eyebrow={user.realty.name} title="New sales offer" wide>
      <p className="-mt-1 mb-6 max-w-2xl text-[15px] text-[#5a554d]">The buyer gets a link to a page with the unit, the price, the payment schedule and your contact details.</p>
      <OfferForm slug={slug} projects={projects} initialProject={query.project ? Number(query.project) : undefined} initialUnit={query.unit ? Number(query.unit) : undefined} initialPlan={query.plan ? Number(query.plan) : undefined} initialTerms={termsFromQuery(query.terms)} initialDate={query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : undefined} today={todayManila()} isStaff={isDeveloperStaff(user)} realtyName={user.realty.developer?.name ?? user.realty.name} />
    </RouteModal>
  )
}
