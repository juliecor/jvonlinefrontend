import { redirect } from "next/navigation"
import { Empty, PageHeader, Panel, Row, Rows, Tag } from "@/components/dashboard-ui"
import { ContactButtons } from "@/components/leads"
import { api } from "@/lib/api"
import { shortDate } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { DeleteButton } from "../delete-button"
import { deleteAgent, deleteInvitation } from "./actions"
import { ApplicationActions } from "./application-actions"
import { InviteAgentForm } from "./invite-form"
import { NewLinkButton } from "./resend-button"

export const metadata = { title: "Agents" }

type Agents = {
  agents: { id: number; name: string; email: string; phone: string | null; joined_at: string; offers_count: number }[]
  applications: Application[]
  invitations: { id: number; name: string; email: string | null; phone: string | null; invited_at: string; expires_at: string; expired: boolean }[]
}

type Application = {
  id: number
  name: string
  email: string
  phone: string | null
  status: "pending" | "rejected"
  applied_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

/** jvconline.ph/<realty>/dashboard/agents — the team, applications to review, and invite links. Staff only. */
export default async function RealtyAgentsPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  if (user.role !== "realty") redirect(`/${slug}/dashboard`)
  const { agents, applications, invitations } = await api<Agents>("/realty/agents", { token })
  const waiting = applications.filter((a) => a.status === "pending")
  const rejected = applications.filter((a) => a.status === "rejected")

  return (
    <div>
      <PageHeader eyebrow="Team" title="Agents" lede={`Your agents sign in at jvconline.ph/${slug}/login and send buyers sales offers under your name.`} />

      <Panel title="Invite an agent" aside="You send the link; they apply, and you approve them here">
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
                  <p className="mt-0.5 text-sm text-[#8a847a]">
                    {i.email ?? "no email yet"}
                    {i.phone && (
                      <>
                        {" · "}
                        <a href={`tel:${i.phone}`} className="hover:text-[#17150f] hover:underline">
                          {i.phone}
                        </a>
                      </>
                    )}{" "}
                    · link made {shortDate(i.invited_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2 sm:justify-end">
                  <NewLinkButton slug={slug} id={i.id} />
                  <DeleteButton
                    action={deleteInvitation.bind(null, slug, i.id)}
                    title={`Delete ${i.name}'s invitation?`}
                    body="Their link stops working. You can make a new invite for them later."
                    success="Invitation deleted"
                    className="border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold text-[#17150f] hover:border-red-400 hover:text-red-700"
                  />
                </div>
              </Row>
            ))}
          </Rows>
        </Panel>
      )}

      {waiting.length > 0 && (
        <Panel title={`Pending approval · ${waiting.length}`} aside="They can sign in once you approve them">
          <Rows>
            {waiting.map((a) => (
              <ApplicationRow key={a.id} slug={slug} application={a} />
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
                <p className="mt-0.5 truncate text-sm text-[#8a847a]">
                  {a.email}
                  {a.phone && (
                    <>
                      {" · "}
                      <a href={`tel:${a.phone}`} className="hover:text-[#17150f] hover:underline">
                        {a.phone}
                      </a>
                    </>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-xs text-[#8a847a]">{a.offers_count} active offer{a.offers_count === 1 ? "" : "s"} · joined {shortDate(a.joined_at)}</p>
                <DeleteButton
                  action={deleteAgent.bind(null, slug, a.id)}
                  title={`Delete ${a.name}?`}
                  body="They can no longer sign in. Their offers stay, but without an agent on them. They can be invited again later. This can't be undone."
                  success={`${a.name} deleted`}
                />
              </div>
            </Row>
          ))}
          {agents.length === 0 && <li><Empty>No agents yet. Make the first invite link above.</Empty></li>}
        </Rows>
      </Panel>

      {rejected.length > 0 && (
        <Panel title={`Rejected · ${rejected.length}`} aside="Delete one to invite that email again">
          <Rows>
            {rejected.map((a) => (
              <ApplicationRow key={a.id} slug={slug} application={a} />
            ))}
          </Rows>
        </Panel>
      )}
    </div>
  )
}

/** One application: who they are, how to reach them, and the staff's decision. */
function ApplicationRow({ slug, application: a }: { slug: string; application: Application }) {
  return (
    <li className="flex flex-col gap-4 py-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{a.name}</p>
            {a.status === "pending" ? <Tag tone="warn">Pending</Tag> : <Tag tone="bad">Rejected</Tag>}
          </div>
          <p className="mt-0.5 text-sm text-[#8a847a]">
            {a.email}
            {a.phone && (
              <>
                {" · "}
                <a href={`tel:${a.phone}`} className="hover:text-[#17150f] hover:underline">
                  {a.phone}
                </a>
              </>
            )}{" "}
            · applied {shortDate(a.applied_at)}
            {a.status === "rejected" && a.reviewed_at && <> · rejected {shortDate(a.reviewed_at)}{a.reviewed_by && <> by {a.reviewed_by}</>}</>}
          </p>
        </div>
        {a.status === "pending" && <ContactButtons phone={a.phone} email={a.email} via={null} />}
      </div>
      <ApplicationActions slug={slug} id={a.id} name={a.name} status={a.status} />
    </li>
  )
}
