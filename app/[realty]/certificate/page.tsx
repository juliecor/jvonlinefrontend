import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Certificate, type CertificateData } from "@/components/certificate"
import { ApiError, api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { can, isBroker, isDeveloperStaff } from "@/lib/realty-roles"
import { PrintButton } from "../agreement/print-button"

export const metadata: Metadata = { title: "Certificate of Accreditation", robots: { index: false, follow: false } }

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ form?: string }> }

/**
 * jvconline.ph/<realty>/certificate — the certificate of accreditation on its own page, to print or
 * save as a PDF (landscape A4). An accredited realty gets its own; the developer's staff get a realty's
 * with ?form=<id>. Outside the dashboard frame, so only the certificate prints.
 */
export default async function CertificatePage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const { form } = await searchParams
  const { user, token } = await requireRealtyUser(slug)

  let certificate: CertificateData | null = null
  let back = `/${slug}/dashboard`
  try {
    if (isBroker(user)) {
      if (user.role !== "realty") notFound()
      certificate = (await api<{ certificate: CertificateData | null }>("/realty/accreditation", { token })).certificate
      back = `/${slug}/dashboard/accreditation`
    } else if (isDeveloperStaff(user) && can(user, "realties") && form && /^\d+$/.test(form)) {
      certificate = (await api<{ certificate: CertificateData | null }>(`/realty/realties/accreditations/${form}`, { token })).certificate
      back = `/${slug}/dashboard/realties/${form}`
    } else {
      notFound()
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }
  const developer = isBroker(user) ? (user.realty.developer?.name ?? "the developer") : user.realty.name

  return (
    <main className="min-h-screen bg-[#e9e5dd] px-3 py-6 text-[#17150f] sm:px-6 print:bg-white print:p-0">
      <style>{`@page { size: A4 landscape; margin: 0; }`}</style>
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 pb-5 print:hidden">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a34] hover:text-[#17150f]">
          <ArrowLeft className="h-4 w-4" /> Back to the dashboard
        </Link>
        {certificate && <PrintButton />}
      </div>
      {certificate && <p className="mx-auto max-w-[1100px] pb-4 text-sm text-[#5a554d] print:hidden">To save it as a PDF, click Print and choose &ldquo;Save as PDF&rdquo;. Turn on &ldquo;Background graphics&rdquo; for the cream paper colour.</p>}

      {certificate ? (
        <div className="mx-auto max-w-[1100px] shadow-[0_30px_70px_-30px_rgba(23,21,15,0.55)] print:w-[297mm] print:max-w-none print:shadow-none">
          <Certificate c={certificate} />
        </div>
      ) : (
        <div className="mx-auto max-w-xl bg-white px-6 py-12 text-center">
          <h1 className="text-2xl font-bold tracking-tight">No certificate yet</h1>
          <p className="mt-3 text-[#5a554d]">The certificate of accreditation is issued once {developer} checks and accepts the signed, notarized agreement.</p>
        </div>
      )}
    </main>
  )
}
