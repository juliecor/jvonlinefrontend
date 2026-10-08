import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { Empty, PageHeader, Panel, Row, Rows, Tag, btn } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { php, shortDate, timeAgo } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { isDeveloperStaff } from "@/lib/realty-roles"

export const metadata = { title: "Approvals" }

type Offer = {
  id: number
  code: string
  status: "active" | "void"
  buyer_name: string
  price: number
  created_at: string
  project: string | null
  unit: string | null
  agent: string | null
  custom: boolean
  approval_status: "pending" | "approved" | "rejected" | null
  approval_note: string | null
}

/** jvconline.ph/<realty>/dashboard/approvals — agents' custom payment terms waiting for an admin. Staff only. */
export default async function ApprovalsPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  if (!isDeveloperStaff(user)) redirect(`/${slug}/dashboard/offers`)
  const offers = (await api<Offer[]>("/realty/offers", { token })).filter((o) => o.custom && o.status === "active")
  const waiting = offers.filter((o) => o.approval_status === "pending")
  const decided = offers.filter((o) => o.approval_status !== "pending").slice(0, 15)

  const row = (o: Offer, action: string) => (
    <Row key={o.id}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/${slug}/dashboard/offers/${o.id}`} className="text-lg font-bold hover:text-[var(--accent)]">{o.buyer_name}</Link>
          {o.approval_status === "approved" && <Tag tone="good">Approved</Tag>}
          {o.approval_status === "rejected" && <Tag tone="bad">Sent back</Tag>}
        </div>
        <p className="mt-0.5 text-sm text-[#6b665d]">
          {[o.project, o.unit, php(o.price)].filter(Boolean).join(" · ")} · by {o.agent ?? "an agent"}
        </p>
        <p className="mt-0.5 text-xs font-medium text-[#8a847a]">Made {shortDate(o.created_at)} ({timeAgo(o.created_at)}){o.approval_status === "rejected" && o.approval_note ? ` · "${o.approval_note}"` : ""}</p>
      </div>
      <Link href={`/${slug}/dashboard/offers/${o.id}`} className={o.approval_status === "pending" ? btn.primary : btn.ghost}>
        {action} <ChevronRight className="h-4 w-4" />
      </Link>
    </Row>
  )

  return (
    <div>
      <PageHeader eyebrow="Sales" title="Approvals" lede="Offers where an agent made their own payment terms. The buyer can't open them until an admin approves. The project's official plans never change." />
      <Panel title={`Waiting for approval · ${waiting.length}`}>
        <Rows>
          {waiting.map((o) => row(o, "Review"))}
          {waiting.length === 0 && <li><Empty>Nothing waiting. Custom terms from agents show up here.</Empty></li>}
        </Rows>
      </Panel>
      {decided.length > 0 && (
        <Panel title="Recently decided">
          <Rows>{decided.map((o) => row(o, "Open"))}</Rows>
        </Panel>
      )}
    </div>
  )
}
