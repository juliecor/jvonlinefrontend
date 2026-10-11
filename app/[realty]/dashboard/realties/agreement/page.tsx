import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"
import { type AgreementDoc, AgreementDocument } from "@/components/agreement-document"
import { PageHeader, Panel, Tag } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireSection } from "@/lib/realty-auth"
import { isDeveloperStaff } from "@/lib/realty-roles"
import type { AgreementSettings } from "../actions"
import { AgreementSettingsForm } from "./settings-form"

export const metadata = { title: "Accreditation agreement" }

type Settings = Omit<AgreementSettings, "representative_name" | "representative_title" | "office_address"> & {
  representative_name: string | null
  representative_title: string | null
  office_address: string | null
}

/**
 * jvconline.ph/<realty>/dashboard/realties/agreement — the developer's details on the
 * Broker's Accreditation Agreement (who signs, the office address, the commission
 * rates, the days to send the signed copy) and the agreement as realties will read it.
 */
export default async function AgreementSettingsPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireSection(slug, "realties")
  if (!isDeveloperStaff(user)) redirect(`/${slug}/dashboard`)
  const { settings, ready, preview } = await api<{
    settings: Settings
    ready: boolean
    preview: AgreementDoc
  }>("/realty/realties/agreement", { token })

  return (
    <div>
      <Link href={`/${slug}/dashboard/realties`} className="inline-flex items-center gap-1.5 text-sm text-[#6b665d] hover:text-[#17150f]">
        <ArrowLeft className="h-4 w-4" /> Realty Company Invitation
      </Link>
      <div className="mt-3">
        <PageHeader
          eyebrow="Accreditation"
          title="Accreditation agreement"
          lede={`The Broker's Accreditation Agreement every realty signs on its form. Fill in ${user.realty.name}'s details; the realty's details come from its form.`}
          action={<Tag tone={ready ? "good" : "warn"}>{ready ? "Realties sign it on the form" : "Not set up yet"}</Tag>}
        />
      </div>

      <Panel title="Your details on the agreement">
        <div className="pt-5">
          <AgreementSettingsForm
            slug={slug}
            initial={{
              representative_name: settings.representative_name ?? "",
              representative_title: settings.representative_title ?? "",
              office_address: settings.office_address ?? "",
              commission: settings.commission.length > 0 ? settings.commission : [{ classification: "", rate: "" }],
              signed_copy_days: settings.signed_copy_days,
            }}
          />
        </div>
      </Panel>

      <Panel
        title="The agreement realties read"
        aside={
          <Link href={`/${slug}/agreement`} target="_blank" className="inline-flex items-center gap-1.5 font-bold text-[var(--accent)] hover:underline">
            <Printer className="h-4 w-4" /> Print preview
          </Link>
        }
      >
        <p className="pt-4 text-sm text-[#6b665d]">Saved changes show here. A realty that already signed keeps the version it signed. Lines are filled in by hand, or with the realty&apos;s details once it sends its form.</p>
        <div className="mt-4 border border-[#e6e2db] bg-white px-5 py-8 sm:px-10">
          <AgreementDocument doc={preview} />
        </div>
      </Panel>
    </div>
  )
}
