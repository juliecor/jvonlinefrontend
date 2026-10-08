import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ExternalLink, FileText } from "lucide-react"
import { PageHeader, Panel, Tag } from "@/components/dashboard-ui"
import { ApiError, api } from "@/lib/api"
import { longDate, shortDate } from "@/lib/format"
import { fileSize } from "@/lib/requirements-types"
import { requireRealtyUser } from "@/lib/realty-auth"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { DecisionPanel } from "./decision-panel"

type Accreditation = {
  id: number
  status: "submitted" | "approved" | "rejected"
  invited_email: string
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
}

const STATUS = { submitted: { tone: "warn", label: "Pending review" }, approved: { tone: "good", label: "Accepted" }, rejected: { tone: "bad", label: "Not accepted" } } as const

/** jvconline.ph/<realty>/dashboard/realties/<id> — one accreditation form, laid out to read, with its documents and the decision. */
export default async function AccreditationReviewPage({ params }: { params: Promise<{ realty: string; id: string }> }) {
  const { realty: slug, id } = await params
  const { user, token } = await requireRealtyUser(slug)
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

  return (
    <div>
      <Link href={`/${slug}/dashboard/realties`} className="inline-flex items-center gap-1.5 text-sm text-[#6b665d] hover:text-[#17150f]">
        <ArrowLeft className="h-4 w-4" /> Realties
      </Link>
      <div className="mt-3">
        <PageHeader
          eyebrow="Accreditation"
          title={d.firm_name}
          lede={`${d.business_type === "corporation" ? "Corporation" : "Sole proprietor"} · sent ${longDate(a.submitted_at)} · invited as ${a.invited_email}`}
          action={<Tag tone={status.tone}>{status.label}</Tag>}
        />
      </div>

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
      />

      <Panel title="Accreditation details">
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
          ]}
        />
      </Panel>

      <Panel title="Representative">
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
            ["Email (the username)", <a key="e" href={`mailto:${d.login_email}`} className="hover:underline">{d.login_email}</a>],
            ["Facebook", d.facebook],
          ]}
        />
      </Panel>

      <Panel title="The firm in numbers">
        <Details
          rows={[
            ["Years in real estate", d.years_in_real_estate],
            ["Years the firm has operated", d.years_firm_operating],
            ["Salespersons", d.salespersons],
          ]}
        />
      </Panel>

      <Panel title={`Documents · ${a.documents.length}`} aside="Open in a new tab. Only you can see these.">
        {a.documents.length === 0 ? (
          <p className="py-6 text-sm text-[#8a847a]">No documents were attached.</p>
        ) : (
          <ul className="divide-y divide-[#e6e2db]">
            {a.documents.map((doc) => (
              <li key={doc.id}>
                <a href={`/${slug}/dashboard/realties/${a.id}/documents/${doc.id}`} target="_blank" rel="noreferrer" className="group flex items-start gap-4 py-5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#e6e2db] bg-[#f6f4f0] text-[#8a847a]">
                    <FileText className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] leading-relaxed text-[#17150f]">{doc.label}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] group-hover:underline">
                      <span className="truncate">{doc.original_name}</span> <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </span>
                    <span className="mt-0.5 block text-xs text-[#8a847a]">{fileSize(doc.size)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <p className="mt-6 text-xs text-[#a39d92]">{a.submitted_at ? `Form received ${shortDate(a.submitted_at)}.` : null}</p>
    </div>
  )
}

/** Label and value pairs in a tidy grid; a missing value shows as a dash. */
function Details({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-10 gap-y-5 pt-5 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b665d]">{label}</dt>
          <dd className="mt-1 break-words text-[15px] text-[#17150f]">{value === null || value === "" || value === undefined ? "—" : value}</dd>
        </div>
      ))}
    </dl>
  )
}
