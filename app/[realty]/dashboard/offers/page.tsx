import Link from "next/link"
import { ChevronRight, Eye, EyeOff, ExternalLink, Home, Plus } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { Empty, PageHeader, Panel, Row, Rows, Tag, btn } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { LeadTag, NewTag, type LeadKind } from "@/components/leads"
import { php, shortDate, timeAgo } from "@/lib/format"
import type { RequirementSummary } from "@/lib/requirements-types"
import { requireRealtyUser } from "@/lib/realty-auth"
import { ReqChip } from "./req-chip"
import { VoidOfferButton } from "./void-button"

export const metadata = { title: "Offers" }

type Offer = {
  id: number
  code: string
  status: "active" | "void"
  buyer_name: string
  buyer_email: string | null
  purchase_date: string
  price: number
  views: number
  created_at: string
  project: string | null
  unit: string | null
  agent: string | null
  /** The accredited realty that sold it; null when Johndorf's own team did. */
  broker?: string | null
  url: string
  first_viewed_at: string | null
  last_viewed_at: string | null
  responses_count: number
  new_responses: number
  latest_response: { kind: LeadKind; label: string; at: string } | null
  requirements: RequirementSummary
  custom: boolean
  /** The unit is reserved or sold through this offer. */
  unit_status: "reserved" | "sold" | null
  approval_status: "pending" | "approved" | "rejected" | null
  approval_note: string | null
  /** The house model's picture, else the project's photo. */
  photo: string | null
}

/** jvconline.ph/<realty>/dashboard/offers — agents see theirs, staff see the whole realty's. */
export default async function OffersPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  const offers = await api<Offer[]>("/realty/offers", { token })
  const staff = user.role === "realty"
  const fresh = offers.reduce((n, o) => n + o.new_responses, 0)

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Sales offers"
        lede={staff ? "Every offer your agents have sent." : "The offers you've sent to buyers."}
        action={
          <Link href={`/${slug}/dashboard/offers/new`} className={btn.primary}>
            <Plus className="h-4 w-4" /> New offer
          </Link>
        }
      />

      <Panel title={`Offers · ${offers.length}`} aside={fresh ? <span className="font-bold text-[var(--accent)]">{fresh} new response{fresh === 1 ? "" : "s"}</span> : undefined}>
        <Rows>
          {offers.map((o) => (
            <Row key={o.id} muted={o.status === "void"}>
              <div className="flex min-w-0 items-start gap-4">
              <Link href={`/${slug}/dashboard/offers/${o.id}`} className="block h-[72px] w-24 shrink-0 overflow-hidden bg-[#efece6]" aria-hidden tabIndex={-1}>
                {o.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.photo} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <Home className="h-6 w-6 text-[#c9c3b9]" />
                  </span>
                )}
              </Link>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/${slug}/dashboard/offers/${o.id}`} className="text-base font-bold hover:text-[var(--accent)] sm:text-lg">{o.buyer_name}</Link>
                  <span className="font-mono text-xs text-[#a39d92]">{o.code}</span>
                  {o.status === "void" && <Tag>Void</Tag>}
                  {o.unit_status === "sold" && <span className="bg-[#17150f] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">Sold</span>}
                  {o.unit_status === "reserved" && <Tag tone="warn">Reserved</Tag>}
                  {o.status === "active" && o.approval_status === "pending" && <Tag tone="warn">Waiting for approval</Tag>}
                  {o.status === "active" && o.approval_status === "rejected" && <Tag tone="bad">Sent back</Tag>}
                  {o.approval_status === "approved" && <Tag>Custom terms</Tag>}
                  {o.latest_response && <LeadTag kind={o.latest_response.kind} label={o.latest_response.label} />}
                  {o.new_responses > 0 && <NewTag />}
                  {o.requirements.required > 0 && o.status === "active" && <ReqChip r={o.requirements} />}
                </div>
                <p className="mt-0.5 text-sm text-[#6b665d]">
                  {o.project} · {o.unit} · {php(o.price)}
                  {staff && o.agent && <> · by {o.agent}</>}
                  {o.broker && <> · {o.broker}</>}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-[#8a847a]">
                  Sent {shortDate(o.created_at)} ·
                  {o.views > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[#3d3a34]">
                      <Eye className="h-3.5 w-3.5" /> Opened {o.views}× · last {timeAgo(o.last_viewed_at)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <EyeOff className="h-3.5 w-3.5" /> Not opened yet
                    </span>
                  )}
                  {o.latest_response && <> · answered {timeAgo(o.latest_response.at)}</>}
                </p>
              </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 pl-28 sm:pl-0">
                {o.status === "active" && !(o.approval_status === "pending" || o.approval_status === "rejected") && (
                  <>
                    <CopyButton text={o.url} />
                    <a href={o.url} target="_blank" rel="noreferrer" className={btn.ghost}>
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </>
                )}
                <Link href={`/${slug}/dashboard/offers/${o.id}`} className={btn.ghost}>
                  {o.responses_count ? `${o.responses_count} response${o.responses_count === 1 ? "" : "s"}` : "Details"} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                {o.status === "active" && (
                  <VoidOfferButton slug={slug} id={o.id} buyer={o.buyer_name} className="px-2 py-1.5 text-xs font-semibold text-[#8a847a] hover:text-red-700">
                    Void
                  </VoidOfferButton>
                )}
              </div>
            </Row>
          ))}
          {offers.length === 0 && <li><Empty>No offers yet.</Empty></li>}
        </Rows>
      </Panel>
    </div>
  )
}
