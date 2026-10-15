import { RouteModal } from "@/components/route-modal"
import { todayManila } from "@/lib/format"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { OfferForm } from "../../../offers/offer-form"
import { loadNewOffer, termsFromQuery } from "../../../offers/new/load"
import { OffersStopped, offersStopped } from "../../../offers/new/stopped"

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ project?: string; unit?: string; plan?: string; terms?: string; date?: string; buyer?: string; email?: string; phone?: string; fee?: string }> }

/** "New offer" from anywhere in the dashboard opens here, over the page you were on. */
export default async function NewOfferModal({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const query = await searchParams
  const { user, projects } = await loadNewOffer(slug)

  return (
    <RouteModal eyebrow={user.realty.name} title="New sales offer" wide>
      <p className="-mt-1 mb-6 max-w-2xl text-[15px] text-[#5a554d]">The buyer gets a link to a page with the unit, the price, the payment schedule and your contact details.</p>
      {offersStopped(user) ? <OffersStopped user={user} /> : <OfferForm slug={slug} projects={projects} initialProject={query.project ? Number(query.project) : undefined} initialUnit={query.unit ? Number(query.unit) : undefined} initialPlan={query.plan ? Number(query.plan) : undefined} initialTerms={termsFromQuery(query.terms)} initialDate={query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : undefined} prefill={{ buyer: query.buyer?.slice(0, 150), email: query.email?.slice(0, 190), phone: query.phone?.slice(0, 40), fee: Number(query.fee) > 0 ? Number(query.fee) : undefined }} today={todayManila()} isStaff={isDeveloperStaff(user)} realtyName={user.realty.developer?.name ?? user.realty.name} />}
    </RouteModal>
  )
}
