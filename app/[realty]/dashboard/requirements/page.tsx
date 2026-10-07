import { redirect } from "next/navigation"
import { PageHeader } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { type ReqType, RequirementsEditor } from "./editor"

export const metadata = { title: "Buyer requirements" }

/** jvconline.ph/<realty>/dashboard/requirements — the checklist every buyer sees on their offer. Staff only. */
export default async function RequirementsPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  if (user.role !== "realty") redirect(`/${slug}/dashboard`)
  const { types, applies } = await api<{ types: ReqType[]; applies: Record<string, string> }>("/realty/requirements", { token })

  return (
    <div>
      <PageHeader
        eyebrow="Setup"
        title="Buyer requirements"
        lede="What buyers upload on their sales offer: IDs, proof of income and the rest. Items tied to the buyer's details (married, co-borrower, a kind of income) only become required for the buyers they apply to."
      />
      <RequirementsEditor slug={slug} types={types} applies={applies} />
    </div>
  )
}
