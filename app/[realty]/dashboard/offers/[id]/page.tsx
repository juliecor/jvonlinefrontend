import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { Ledger, PageHeader, Panel, Tag, btn } from "@/components/dashboard-ui"
import { ContactButtons, LeadTag, VIA_LABEL, type Lead } from "@/components/leads"
import { ApiError, api } from "@/lib/api"
import { longDate, php, shortDate, sqm, timeAgo } from "@/lib/format"
import { INCOME_SOURCES, type Requirement, type RequirementSummary } from "@/lib/requirements-types"
import { type MilestoneInput, type ScheduleRow, pct } from "@/lib/schedule"
import { requireRealtyUser } from "@/lib/realty-auth"
import { voidOffer } from "../actions"
import { LoginPanel } from "../buyer-login"
import { ApprovalPanel } from "./approval-panel"
import { FollowUp, RequirementsPanel } from "./requirements-panel"
import { SyncCounts } from "./sync"

export const metadata = { title: "Offer" }

type OfferDetail = {
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
  first_viewed_at: string | null
  last_viewed_at: string | null
  responses_count: number
  new_responses: number
  schedule: ScheduleRow[]
  fee_notes: string | null
  unit_detail: { name: string | null; unit_type: string | null; area_sqm: number | null; status: string | null }
  responses: Lead[]
  buyer_phone: string | null
  buyer_details: Record<string, string | boolean | null> | null
  details_submitted_at: string | null
  requirements: Requirement[]
  requirements_summary: RequirementSummary
  offer_emailed_at: string | null
  last_reminded_at: string | null
  reminders_sent: number
  buyer_email_for_mail: string | null
  access_username: string | null
  access_password: string | null
  agent_id: number | null
  custom: boolean
  custom_milestones: MilestoneInput[] | null
  approval_status: "pending" | "approved" | "rejected" | null
  approval_reason: string | null
  approval_note: string | null
  approved_by: string | null
  approved_at: string | null
  plan_name: string | null
  official_plans: { name: string; schedule: ScheduleRow[] }[]
}

/** The buyer information form, grouped the way the buyer filled it in. */
const DETAIL_GROUPS: { title: string; rows: [string, string][] }[] = [
  { title: "Personal", rows: [["first_name", "First name"], ["middle_name", "Middle name"], ["last_name", "Last name"], ["name_extension", "Extension"], ["birth_date", "Birth date"], ["civil_status", "Civil status"], ["spouse_name", "Spouse"], ["gender", "Gender"], ["citizenship", "Citizenship"], ["religion", "Religion"]] },
  { title: "Contact & IDs", rows: [["email", "Email"], ["phone", "Mobile"], ["messenger", "Messenger / Viber"], ["tin", "TIN"], ["sss", "SSS / GSIS"], ["pagibig_mid", "Pag-IBIG MID"]] },
  { title: "Address", rows: [["current_address", "Current"], ["provincial_address", "Provincial"], ["zip", "Zip code"], ["home_ownership", "Current home"], ["rent_cost", "Monthly rent"]] },
  { title: "Work & income", rows: [["income_source", "Source"], ["employer", "Employer / business"], ["position", "Position"], ["monthly_income", "Monthly income"], ["co_borrower", "Co-borrower"], ["co_borrower_name", "Co-borrower name"], ["co_borrower_relationship", "Relationship"]] },
]

const detailValue = (key: string, v: string | boolean | null | undefined) => {
  if (v === null || v === undefined || v === "") return null
  if (key === "income_source") return INCOME_SOURCES.find((x) => x.v === v)?.l ?? String(v)
  if (key === "co_borrower") return v ? "Yes" : "No"
  if (key === "birth_date" && typeof v === "string") return longDate(v)
  return String(v)
}

