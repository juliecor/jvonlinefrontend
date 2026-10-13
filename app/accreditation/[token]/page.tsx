import type { Metadata } from "next"
import { ApiError, api } from "@/lib/api"
import { AccreditationForm } from "../accreditation-form"
import { submitAccreditation } from "../actions"
import { type AccreditationFormData, FormCard, FormIntro, FormProblem, formDates } from "../form-card"

export const metadata: Metadata = { title: "Realty accreditation", robots: { index: false, follow: false } }

type Invite = AccreditationFormData & { email: string; expires_at: string }

/** jvconline.ph/accreditation/<token> — where the accreditation invite email lands. The token alone identifies the invite. */
export default async function AccreditationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  let invite: Invite | null = null
  let problem: string | null = null
  try {
    invite = await api<Invite>(`/accreditation/${encodeURIComponent(token)}`)
  } catch (e) {
    problem = e instanceof ApiError && (e.status === 404 || e.status === 410) ? e.message : "We couldn't check this link right now. Please try again in a moment."
  }
  const { today, adultBy } = formDates()

  return (
    <FormCard developer={invite?.developer ?? null} eyebrow="Invited by">
      {invite ? (
        <FormIntro form={invite}>
          <AccreditationForm submit={submitAccreditation.bind(null, token)} developer={invite.developer.name} email={invite.email} documents={invite.documents} civilStatuses={invite.civil_statuses} agreement={invite.agreement} today={today} adultBy={adultBy} />
        </FormIntro>
      ) : (
        <FormProblem title="This link doesn't work">{problem}</FormProblem>
      )}
    </FormCard>
  )
}
