import { RouteModal } from "@/components/route-modal"
import { todayManila } from "@/lib/format"
import { OfferForm } from "../../../offers/offer-form"
import { loadNewOffer } from "../../../offers/new/load"

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ project?: string }> }

/** "New offer" from anywhere in the dashboard opens here, over the page you were on. */
export default async function NewOfferModal({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const query = await searchParams
  const { user, projects } = await loadNewOffer(slug)

  return (
    <RouteModal eyebrow={user.realty.name} title="New sales offer" wide>
      <p className="-mt-1 mb-6 max-w-2xl text-[15px] text-[#5a554d]">The buyer gets a link to a page with the unit, the price, the payment schedule and your contact details.</p>
      <OfferForm slug={slug} projects={projects} initialProject={query.project ? Number(query.project) : undefined} today={todayManila()} isStaff={user.role === "realty"} realtyName={user.realty.name} />
    </RouteModal>
  )
}