/** jvconline.ph/<realty>/dashboard/offers/<id> — one offer: did the buyer open it, what did they say, and how to reach them. */
export default async function OfferDetailPage({ params }: { params: Promise<{ realty: string; id: string }> }) {
  const { realty: slug, id } = await params
  const { user, token } = await requireRealtyUser(slug)
  if (!/^\d+$/.test(id)) notFound()
  let o: OfferDetail
  try {
    o = await api<OfferDetail>(`/realty/offers/${id}`, { token })
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }
  const staff = user.role === "realty"
  const hadNew = o.responses.some((r) => r.new)
  const awaiting = o.approval_status === "pending" || o.approval_status === "rejected"
  const live = o.status === "active" && !awaiting
  const latest = o.responses[0]

  // What happened, newest first: responses, views, the offer being sent.
  const activity = [
    ...o.responses.map((r) => ({ at: r.created_at, text: `${r.name} answered: ${r.label}` })),
    ...(o.last_viewed_at && o.views > 1 ? [{ at: o.last_viewed_at, text: "Opened the offer again" }] : []),
    ...(o.first_viewed_at ? [{ at: o.first_viewed_at, text: "Opened the offer for the first time" }] : []),
    { at: o.created_at, text: `${o.agent ?? "The agent"} sent the offer` },
    ...(o.offer_emailed_at ? [{ at: o.offer_emailed_at, text: "Offer emailed to the buyer" }] : []),
    ...(o.details_submitted_at ? [{ at: o.details_submitted_at, text: "Buyer sent their details" }] : []),
    ...o.requirements.flatMap((r) => r.files.map((f) => ({ at: f.uploaded_at, text: `Buyer sent ${r.name}` }))),
    ...(o.last_reminded_at ? [{ at: o.last_reminded_at, text: `Reminder emailed${o.reminders_sent > 1 ? ` (${o.reminders_sent} so far)` : ""}` }] : []),
  ].sort((a, b) => b.at.localeCompare(a.at))
  const req = o.requirements_summary
  const todo = o.requirements.filter((r) => r.needed === "required" && (r.state === "missing" || r.state === "rejected"))
  const first = o.buyer_name.split(" ")[0]
  const missingList = [...(o.details_submitted_at ? [] : ["your details (the buyer form)"]), ...todo.map((r) => r.name)]
  const viberText = `Hi ${first}! This is ${o.agent ?? "your agent"}. For your reservation of ${o.unit ?? "the unit"}${o.project ? ` at ${o.project}` : ""}, we still need: ${missingList.join(", ")}. You can send them from your phone here: ${o.url}#requirements`

  return (
    <div>
      {hadNew && <SyncCounts slug={slug} />}
      <Link href={`/${slug}/dashboard/offers`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b665d] hover:text-[#17150f]">
        <ArrowLeft className="h-4 w-4" /> All offers
      </Link>
      <PageHeader
        eyebrow={`Sales offer · ${o.code}`}
        title={o.buyer_name}
        lede={[o.project, o.unit, staff && o.agent ? `by ${o.agent}` : null].filter(Boolean).join(" · ")}
        action={
          o.status === "active" && awaiting ? (
            <a href={o.url} target="_blank" rel="noreferrer" className={`${btn.ghost} !px-4 !py-3 !text-sm`}>
              Preview buyer&apos;s page <ExternalLink className="h-4 w-4" />
            </a>
          ) : o.status === "active" ? (
            <>
              <CopyButton text={o.url} className="!rounded-none !px-4 !py-3 !text-sm" />
              <a href={o.url} target="_blank" rel="noreferrer" className={btn.primary}>
                Open buyer&apos;s page <ExternalLink className="h-4 w-4" />
              </a>
            </>
          ) : (
            <Tag tone="bad">Void</Tag>
          )
        }
      />

      {o.approval_status && o.status === "active" && (
        <ApprovalPanel
          slug={slug}
          offerId={o.id}
          status={o.approval_status}
          isStaff={staff}
          canEdit={staff || o.agent_id === user.id}
          agent={o.agent}
          reason={o.approval_reason}
          note={o.approval_note}
          approvedBy={o.approved_by}
          approvedAt={o.approved_at}
          price={o.price}
          projectName={o.project}
          schedule={o.schedule}
          customMilestones={o.custom_milestones ?? []}
          officialPlans={o.official_plans}
        />
      )}

      {o.status === "active" && (
        <LoginPanel slug={slug} offerId={o.id} buyer={o.buyer_name} realty={user.realty.name} url={o.url} username={o.access_username} password={o.access_password} />
      )}

      <Ledger
        items={[
          { label: "Opened", value: o.views ? `${o.views}×` : "Not yet", note: o.views ? `last ${timeAgo(o.last_viewed_at)}` : "the buyer hasn't opened the link" },
          { label: "Response", value: latest ? latest.label : "None yet", note: latest ? timeAgo(latest.created_at) : "waiting for the buyer" },
          ...(o.requirements.length ? [{ label: "Requirements", value: `${req.submitted + (req.details ? 1 : 0)}/${req.required + 1}`, note: req.to_review ? `${req.to_review} file${req.to_review === 1 ? "" : "s"} to review` : req.missing || !req.details ? "still missing items" : "all in" }] : []),
          { label: "Price", value: php(o.price), note: `sent ${shortDate(o.created_at)}` },
        ]}
      />

      {o.requirements.length > 0 && (
        <Panel title={`Requirements · ${req.submitted + (req.details ? 1 : 0)} of ${req.required + 1} in`} aside={req.to_review ? <span className="font-bold text-amber-700">{req.to_review} to review</span> : undefined}>
          <div className="grid gap-x-10 gap-y-6 pt-5 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e2db] pb-5">
                <div>
                  <p className="text-lg font-bold">Buyer details</p>
                  <p className="text-sm text-[#6b665d]">{o.details_submitted_at ? `Sent ${longDate(o.details_submitted_at)} · with Data Privacy consent` : "Not sent yet. The buyer fills these in on the offer page."}</p>
                </div>
                <span className={`border px-2.5 py-1 text-xs font-bold ${o.details_submitted_at ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-[#d9d4cb] text-[#6b665d]"}`}>{o.details_submitted_at ? "Received" : "Missing"}</span>
              </div>
              <RequirementsPanel slug={slug} offerId={o.id} requirements={o.requirements} />
            </div>
            <div className="space-y-6">
              <FollowUp
                slug={slug}
                offerId={o.id}
                email={o.buyer_email_for_mail}
                emailedAt={o.offer_emailed_at}
                remindedAt={o.last_reminded_at}
                reminders={o.reminders_sent}
                viberText={viberText}
                active={live}
                nothingMissing={missingList.length === 0}
              />
            </div>
          </div>
        </Panel>
      )}

      {o.buyer_details && (
        <Panel title="Buyer details" aside="Personal information: for this purchase only">
          <div className="grid gap-x-10 gap-y-8 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {DETAIL_GROUPS.map((g) => (
              <div key={g.title}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b665d]">{g.title}</p>
                <dl className="mt-2 space-y-2 text-sm">
                  {g.rows.map(([k, l]) => {
                    const v = detailValue(k, o.buyer_details?.[k])
                    return v ? (
                      <div key={k}>
                        <dt className="text-[#8a847a]">{l}</dt>
                        <dd className="break-words font-semibold">{v}</dd>
                      </div>
                    ) : null
                  })}
                </dl>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid gap-x-12 lg:grid-cols-[1.5fr_1fr]">
        <Panel title={`Buyer responses · ${o.responses.length}`}>
          {o.responses.length ? (
            <ul className="divide-y divide-[#e6e2db]">
              {o.responses.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <LeadTag kind={r.kind} label={r.label} />
                    <span className="text-sm font-medium text-[#8a847a]">
                      {timeAgo(r.created_at)} · {longDate(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-bold tracking-tight">{r.name}</p>
                  <p className="mt-1 text-[15px] text-[#3d3a34]">
                    {[r.phone, r.email].filter(Boolean).join(" · ") || "No contact details left"}
                    {r.contact_via && r.kind !== "not_interested" && <span className="text-[#8a847a]"> · prefers {VIA_LABEL[r.contact_via]}</span>}
                  </p>
                  {r.message && <blockquote className="mt-4 border-l-4 border-[var(--accent)] bg-[#f6f4f0] px-4 py-3 text-[15px] leading-relaxed text-[#17150f]">{r.message}</blockquote>}
                  <div className="mt-4">
                    <ContactButtons phone={r.phone} email={r.email} via={r.contact_via} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8">
              <p className="text-lg font-bold">No response yet.</p>
              <p className="mt-1 max-w-lg text-[15px] text-[#5a554d]">
                The offer page asks {o.buyer_name.split(" ")[0]} what they&apos;d like to do: they&apos;re interested, they have a question, or it&apos;s not for them. Their answer shows up here
                {o.agent ? `, and ${staff ? o.agent : "you"} get${staff ? "s" : ""} an email` : ""}.
              </p>
              {o.status === "active" && !o.views && <p className="mt-3 text-sm font-semibold text-amber-700">They haven&apos;t opened the link yet. Copy it and send it again?</p>}
            </div>
          )}
        </Panel>

        <div>
          <Panel title="Activity">
            <ol className="relative mt-4 space-y-5 border-l-2 border-[#e6e2db] pl-5">
              {activity.map((a, i) => (
                <li key={i} className="relative">
                  <span aria-hidden className={`absolute -left-[27px] top-1.5 h-3 w-3 ${i === 0 ? "bg-[var(--accent)]" : "bg-[#d9d4cb]"}`} />
                  <p className="text-[15px] font-semibold">{a.text}</p>
                  <p className="text-sm text-[#8a847a]">
                    {shortDate(a.at)} · {new Date(a.at).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" })}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="The offer">
            <dl className="divide-y divide-[#e6e2db] text-[15px]">
              {[
                ["Unit", [o.unit_detail.name, o.unit_detail.unit_type].filter(Boolean).join(" · ") || "—"],
                ["Floor area", sqm(o.unit_detail.area_sqm)],
                ["Buyer email", o.buyer_email ?? "—"],
                ["Buyer mobile", o.buyer_phone ?? "—"],
                ["Purchase date", longDate(o.purchase_date)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-[#8a847a]">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#6b665d]">Payment schedule · {o.custom ? "custom terms" : (o.plan_name ?? "full payment")}</h3>
            <ul className="mt-2 divide-y divide-[#e6e2db] text-sm">
              {o.schedule.map((s, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 py-2">
                  <span className="min-w-0">
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-[#8a847a]">
                      {" "}
                      · {pct(s.percent)}
                      {s.months && s.end_date ? ` · ${s.months} × ${php(s.monthly)}, ${shortDate(s.date)} – ${shortDate(s.end_date)}` : s.date ? ` · ${shortDate(s.date)}` : " · on completion"}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">{php(s.amount)}</span>
                </li>
              ))}
            </ul>
            {o.status === "active" && (
              <form action={voidOffer.bind(null, slug, o.id)} className="mt-6 border-t border-[#e6e2db] pt-4">
                <button type="submit" className="text-sm font-semibold text-[#8a847a] hover:text-red-700">Void this offer</button>
                <p className="mt-1 text-xs text-[#a39d92]">The buyer&apos;s link stops working. Responses already received stay here.</p>
              </form>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
