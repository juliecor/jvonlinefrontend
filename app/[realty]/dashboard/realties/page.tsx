import Link from "next/link"
import { redirect } from "next/navigation"
import { Empty, PageHeader, Panel, Row, Rows, Tag } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { shortDate } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { InviteRealtyForm } from "./invite-form"
import { DeleteButton } from "../delete-button"
import { deleteAccreditation, deleteBroker } from "./actions"
import { ResendInviteButton } from "./resend-invite-button"

export const metadata = { title: "Realty Company Invitation" }

type Overview = {
  pending: { id: number; firm_name: string; business_type: "corporation" | "sole_proprietor"; representative_name: string; email: string; submitted_at: string; documents_count: number }[]
  brokers: { id: number; name: string; slug: string; contact_name: string | null; email: string | null; phone: string | null; agents_count: number; offers_count: number; accredited_at: string; accreditation_id: number | null }[]
  invited: { id: number; email: string; invited_at: string; expires_at: string; expired: boolean; invited_by: string | null }[]
  rejected: { id: number; firm_name: string; email: string; review_note: string | null; reviewed_at: string }[]
}

const TYPE_LABEL = { corporation: "Corporation", sole_proprietor: "Sole proprietor" } as const

/** jvconline.ph/<realty>/dashboard/realties — realties accredited under this developer: invite, review, accept. Developer admins only. */
export default async function RealtiesPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  if (!isDeveloperStaff(user)) redirect(`/${slug}/dashboard`)
  const { pending, brokers, invited, rejected } = await api<Overview>("/realty/realties", { token })

  return (
    <div>
      <PageHeader eyebrow="Team" title="Realty Company Invitation" lede={`Realties accredited under ${user.realty.name} sell your projects and units through their own agents. Invite one by email, read its form, then accept it.`} />

      <Panel title="Invite a realty" aside="They get an email with a link to the accreditation form. It works for 7 days.">
        <div className="pt-5">
          <InviteRealtyForm slug={slug} />
        </div>
      </Panel>

      {pending.length > 0 && (
        <Panel title={`Pending review · ${pending.length}`} aside="Open one to read its form and documents, then accept it or turn it down">
          <Rows>
            {pending.map((a) => (
              <Row key={a.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold">{a.firm_name}</p>
                    <Tag tone="warn">Pending</Tag>
                    <Tag>{TYPE_LABEL[a.business_type]}</Tag>
                  </div>
                  <p className="mt-0.5 text-sm text-[#6b665d]">
                    {a.representative_name} · {a.email} · sent {shortDate(a.submitted_at)} · {a.documents_count} document{a.documents_count === 1 ? "" : "s"}
                  </p>
                </div>
                <Link href={`/${slug}/dashboard/realties/${a.id}`} className="inline-flex items-center border border-[#17150f] bg-[#17150f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#3d3a34]">
                  Review
                </Link>
              </Row>
            ))}
          </Rows>
        </Panel>
      )}

      {invited.length > 0 && (
        <Panel title={`Waiting for the form · ${invited.length}`} aside="Invited, but the form isn't in yet">
          <Rows>
            {invited.map((i) => (
              <Row key={i.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{i.email}</p>
                    {i.expired ? <Tag tone="bad">Link expired</Tag> : <Tag tone="warn">Invited</Tag>}
                  </div>
                  <p className="mt-0.5 text-sm text-[#8a847a]">
                    invited {shortDate(i.invited_at)}
                    {i.invited_by && <> by {i.invited_by}</>} · {i.expired ? "expired" : "works until"} {shortDate(i.expires_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2 sm:justify-end">
                  <ResendInviteButton slug={slug} id={i.id} email={i.email} />
                  <DeleteButton
                    action={deleteAccreditation.bind(null, slug, i.id)}
                    title={`Delete the invite to ${i.email}?`}
                    body="Their link stops working. You can invite the same email again later."
                    success="Invite deleted"
                    className="border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold text-[#17150f] hover:border-red-400 hover:text-red-700"
                  />
                </div>
              </Row>
            ))}
          </Rows>
        </Panel>
      )}

      <Panel title={`Accredited realties · ${brokers.length}`} aside="Each has its own sign-in and dashboard, and sells your units">
        <Rows>
          {brokers.map((b) => (
            <Row key={b.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold">{b.name}</p>
                  <Tag tone="good">Accredited</Tag>
                </div>
                <p className="mt-0.5 text-sm text-[#6b665d]">
                  jvconline.ph/{b.slug}/login · accredited {shortDate(b.accredited_at)}
                </p>
                <p className="mt-0.5 truncate text-sm text-[#8a847a]">{[b.contact_name, b.email, b.phone].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6b665d]">
                <span>
                  <strong className="font-bold tabular-nums text-[#17150f]">{b.agents_count}</strong> agent{b.agents_count === 1 ? "" : "s"}
                </span>
                <span>
                  <strong className="font-bold tabular-nums text-[#17150f]">{b.offers_count}</strong> offer{b.offers_count === 1 ? "" : "s"}
                </span>
                {b.accreditation_id && (
                  <Link href={`/${slug}/dashboard/realties/${b.accreditation_id}`} className="font-bold text-[var(--accent)] hover:underline">
                    Its form
                  </Link>
                )}
                <DeleteButton
                  action={deleteBroker.bind(null, slug, b.id)}
                  title={`Delete ${b.name}?`}
                  body={`${b.name}'s ${b.agents_count} agent${b.agents_count === 1 ? "" : "s"} and staff lose their sign-in for good, and its accreditation form is removed. A realty that has sold offers can't be deleted. This can't be undone.`}
                  success={`${b.name} deleted`}
                  className="border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold text-[#17150f] hover:border-red-400 hover:text-red-700"
                />
              </div>
            </Row>
          ))}
          {brokers.length === 0 && (
            <li>
              <Empty>No realties accredited yet. Invite the first one above.</Empty>
            </li>
          )}
        </Rows>
      </Panel>

      {rejected.length > 0 && (
        <Panel title={`Not accepted · ${rejected.length}`} aside="Invite the same email again to give them another go">
          <Rows>
            {rejected.map((r) => (
              <Row key={r.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{r.firm_name}</p>
                    <Tag tone="bad">Not accepted</Tag>
                  </div>
                  <p className="mt-0.5 text-sm text-[#8a847a]">
                    {r.email} · {shortDate(r.reviewed_at)}
                  </p>
                  {r.review_note && <p className="mt-1 text-sm text-[#3d3a34]">&ldquo;{r.review_note}&rdquo;</p>}
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <Link href={`/${slug}/dashboard/realties/${r.id}`} className="text-sm font-bold text-[var(--accent)] hover:underline">
                    View
                  </Link>
                  <DeleteButton
                    action={deleteAccreditation.bind(null, slug, r.id)}
                    title={`Delete ${r.firm_name}'s form?`}
                    body="The form and the files they attached are removed. This can't be undone."
                    success="Form deleted"
                    className="border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold text-[#17150f] hover:border-red-400 hover:text-red-700"
                  />
                </div>
              </Row>
            ))}
          </Rows>
        </Panel>
      )}
    </div>
  )
}
