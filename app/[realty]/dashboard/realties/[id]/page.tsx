import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"
import { Panel, Tag, display } from "@/components/dashboard-ui"
import { HashTabs } from "@/components/hash-tabs"
import { ApiError, api } from "@/lib/api"
import { longDate, shortDate, todayManila } from "@/lib/format"
import { requireSection } from "@/lib/realty-auth"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { DocumentsGallery } from "./documents-gallery"
import { DecisionPanel } from "./decision-panel"
import { PERIOD_TAG, type Period } from "../period"
import { PeriodPanel } from "./period-panel"

type Accreditation = {
  id: number
  status: "submitted" | "approved" | "rejected"
  invited_email: string
  /** "website": sent from the open form on the website, without an invite. */
  source: "invite" | "website"
  submitted_at: string | null
  details: {
    business_type: "corporation" | "sole_proprietor"
    firm_name: string
    residential_address: string
    tin_company: string | null
    tin_personal: string
    prc_number: string
    prc_valid_until: string
    hlurb_number: string | null
    hlurb_issued_at: string | null
    representative_name: string
    place_of_birth: string
    date_of_birth: string
    citizenship: string
    gender: "male" | "female"
    civil_status: string
    landline: string | null
    mobile: string
    login_email: string
    facebook: string | null
    years_in_real_estate: number
    years_firm_operating: number
    salespersons: number
  }
  documents: { id: number; kind: string; label: string; original_name: string; mime: string; size: number }[]
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  realty: { id: number; name: string; slug: string; login_url: string } | null
  login_pending: boolean
  /** Agreed online on the form (typed name), and the agreement to print (null until the developer sets it up). */
  agreed: { name: string; at: string } | null
  /** When they agreed to the data privacy notice on the form (older forms: null). */
  privacy_accepted_at: string | null
  agreement: object | null
  /** The newest certificate of accreditation (once the signed copy is checked). */
  certificate: { number: string; issued_at: string; status: "valid" | "expired" | "ended" | "replaced" } | null
  /** Accepted ones: how long it runs, and the signed copy. */
  period: Period | null
}

const STATUS = { submitted: { tone: "warn", label: "Pending review" }, approved: { tone: "good", label: "Accepted" }, rejected: { tone: "bad", label: "Not accepted" } } as const

const COPY = {
  verified: { value: "Checked", note: "signed and notarized" },
  submitted: { value: "To check", note: "uploaded, waiting for you" },
  returned: { value: "Sent back", note: "waiting for a new upload" },
  missing: { value: "Not uploaded", note: "" },
} as const

const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")

/**
 * jvconline.ph/<realty>/dashboard/realties/<id> — one accreditation at a glance (the decision, the
 * period, the signed agreement, the files), then tabs: Overview to act, Documents, and Details to read.
 */
