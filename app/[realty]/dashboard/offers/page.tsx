import Link from "next/link"
import { Eye, ExternalLink, Plus } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { Empty, PageHeader, Panel, Row, Rows, Tag, btn } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { php, shortDate } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { voidOffer } from "./actions"

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
  url: string
}

/** jvconline.ph/<realty>/dashboard/offers — agents see theirs, staff see the whole realty's. */
export default async function OffersPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  const offers = await api<Offer[]>("/realty/offers", { token })
  const staff = user.role === "realty"

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

      <Panel title={`Offers · ${offers.length}`}>
        <Rows>
          {offers.map((o) => (
            <Row key={o.id} muted={o.status === "void"}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{o.buyer_name}</p>
                  <span className="font-mono text-xs text-[#a39d92]">{o.code}</span>
                  {o.status === "void" && <Tag>Void</Tag>}
                </div>
                <p className="mt-0.5 text-sm text-[#6b665d]">
                  {o.project} · {o.unit} · {php(o.price)}
                  {staff && o.agent && <> · by {o.agent}</>}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-[#a39d92]">
                  {shortDate(o.created_at)} · <Eye className="h-3 w-3" /> {o.views} view{o.views === 1 ? "" : "s"}
                </p>
              </div>
              {o.status === "active" && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <CopyButton text={o.url} />
                  <a href={o.url} target="_blank" rel="noreferrer" className={btn.ghost}>
                    Open <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <form action={voidOffer.bind(null, slug, o.id)}>
                    <button type="submit" className="px-2 py-1.5 text-xs font-semibold text-[#8a847a] hover:text-red-700">Void</button>
                  </form>
                </div>
              )}
            </Row>
          ))}
          {offers.length === 0 && <li><Empty>No offers yet.</Empty></li>}
        </Rows>
      </Panel>
    </div>
  )
}
