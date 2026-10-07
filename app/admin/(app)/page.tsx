import Link from "next/link"
import { Building2, Clock, FileText, FileUp, Home, MessageSquareReply, Plus, UserPlus } from "lucide-react"
import { Empty, Ledger, PageHeader, Panel, Row, Rows, Tag, btn } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"
import { greeting, shortDate } from "@/lib/format"
import { OpenDashboard } from "@/components/platform/open-dashboard"

export const metadata = { title: "Dashboard" }

type Stats = {
  realties: number
  realties_active: number
  realties_invited: number
  realty_users: number
  agents: number
  projects: number
  units: number
  offers_active: number
  offers_total: number
  offer_views: number
  offer_responses: number
  documents: number
  recent: { kind: string; at: string; realty: string | null; realty_id: number | null; text: string; code?: string }[]
}
type Realty = { id: number; name: string; slug: string; status: "invited" | "active"; users_count: number }

const KIND_ICON = { realty_registered: Building2, realty_invited: Clock, agent_joined: UserPlus, project_added: Home, offer_created: FileText, offer_response: MessageSquareReply, document_uploaded: FileUp } as const

/** jvconline.ph/admin — the numbers across every realty, the realties themselves, and what happened lately. */
export default async function AdminDashboardPage() {
  const { user, token } = await requireAdmin()
  const [s, realties] = await Promise.all([api<Stats>("/admin/stats", { token }), api<Realty[]>("/admin/realties", { token })])

  return (
    <div>
      <PageHeader
        eyebrow="jvconline"
        title={`${greeting()}, ${user.name.split(" ")[0]}.`}
        lede="Here's how every realty on the platform stands today."
        action={
          <Link href="/admin/realties#invite" className={btn.primary}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Invite a realty
          </Link>
        }
      />
      <Ledger
        items={[
          { label: "Realties", value: s.realties_active, note: s.realties_invited ? `${s.realties_invited} invited` : "all registered", href: "/admin/realties" },
          { label: "People", value: s.realty_users + s.agents, note: `${s.realty_users} staff · ${s.agents} agent${s.agents === 1 ? "" : "s"}`, href: "/admin/people" },
          { label: "Projects", value: s.projects, note: `${s.units} unit${s.units === 1 ? "" : "s"} listed` },
          { label: "Active offers", value: s.offers_active, note: `${s.offers_total} sent in total`, href: "/admin/offers" },
          { label: "Offer views", value: s.offer_views, note: `${s.offer_responses} response${s.offer_responses === 1 ? "" : "s"} · ${s.documents} doc${s.documents === 1 ? "" : "s"}`, href: "/admin/offers" },
        ]}
      />

      <Panel title={`Realties · ${realties.length}`} aside={<Link href="/admin/realties" className="font-semibold hover:text-[#17150f]">All realties →</Link>}>
        <Rows>
          {realties.map((r) => (
            <Row key={r.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/realties/${r.id}`} className="text-lg font-bold hover:text-[var(--accent)]">
                    {r.name}
                  </Link>
                  {r.status === "active" ? <Tag tone="good">Active</Tag> : <Tag tone="warn">Invited</Tag>}
                </div>
                <p className="mt-0.5 text-sm text-[#6b665d]">
                  jvconline.ph/{r.slug}
                  {r.status === "active" && ` · ${r.users_count} login${r.users_count === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {user.is_superadmin && r.status === "active" && <OpenDashboard slug={r.slug} from="admin" />}
                <Link href={`/admin/realties/${r.id}`} className={btn.outline}>
                  Details
                </Link>
              </div>
            </Row>
          ))}
          {realties.length === 0 && (
            <li>
              <Empty>No realties yet. Invite the first one.</Empty>
            </li>
          )}
        </Rows>
      </Panel>

      <Panel title="Latest activity">
        <Rows>
          {s.recent.map((e, i) => {
            const Icon = KIND_ICON[e.kind as keyof typeof KIND_ICON] ?? FileText
            return (
              <li key={i} className="flex items-start gap-4 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#f1eee9] text-[#3d3a34]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-[#17150f]">{e.text}</p>
                  <p className="mt-0.5 text-sm text-[#8a847a]">
                    {shortDate(e.at)}
                    {e.realty_id && (
                      <>
                        {" · "}
                        <Link href={`/admin/realties/${e.realty_id}`} className="hover:text-[#17150f] hover:underline">
                          {e.realty}
                        </Link>
                      </>
                    )}
                    {e.code && (
                      <>
                        {" · "}
                        <a href={`/offer/${e.code}`} target="_blank" rel="noreferrer" className="font-mono hover:text-[#17150f] hover:underline">
                          {e.code}
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </li>
            )
          })}
          {s.recent.length === 0 && (
            <li>
              <Empty>Nothing yet.</Empty>
            </li>
          )}
        </Rows>
      </Panel>
    </div>
  )
}
