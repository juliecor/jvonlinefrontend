import type { Metadata } from "next"
import { BadgeCheck, CircleAlert } from "lucide-react"
import { Certificate, type CertificateData } from "@/components/certificate"
import { ApiError, api } from "@/lib/api"
import { longDate } from "@/lib/format"

export const metadata: Metadata = { title: "Check a certificate of accreditation", robots: { index: false, follow: false } }

const STATE = {
  valid: { ok: true, title: "Valid certificate of accreditation", note: (c: CertificateData) => `${c.firm} is accredited by ${c.developer.name} until ${longDate(c.until)}.` },
  expired: { ok: false, title: "This certificate has expired", note: (c: CertificateData) => `It was valid until ${longDate(c.until)}. Ask ${c.developer.name} whether ${c.firm} is still accredited.` },
  ended: { ok: false, title: "This certificate is no longer valid", note: (c: CertificateData) => `${c.developer.name} ended this accreditation. Ask ${c.developer.name} for details.` },
  replaced: { ok: false, title: "This certificate was replaced", note: (c: CertificateData) => `${c.developer.name} issued ${c.firm} a newer certificate. Ask the realty for its latest one.` },
} as const

/**
 * jvconline.ph/verify/<code> — anyone checks that a certificate of accreditation is real and still
 * holds: the answer first, then the certificate as it was issued (without the representative's name).
 */
export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  let c: CertificateData | null = null
  let problem: string | null = null
  if (!/^[A-Za-z0-9]{6,20}$/.test(code)) problem = "There is no certificate with this code. Check the code on the certificate and try again."
  else {
    try {
      c = await api<CertificateData>(`/certificates/${encodeURIComponent(code)}`)
    } catch (e) {
      problem = e instanceof ApiError && e.status === 404 ? e.message : "We couldn't check this certificate right now. Please try again in a moment."
    }
  }
  const state = c ? STATE[c.status] : null

  return (
    <main className="min-h-screen bg-[#ebe8e2] px-4 py-8 text-[#17150f] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-[1000px]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-[#6b665d]">Certificate check</p>

        {c && state ? (
          <>
            <section className={`mx-auto mt-5 max-w-2xl border-l-4 bg-white px-6 py-6 sm:px-8 ${state.ok ? "border-emerald-600" : "border-red-600"}`}>
              <p className={`flex items-center gap-2.5 text-2xl font-bold tracking-tight ${state.ok ? "text-emerald-800" : "text-red-800"}`}>
                {state.ok ? <BadgeCheck className="h-7 w-7 shrink-0" /> : <CircleAlert className="h-7 w-7 shrink-0" />} {state.title}
              </p>
              <p className="mt-2 text-[15px] text-[#3d3a34]">{state.note(c)}</p>
              <dl className="mt-5 grid gap-x-8 gap-y-3 text-[15px] sm:grid-cols-2">
                {[
                  ["Realty", c.firm],
                  ["Accredited by", c.developer.name],
                  ["Valid", `${longDate(c.from)} to ${longDate(c.until)}`],
                  ["Certificate no.", c.number],
                  ["Issued", longDate(c.issued_at)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b665d]">{label}</dt>
                    <dd className="mt-0.5 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <div className="mt-8 shadow-[0_30px_70px_-30px_rgba(23,21,15,0.55)]">
              <Certificate c={c} />
            </div>
          </>
        ) : (
          <section className="mx-auto mt-5 max-w-xl border-l-4 border-red-600 bg-white px-6 py-6">
            <p className="flex items-center gap-2.5 text-xl font-bold text-red-800">
              <CircleAlert className="h-6 w-6 shrink-0" /> Certificate not found
            </p>
            <p className="mt-2 text-[15px] text-[#3d3a34]">{problem}</p>
          </section>
        )}
        <p className="mt-10 text-center text-xs text-[#8a847a]">Powered by jvconline</p>
      </div>
    </main>
  )
}
