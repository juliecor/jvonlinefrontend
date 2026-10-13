import type { Metadata } from "next"
import { api } from "@/lib/api"
import { SITE_REALTY } from "@/lib/public-projects-types"
import { AccreditationForm } from "./accreditation-form"
import { submitOpenAccreditation } from "./actions"
import { type AccreditationFormData, FormCard, FormIntro, FormProblem, formDates } from "./form-card"

export const metadata: Metadata = {
  title: "Realty accreditation",
  description: "Sell Johndorf's projects through your realty: send the accreditation form with your registration documents, and Johndorf emails you a dashboard login once it is accepted.",
}

/** jvconline.ph/accreditation — the open accreditation form, from the website's header: no invite needed. */
export default async function OpenAccreditationPage() {
  let form: AccreditationFormData | null = null
  try {
    form = await api<AccreditationFormData>(`/realties/${SITE_REALTY}/accreditation`)
  } catch {
    // Shown below: the form can't open.
  }
  const { today, adultBy } = formDates()

  return (
    <FormCard developer={form?.developer ?? null} eyebrow="Accreditation with">
      {form ? (
        <FormIntro form={form}>
          <AccreditationForm submit={submitOpenAccreditation} developer={form.developer.name} email="" documents={form.documents} civilStatuses={form.civil_statuses} agreement={form.agreement} today={today} adultBy={adultBy} />
        </FormIntro>
      ) : (
        <FormProblem title="The form can't open right now">Please try again in a moment.</FormProblem>
      )}
    </FormCard>
  )
}