export default async function AccreditationReviewPage({ params }: { params: Promise<{ realty: string; id: string }> }) {
  const { realty: slug, id } = await params
  const { user, token } = await requireSection(slug, "realties")
  if (!isDeveloperStaff(user)) redirect(`/${slug}/dashboard`)
  if (!/^\d+$/.test(id)) notFound()

  let a: Accreditation
  try {
    a = await api<Accreditation>(`/realty/realties/accreditations/${id}`, { token })
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }
  const d = a.details
  const status = STATUS[a.status]

  const p = a.period
  const copy = p ? COPY[p.signed_copy.status ?? "missing"] : null
  const until = !p ? { value: "—", note: "set when accepted" } : p.state === "open" ? { value: "No end date", note: "set one to start reminders" } : p.state === "ended" ? { value: "Ended", note: shortDate(p.ended_at) } : p.state === "expired" ? { value: "Expired", note: `last day ${shortDate(p.until)}` } : { value: shortDate(p.until), note: p.days_left !== null ? `${p.days_left} day${p.days_left === 1 ? "" : "s"} left` : "" }
  const glance = [
    { label: "Decision", value: status.label, note: a.status === "submitted" ? "waiting for you" : [a.reviewed_by, a.reviewed_at ? shortDate(a.reviewed_at) : null].filter(Boolean).join(" · "), href: "#overview", hot: a.status === "submitted" },
    { label: "Accredited until", value: until.value, note: until.note, href: "#overview", hot: p?.state === "ending" || p?.state === "expired" },
    {
      label: "Signed agreement",
      value: copy ? copy.value : a.agreed ? "Agreed online" : "—",
      note: copy ? (p?.signed_copy.status === "missing" || p?.signed_copy.status === null ? (p.signed_copy.due ? `due ${shortDate(p.signed_copy.due)}` : "") : copy.note) : a.agreed ? `by ${a.agreed.name}` : "",
      href: "#overview",
      hot: p?.signed_copy.status === "submitted" || !!p?.signed_copy.overdue,
    },
    { label: "Documents", value: `${a.documents.length} file${a.documents.length === 1 ? "" : "s"}`, note: a.documents.length ? "open them" : "none attached", href: "#documents", hot: false },
  ]

  const decision = (
    <DecisionPanel
      slug={slug}
      id={a.id}
      status={a.status}
      firm={d.firm_name}
      loginEmail={d.login_email}
      realty={a.realty}
      loginPending={a.login_pending}
      reviewedBy={a.reviewed_by}
      reviewedAt={a.reviewed_at}
      reviewNote={a.review_note}
      today={todayManila()}
    />
  )

  return (
    <div>
      <Link href={`/${slug}/dashboard/realties`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b665d] hover:text-[#17150f]">
        <ArrowLeft className="h-4 w-4" /> Realties
      </Link>

      {/* The realty at a glance: who, and where the accreditation stands. */}
      <section className="overflow-hidden rounded-2xl border border-[#e8eaed] bg-white shadow-[0_2px_12px_-2px_rgba(23,21,15,0.06)]">
        <div className="flex items-start gap-4 p-5 sm:items-center sm:gap-5 sm:p-6">
          <span aria-hidden className={`${display} flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#17150f] text-xl text-white sm:h-16 sm:w-16 sm:text-2xl`}>
            {initials(d.firm_name) || "R"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Accreditation</p>
              <Tag tone={status.tone}>{status.label}</Tag>
              {p && <Tag tone={PERIOD_TAG[p.state].tone}>{PERIOD_TAG[p.state].label}</Tag>}
            </div>
            <h1 className={`${display} mt-1 text-2xl leading-tight tracking-tight text-[#17150f] sm:text-3xl`}>{d.firm_name}</h1>
            <p className="mt-1 text-sm text-[#6b665d] sm:text-[15px]">
              {d.business_type === "corporation" ? "Corporation" : "Sole proprietor"} · sent {longDate(a.submitted_at)} · {a.source === "website" ? "from the website" : `invited as ${a.invited_email}`}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 border-t border-[#f0eeea] sm:grid-cols-4">
          {glance.map((g, i) => (
            <a key={g.label} href={g.href} className={`block min-w-0 px-5 py-3.5 transition hover:bg-[#faf8f5] ${i % 2 ? "border-l border-[#f0eeea]" : "sm:border-l sm:first:border-l-0"} ${i > 1 ? "border-t border-[#f0eeea] sm:border-t-0" : ""} border-[#f0eeea]`}>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a847a]">{g.label}</dt>
              <dd className={`${display} mt-0.5 truncate text-lg ${g.hot ? "text-[var(--accent)]" : "text-[#17150f]"}`}>{g.value}</dd>
              {g.note && <dd className="truncate text-xs text-[#6b665d]">{g.note}</dd>}
            </a>
          ))}
        </dl>
      </section>

      <HashTabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            badge: a.status === "submitted" || p?.signed_copy.status === "submitted" ? "to do" : null,
            tone: "accent",
            content: p ? (
              <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
                {decision}
                <PeriodPanel slug={slug} id={a.id} firm={d.firm_name} period={p} today={todayManila()} agreed={a.agreed} printable={a.agreement !== null} certificate={a.certificate} />
              </div>
            ) : (
              <>
                {decision}
                {a.status === "submitted" && (
                  <Panel title="Accreditation agreement" className="!mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[15px] text-[#3d3a34]">{a.agreed ? <>Agreed online by <strong>{a.agreed.name}</strong> on {longDate(a.agreed.at)}. Once accepted, they print it, sign it, have it notarized and upload it.</> : "Not agreed online: the form was sent before the agreement was set up."}</p>
                      {a.agreement && (
                        <Link href={`/${slug}/agreement?form=${a.id}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] hover:underline">
                          <Printer className="h-4 w-4" /> Read the agreement
                        </Link>
                      )}
                    </div>
                  </Panel>
                )}
              </>
            ),
          },
          {
            id: "documents",
            label: "Documents",
            short: "Files",
            badge: a.documents.length,
            content: (
              <div className="mt-6">
                <p className="text-sm text-[#6b665d]">Click a picture to enlarge it. Only Johndorf&apos;s staff can see these.</p>
                {a.documents.length === 0 ? <p className="py-6 text-sm text-[#8a847a]">No documents were attached.</p> : <DocumentsGallery base={`/${slug}/dashboard/realties/${a.id}/documents`} docs={a.documents} />}
              </div>
            ),
          },
          {
            id: "details",
            label: "Details",
            content: (
              <>
                <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
                  <Panel title="The firm" className="!mt-0">
                    <Details
                      rows={[
                        ["Type", d.business_type === "corporation" ? "Corporation" : "Sole proprietor"],
                        ["Realty firm or broker", d.firm_name],
                        ["Residential address", d.residential_address],
                        ["Tax ID (company)", d.tin_company],
                        ["Tax ID (personal)", d.tin_personal],
                        ["PRC registration no.", d.prc_number],
                        ["PRC valid until", longDate(d.prc_valid_until)],
                        ["HLURB registration no.", d.hlurb_number],
                        ["HLURB date issued", d.hlurb_issued_at ? longDate(d.hlurb_issued_at) : null],
                        ["Years in real estate", d.years_in_real_estate],
                        ["Years the firm has operated", d.years_firm_operating],
                        ["Salespersons", d.salespersons],
                      ]}
                    />
                  </Panel>
                  <Panel title="Representative" className="!mt-0">
                    <Details
                      rows={[
                        ["Full name", d.representative_name],
                        ["Place of birth", d.place_of_birth],
                        ["Date of birth", longDate(d.date_of_birth)],
                        ["Citizenship", d.citizenship],
                        ["Sex", d.gender === "male" ? "Male" : "Female"],
                        ["Civil status", d.civil_status],
                        ["Mobile", <a key="m" href={`tel:${d.mobile}`} className="hover:underline">{d.mobile}</a>],
                        ["Landline", d.landline],
                        ["Email (the username)", <a key="e" href={`mailto:${d.login_email}`} className="break-all hover:underline">{d.login_email}</a>],
                        ["Facebook", d.facebook],
                      ]}
                    />
                  </Panel>
                </div>
                <p className="mt-5 text-xs text-[#a39d92]">
                  {a.submitted_at ? `Form received ${shortDate(a.submitted_at)}.` : null}
                  {a.privacy_accepted_at ? ` Agreed to the data privacy notice ${shortDate(a.privacy_accepted_at)}.` : null}
                </p>
              </>
            ),
          },
        ]}
      />
    </div>
  )
}

/** Label and value pairs in a tidy grid; a missing value shows as a dash. */
function Details({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 pt-1 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a847a]">{label}</dt>
          <dd className="mt-1 break-words text-[15px] text-[#17150f]">{value === null || value === "" || value === undefined ? "—" : value}</dd>
        </div>
      ))}
    </dl>
  )
}
