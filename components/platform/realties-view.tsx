import Link from "next/link"
import { ExternalLink, LayoutDashboard } from "lucide-react"
import { Empty, Ledger, PageHeader, Panel, Row, Rows, Tag, btn } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { shortDate } from "@/lib/format"
import { InviteRealtyForm } from "./invite-form"
import { OpenDashboard } from "./open-dashboard"
import { ResendButton } from "./resend-button"

type Realty = {
  id: number
  name: string
  slug: string
  email: string | null
  status: "invited" | "active"
  invited_at: string | null
  registered_at: string | null
  users_count: number
  latest_invitation: { email: string; expires_at: string; accepted_at: string | null } | null
}
type Stats = { realties_active: number; realties_invited: number; realty_users: number; agents: number; projects: number; units: number; offers_active: number; offers_total: number; offer_views: number; offer_responses: number }

export type PlatformContext = {
  token: string
  /** Where these pages live: "/admin", or "/<realty>/dashboard/platform" inside a super admin's realty dashboard. */
  base: string
  from: "admin" | "realty"
  superAdmin: boolean
  /** The realty dashboard we're inside, if any: its own "Open dashboard" is just a link home. */
  currentSlug?: string
}

/** Every realty on the platform and the invite form; inside a realty dashboard, the platform's numbers too. */
export async function RealtiesView({ ctx, eyebrow, showStats = false }: { ctx: PlatformContext; eyebrow: string; showStats?: boolean }) {
  const [realties, s] = await Promise.all([api<Realty[]>("/admin/realties", { token: ctx.token }), showStats ? api<Stats>("/admin/stats", { token: ctx.token }) : Promise.resolve(null)])

  return (
    <div>
      <PageHeader eyebrow={eyebrow} title="Realties" lede="Each realty gets its own page at jvconline.ph/<address>, its own login and its own dashboard." />

      {s && (
        <Ledger
          items={[
            { label: "Realties", value: s.realties_active, note: s.realties_invited ? `${s.realties_invited} invited` : "all registered" },
            { label: "People", value: s.realty_users + s.agents, note: `${s.realty_users} admins · ${s.agents} agent${s.agents === 1 ? "" : "s"}`, href: `${ctx.base}/people` },
            { label: "Projects", value: s.projects, note: `${s.units} unit${s.units === 1 ? "" : "s"} listed` },
            { label: "Active offers", value: s.offers_active, note: `${s.offer_views} views · ${s.offer_responses} responses` },
          ]}
        />
      )}

      <Panel title={`Realties · ${realties.length}`}>
        <Rows>
          {realties.map((r) => {
            const expired = r.status === "invited" && r.latest_invitation && new Date(r.latest_invitation.expires_at) < new Date()
            return (
              <Row key={r.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`${ctx.base}/realties/${r.id}`} className="text-lg font-bold hover:text-[var(--accent)]">
                      {r.name}
                    </Link>
                    {r.status === "active" ? <Tag tone="good">Active</Tag> : expired ? <Tag tone="bad">Invite expired</Tag> : <Tag tone="warn">Invited</Tag>}
                    {r.slug === ctx.currentSlug && <Tag tone="accent">You&apos;re here</Tag>}
                  </div>
                  <p className="mt-0.5 text-sm text-[#6b665d]">
                    jvconline.ph/{r.slug}
                    {r.email && ` · ${r.email}`}
                    {r.status === "active" ? ` · registered ${shortDate(r.registered_at)} · ${r.users_count} login${r.users_count === 1 ? "" : "s"}` : ` · invited ${shortDate(r.invited_at)}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {ctx.superAdmin && r.status === "active" && <DashboardButton ctx={ctx} slug={r.slug} />}
                  <Link href={`${ctx.base}/realties/${r.id}`} className={btn.outline}>
                    Details
                  </Link>
                  {r.status === "active" ? (
                    <Link href={`/${r.slug}`} target="_blank" className={btn.outline}>
                      Page <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <ResendButton id={r.id} />
                  )}
                </div>
              </Row>
            )
          })}
          {realties.length === 0 && (
            <li>
              <Empty>No realties yet. Invite the first one below.</Empty>
            </li>
          )}
        </Rows>
      </Panel>

      <div id="invite" className="scroll-mt-24">
        <Panel title="Invite a realty" aside="They get an email with a link to register. It works for 7 days.">
          <div className="pt-6">
            <InviteRealtyForm />
          </div>
        </Panel>
      </div>
    </div>
  )
}

/** "Open dashboard": a plain link for the realty we're already in, otherwise a switch into that realty as its admin. */
export function DashboardButton({ ctx, slug }: { ctx: PlatformContext; slug: string }) {
  return slug === ctx.currentSlug ? (
    <Link href={`/${slug}/dashboard`} className={btn.outline}>
      <LayoutDashboard className="h-4 w-4" /> Open dashboard
    </Link>
  ) : (
    <OpenDashboard slug={slug} from={ctx.from} />
  )
}
