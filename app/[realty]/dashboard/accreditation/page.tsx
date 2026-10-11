import Link from "next/link"
import { redirect } from "next/navigation"
import { Award, CircleCheck, Printer } from "lucide-react"
import { Certificate, type CertificateData } from "@/components/certificate"
import { CopyButton } from "@/components/copy-button"
import { PageHeader, Panel, Tag } from "@/components/dashboard-ui"
import { ApiError, api } from "@/lib/api"
import { longDate, shortDate } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { isBroker } from "@/lib/realty-roles"
import { PERIOD_TAG, type Period } from "../realties/period"
import { UploadSignedCopy } from "./upload-signed"

export const metadata = { title: "Accreditation" }

type Mine = {
  developer: string
  state: Period["state"]
  from: string | null
  until: string | null
  days_left: number | null
  end_note: string | null
  agreed: { name: string; at: string } | null
  agreement: object | null
  /** Issued once the developer checks the signed copy. */
  certificate: CertificateData | null
  signed_copy: {
    status: Period["signed_copy"]["status"]
    due: string | null
    note: string | null
    name: string | null
    uploaded_at: string | null
  }
}

/**
 * jvconline.ph/<realty>/dashboard/accreditation — an accredited realty's own accreditation:
 * how long it runs, and the agreement to print, sign, notarize and upload. Its admins only.
 */
