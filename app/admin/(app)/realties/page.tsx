import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Empty, PageHeader, Panel, Row, Rows, Tag, btn } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"
import { shortDate } from "@/lib/format"
import { OpenDashboard } from "../open-dashboard"
import { InviteRealtyForm } from "./invite-form"
import { ResendButton } from "./resend-button"

export const metadata = { title: "Realties" }

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

/** jvconline.ph/admin/realties — every realty on the platform, and the invite form. */
export default async function AdminRealtiesPage() {
  const { user, token } = await requireAdmin()
  const realties = await api<Realty[]>("/admin/realties", { token })

  return (
    <div>
      <PageHeader eyebrow="Platform" title="Realties" lede="Each realty gets its own page at jvconline.ph/<address>, its own login and its own dashboard." />

      <div id="invite" className="scroll-mt-24">
        <Panel title="Invite a realty" aside="They get an email with a link to register. It works for 7 days.">
          <div className="pt-6">
            <InviteRealtyForm />
          </div>
        </Panel>
      </div>

      <Panel title={`Realties · ${realties.length}`}>
        <Rows>
          {realties.map((r) => {
            const expired = r.status === "invited" && r.latest_invitation && new Date(r.latest_invitation.expires_at) < new Date()
            return (
              <Row key={r.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/realties/${r.id}`} className="text-lg font-bold hover:text-[var(--accent)]">
                      {r.name}
                    </Link>
                    {r.status === "active" ? <Tag tone="good">Active</Tag> : expired ? <Tag tone="bad">Invite expired</Tag> : <Tag tone="warn">Invited</Tag>}
                  </div>
                  <p className="mt-0.5 text-sm text-[#6b665d]">
                    jvconline.ph/{r.slug}
                    {r.email && ` · ${r.email}`}
                    {r.status === "active" ? ` · registered ${shortDate(r.registered_at)} · ${r.users_count} login${r.users_count === 1 ? "" : "s"}` : ` · invited ${shortDate(r.invited_at)}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {user.is_superadmin && r.status === "active" && <OpenDashboard slug={r.slug} />}
                  <Link href={`/admin/realties/${r.id}`} className={btn.outline}>
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
              <Empty>No realties yet. Invite the first one above.</Empty>
            </li>
          )}
        </Rows>
      </Panel>
    </div>
  )
}
