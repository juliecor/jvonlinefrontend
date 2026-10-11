import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { type AgreementDoc, AgreementDocument } from "@/components/agreement-document"
import { RealtyMark } from "@/components/form"
import { ApiError, api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { can, isBroker, isDeveloperStaff } from "@/lib/realty-roles"
import { PrintButton } from "./print-button"

export const metadata: Metadata = {
  title: "Broker's Accreditation Agreement",
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ realty: string }>
  searchParams: Promise<{ form?: string }>
}

/**
 * jvconline.ph/<realty>/agreement — the Broker's Accreditation Agreement on its own page, to print,
 * sign on every page and have notarized. An accredited realty gets its own (with its dates); the
 * developer's staff get a realty's (?form=<id>) or, with no form, the blank one as realties see it.
 * Outside the dashboard frame, so only the agreement prints.
 */
export default async function AgreementPrintPage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const { form } = await searchParams
  const { user, token } = await requireRealtyUser(slug)

  let doc: AgreementDoc | null = null
  let back = `/${slug}/dashboard`
  try {
    if (isBroker(user)) {
      if (user.role !== "realty") notFound()
      doc = (
        await api<{ agreement: AgreementDoc | null }>("/realty/accreditation", {
          token,
        })
      ).agreement
      back = `/${slug}/dashboard/accreditation`
    } else if (isDeveloperStaff(user) && can(user, "realties")) {
      if (form && !/^\d+$/.test(form)) notFound()
      doc = form
        ? (await api<{ agreement: AgreementDoc | null }>(`/realty/realties/accreditations/${form}`, { token })).agreement
        : (
            await api<{ preview: AgreementDoc }>("/realty/realties/agreement", {
              token,
            })
          ).preview
      back = form ? `/${slug}/dashboard/realties/${form}` : `/${slug}/dashboard/realties/agreement`
    } else {
      notFound()
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }
  const logo = isBroker(user) ? (user.realty.developer?.logo_url ?? null) : user.realty.logo_url

  return (
    <main className="min-h-screen bg-[#ebe8e2] px-3 py-6 text-[#17150f] sm:px-6 print:bg-white print:p-0">
      {/* Page margins, and the line the original carries at the foot of every page. */}
      <style>{`@page { size: A4; margin: 16mm 18mm 20mm; @bottom-center { content: "Affixed signature in every page"; font: bold 9pt Georgia, serif; } }`}</style>

      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 pb-5 print:hidden">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a34] hover:text-[#17150f]">
          <ArrowLeft className="h-4 w-4" /> Back to the dashboard
        </Link>
        {doc && <PrintButton />}
      </div>
      {doc && <p className="mx-auto max-w-[210mm] pb-4 text-sm text-[#5a554d] print:hidden">In the print window, turn off &ldquo;Headers and footers&rdquo;. Sign every page, both of you and two witnesses, then have it notarized.</p>}

      <article className="mx-auto max-w-[210mm] bg-white px-6 py-10 shadow-[0_24px_60px_-28px_rgba(23,21,15,0.45)] sm:px-[18mm] sm:py-[16mm] print:max-w-none print:p-0 print:shadow-none">
        {doc ? (
          <>
            <header className="mb-8 border-b-4 border-[#17150f] pb-4">
              <RealtyMark name={doc.developer.name} logo={logo} className="h-14" />
              {doc.developer.address && <p className="mt-2 text-xs text-[#3d3a34]">{doc.developer.address}</p>}
            </header>
            <AgreementDocument doc={doc} />
          </>
        ) : (
          <div className="py-10 text-center">
            <h1 className="text-2xl font-bold tracking-tight">The agreement isn&apos;t set up yet</h1>
            <p className="mx-auto mt-3 max-w-md text-[#5a554d]">The developer has not filled in its details for the accreditation agreement. Please check back later.</p>
          </div>
        )}
      </article>
    </main>
  )
}