export default async function MyAccreditationPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  if (!isBroker(user) || user.role !== "realty") redirect(`/${slug}/dashboard`)

  let a: Mine | null = null
  try {
    a = await api<Mine>("/realty/accreditation", { token })
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) throw e
  }
  const developer = user.realty.developer?.name ?? "the developer"

  if (!a) {
    return (
      <div>
        <PageHeader eyebrow="Team" title="Accreditation" lede={`Your accreditation with ${developer}.`} />
        <p className="mt-10 text-[15px] text-[#5a554d]">
          There is no accreditation form on file for {user.realty.name}. Ask {developer} if anything is needed.
        </p>
      </div>
    )
  }

  const copy = a.signed_copy
  const stopped = a.state === "expired" || a.state === "ended"
  const late = (copy.status === "missing" || copy.status === "returned") && copy.due !== null && copy.due < new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
  const headline = {
    active: `Accredited until ${longDate(a.until)}`,
    ending: `Ends ${a.days_left === 0 ? "today" : `in ${a.days_left} day${a.days_left === 1 ? "" : "s"}`} · ${longDate(a.until)}`,
    expired: `Expired on ${longDate(a.until)}`,
    ended: `Ended by ${a.developer}`,
    open: "Accredited",
  }[a.state]

  return (
    <div>
      <PageHeader eyebrow="Team" title="Accreditation" lede={`${user.realty.name} is accredited by ${a.developer} to sell its projects.`} action={<Tag tone={PERIOD_TAG[a.state].tone}>{PERIOD_TAG[a.state].label}</Tag>} />

      <Panel title="Accreditation period">
        <div className="pt-5">
          <p className={`text-2xl font-bold tracking-tight ${stopped ? "text-red-800" : a.state === "ending" ? "text-amber-800" : "text-[#17150f]"}`}>{headline}</p>
          {a.from && <p className="mt-1 text-[15px] text-[#5a554d]">Started {longDate(a.from)}.</p>}
          {stopped && (
            <p className="mt-3 border-l-4 border-red-600 bg-red-50 px-4 py-2.5 text-[15px] font-semibold text-red-800">
              You can&apos;t make new offers until {a.developer} renews it. Offers you already made carry on.
              {a.state === "ended" && a.end_note && <span className="mt-1 block font-normal">Their note: &ldquo;{a.end_note}&rdquo;</span>}
            </p>
          )}
          {a.state === "ending" && <p className="mt-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5 text-[15px] text-amber-950">Ask {a.developer} to renew it before it ends, so you can keep making offers.</p>}
        </div>
      </Panel>

      <Panel title="Certificate of accreditation">
        {a.certificate ? (
          <div className="grid gap-6 pt-5 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              {a.certificate.status === "valid" ? (
                <>
                  <p className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#17150f]">
                    <Award className="h-7 w-7 shrink-0 text-[var(--accent)]" /> Congratulations!
                  </p>
                  <p className="mt-2 text-[15px] text-[#3d3a34]">
                    {user.realty.name} is fully accredited by {a.developer} until <strong>{longDate(a.certificate.until)}</strong>.
                  </p>
                </>
              ) : (
                <p className="text-[15px] font-semibold text-red-800">This certificate is no longer valid. A new one comes when {a.developer} renews your accreditation.</p>
              )}
              <p className="mt-3 text-sm text-[#6b665d]">Certificate No. {a.certificate.number}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link href={`/${slug}/certificate`} target="_blank" className="inline-flex items-center gap-2 bg-[#17150f] px-5 py-3 text-[15px] font-bold text-white hover:bg-[#3d3a34]">
                  <Printer className="h-5 w-5" /> View and print
                </Link>
                <CopyButton text={a.certificate.verify_url} label="Copy check link" className="bg-white" />
              </div>
              <p className="mt-3 text-sm text-[#6b665d]">Share the check link with buyers: it shows anyone that your certificate is real and still valid.</p>
            </div>
            <Link href={`/${slug}/certificate`} target="_blank" aria-label="Open the certificate" className="block shadow-[0_20px_45px_-25px_rgba(23,21,15,0.6)] transition hover:-translate-y-0.5">
              <Certificate c={a.certificate} />
            </Link>
          </div>
        ) : (
          <p className="pt-5 text-[15px] text-[#5a554d]">Your certificate of accreditation is issued once {a.developer} checks and accepts your signed, notarized agreement. We&apos;ll email it to you.</p>
        )}
      </Panel>

      <Panel title="Signed agreement">
        <div className="space-y-5 pt-5">
          {a.agreed && (
            <p className="text-[15px] text-[#3d3a34]">
              You agreed online as <strong>{a.agreed.name}</strong> on {longDate(a.agreed.at)}.
            </p>
          )}

          {copy.status === "verified" ? (
            <p className="flex items-center gap-2 text-lg font-bold text-emerald-800">
              <CircleCheck className="h-6 w-6" /> Your signed agreement was checked and accepted. Nothing more to do.
            </p>
          ) : (
            <>
              <ol className="space-y-2 text-[15px] text-[#3d3a34]">
                {[
                  "Print the agreement. It already has your details and the dates.",
                  `Sign every page, with two witnesses. ${a.developer}'s representative signs it too.`,
                  "Have it notarized.",
                  `Scan it and upload it here${copy.due ? ` by ${longDate(copy.due)}` : ""}.`,
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#17150f] text-xs font-bold text-white">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              {a.agreement ? (
                <Link href={`/${slug}/agreement`} target="_blank" className="inline-flex items-center gap-2 bg-[#17150f] px-5 py-3 text-[15px] font-bold text-white hover:bg-[#3d3a34]">
                  <Printer className="h-5 w-5" /> Print the agreement
                </Link>
              ) : (
                <p className="text-sm text-[#6b665d]">{a.developer} hasn&apos;t set up the agreement yet. Check back later.</p>
              )}

              {copy.status === "submitted" && (
                <p className="border-l-4 border-sky-500 bg-sky-50 px-4 py-2.5 text-[15px] text-sky-950">
                  <strong>{copy.name}</strong> was sent {shortDate(copy.uploaded_at)}. {a.developer} is checking it.
                </p>
              )}
              {copy.status === "returned" && (
                <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5 text-[15px] text-amber-950">
                  <strong>{a.developer} sent it back:</strong> &ldquo;
                  {copy.note}&rdquo; Please fix it and upload it again.
                </p>
              )}
              {late && <p className="text-[15px] font-bold text-red-700">It was due {longDate(copy.due)}. Please upload it as soon as you can.</p>}

              {a.agreement && <UploadSignedCopy slug={slug} again={copy.status === "submitted" || copy.status === "returned"} />}
            </>
          )}
        </div>
      </Panel>
    </div>
  )
}
