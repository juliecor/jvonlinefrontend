import { redirect } from "next/navigation"
import { PageHeader } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireSection } from "@/lib/realty-auth"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { type ReqType, RequirementsEditor } from "./editor"
import { PaymentSettings } from "./payment-settings"

export const metadata = { title: "Buyer requirements" }

/** jvconline.ph/<realty>/dashboard/requirements — the checklist every buyer sees on their offer. Staff only. */
export default async function RequirementsPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireSection(slug, "requirements")
  if (!isDeveloperStaff(user)) redirect(`/${slug}/dashboard`)
  const [{ types, applies }, payment] = await Promise.all([
    api<{ types: ReqType[]; applies: Record<string, string> }>("/realty/requirements", { token }),
    api<{ payment_instructions: string | null; online: boolean }>("/realty/reservation-settings", { token }),
  ])

  return (
    <div>
      <PageHeader
        eyebrow="Setup"
        title="Buyer requirements"
        lede="What buyers upload on their sales offer: IDs, proof of income and the rest. Items tied to the buyer's details (married, co-borrower, a kind of income) only become required for the buyers they apply to."
      />
      <PaymentSettings slug={slug} initial={payment.payment_instructions} online={payment.online} />
      <RequirementsEditor slug={slug} types={types} applies={applies} />
    </div>
  )
}
