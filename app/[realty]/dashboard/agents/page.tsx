import { redirect } from "next/navigation"
import { Empty, PageHeader, Panel, Row, Rows, Tag } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { shortDate } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { InviteAgentForm } from "./invite-form"
import { NewLinkButton } from "./resend-button"

export const metadata = { title: "Agents" }

type Agents = {
  agents: { id: number; name: string; email: string; joined_at: string; offers_count: number }[]
  invitations: { id: number; name: string; email: string | null; invited_at: string; expires_at: string; expired: boolean }[]
}

/** jvconline.ph/<realty>/dashboard/agents — the team, and invite links. Staff only. */
export default async function RealtyAgentsPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  if (user.role !== "realty") redirect(`/${slug}/dashboard`)
  const { agents, invitations } = await api<Agents>("/realty/agents", { token })

  return (
    <div>
      <PageHeader eyebrow="Team" title="Agents" lede={`Your agents sign in at jvconline.ph/${slug}/login and send buyers sales offers under your name.`} />

      <Panel title="Invite an agent" aside="You send the link; they set their own password">
        <div className="pt-5">
          <InviteAgentForm slug={slug} />
        </div>
      </Panel>

      {invitations.length > 0 && (
        <Panel title={`Waiting to join · ${invitations.length}`}>
          <Rows>
            {invitations.map((i) => (
              <Row key={i.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{i.name}</p>
                    {i.expired ? <Tag tone="bad">Link expired</Tag> : <Tag tone="warn">Invited</Tag>}
                  </div>
                  <p className="mt-0.5 text-sm text-[#8a847a]">{i.email ?? "no email yet"} · link made {shortDate(i.invited_at)}</p>
                </div>
                <NewLinkButton slug={slug} id={i.id} />
              </Row>
            ))}
          </Rows>
        </Panel>
      )}

      <Panel title={`Agents · ${agents.length}`}>
        <Rows>
          {agents.map((a) => (
            <Row key={a.id}>
              <div className="min-w-0">
                <p className="font-semibold">{a.name}</p>
                <p className="mt-0.5 truncate text-sm text-[#8a847a]">{a.email}</p>
              </div>
              <p className="text-xs text-[#8a847a]">{a.offers_count} active offer{a.offers_count === 1 ? "" : "s"} · joined {shortDate(a.joined_at)}</p>
            </Row>
          ))}
          {agents.length === 0 && <li><Empty>No agents yet. Make the first invite link above.</Empty></li>}
        </Rows>
      </Panel>
    </div>
  )
}
