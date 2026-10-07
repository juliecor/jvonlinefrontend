import { Suspense } from "react"
import Link from "next/link"
import { ExternalLink, Eye } from "lucide-react"
import { Empty, PageHeader, Panel, Row, Rows, Tag, btn } from "@/components/dashboard-ui"
import { LeadTag } from "@/components/leads"
import { api } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"
import { php, shortDate } from "@/lib/format"
import { RealtyFilter } from "../realty-filter"

export const metadata = { title: "Offers" }

type Offer = {
  id: number; code: string; status: "active" | "void"; buyer_name: string; price: number; views: number; created_at: string
  realty: { id: number; name: string; slug: string } | null; project: string | null; unit: string | null; agent: string | null; url: string
  responses_count: number; latest_response: { kind: "interested" | "question" | "not_interested"; label: string } | null
  requirements: { required: number; submitted: number; approved: number; to_review: number; details: boolean }
  custom: boolean; approval_status: "pending" | "approved" | "rejected" | null
}
type Realty = { id: number; name: string }

/** jvconline.ph/admin/offers — every offer on the platform, filterable by realty. */
export default async function AdminOffersPage({ searchParams }: { searchParams: Promise<{ realty?: string }> }) {
  const { token } = await requireAdmin()
  const { realty } = await searchParams
  const [offers, realties] = await Promise.all([
    api<Offer[]>(`/admin/offers${realty ? `?realty_id=${encodeURIComponent(realty)}` : ""}`, { token }),
    api<Realty[]>("/admin/realties", { token }),
  ])

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Offers"
        lede="Sales offers agents have sent to buyers, across all realties."
        action={
          <Suspense>
            <RealtyFilter realties={realties} />
          </Suspense>
        }
      />

      <Panel title={`Offers · ${offers.length}`}>
        <Rows>
          {offers.map((o) => (
            <Row key={o.id} muted={o.status === "void"}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold">{o.buyer_name}</p>
                  <span className="font-mono text-xs text-[#8a847a]">{o.code}</span>
                  {o.status === "void" && <Tag>Void</Tag>}
                  {o.latest_response && <LeadTag kind={o.latest_response.kind} label={`${o.latest_response.label}${o.responses_count > 1 ? ` · ${o.responses_count}` : ""}`} />}
                  {o.custom && (
                    <Tag tone={o.approval_status === "approved" ? "neutral" : o.approval_status === "rejected" ? "bad" : "warn"}>
                      Custom terms{o.approval_status === "pending" ? " · waiting" : o.approval_status === "rejected" ? " · sent back" : ""}
                    </Tag>
                  )}
                  {o.requirements.required > 0 && o.status === "active" && (
                    <Tag tone={o.requirements.to_review > 0 ? "warn" : "neutral"}>
                      Docs {o.requirements.submitted + (o.requirements.details ? 1 : 0)}/{o.requirements.required + 1}
                      {o.requirements.to_review > 0 && ` · ${o.requirements.to_review} to review`}
                    </Tag>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-[#6b665d]">
                  {o.realty && (
                    <Link href={`/admin/realties/${o.realty.id}`} className="font-semibold text-[#3d3a34] hover:text-[var(--accent)] hover:underline">
                      {o.realty.name}
                    </Link>
                  )}
                  {" · "}
                  {[o.project, o.unit, php(o.price), o.agent && `by ${o.agent}`].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-[#8a847a]">
                  {shortDate(o.created_at)} · <Eye className="h-3.5 w-3.5" /> {o.views} view{o.views === 1 ? "" : "s"}
                </p>
              </div>
              <a href={o.url} target="_blank" rel="noreferrer" className={btn.outline}>
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Row>
          ))}
          {offers.length === 0 && (
            <li>
              <Empty>No offers{realty ? " for this realty" : ""} yet.</Empty>
            </li>
          )}
        </Rows>
      </Panel>
    </div>
  )
}
