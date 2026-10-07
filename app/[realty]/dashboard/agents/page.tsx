import { redirect } from "next/navigation"
import { ExternalLink, FileText } from "lucide-react"
import { Empty, PageHeader, Panel, Row, Rows, Tag } from "@/components/dashboard-ui"
import { ContactButtons } from "@/components/leads"
import { api } from "@/lib/api"
import { shortDate } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { fileSize } from "@/lib/requirements-types"
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
  has_resume: boolean
  resume_name: string | null
  resume_size: number | null
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
                <NewLinkButton slug={slug} id={i.id} />
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
              <p className="text-xs text-[#8a847a]">{a.offers_count} active offer{a.offers_count === 1 ? "" : "s"} · joined {shortDate(a.joined_at)}</p>
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

/** One application: who they are, how to reach them, their resume, and the staff's decision. */
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
            {a.phone && <> · {a.phone}</>} · applied {shortDate(a.applied_at)}
            {a.status === "rejected" && a.reviewed_at && <> · rejected {shortDate(a.reviewed_at)}{a.reviewed_by && <> by {a.reviewed_by}</>}</>}
          </p>
        </div>
        {a.has_resume ? (
          <a href={`/${slug}/dashboard/agents/${a.id}/resume`} target="_blank" rel="noreferrer" className="group inline-flex max-w-full items-center gap-3 border border-[#e6e2db] bg-white px-3 py-2.5 hover:border-[var(--accent)]">
            <FileText className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold group-hover:text-[var(--accent)]">
                <span className="truncate">{a.resume_name ?? "Resume"}</span> <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </span>
              <span className="block text-xs text-[#8a847a]">Resume{a.resume_size ? ` · ${fileSize(a.resume_size)}` : ""}</span>
            </span>
          </a>
        ) : (
          <p className="text-xs text-[#8a847a]">No resume on file.</p>
        )}
        {a.status === "pending" && <ContactButtons phone={a.phone} email={a.email} via={null} />}
      </div>
      <ApplicationActions slug={slug} id={a.id} name={a.name} status={a.status} />
    </li>
  )
}
