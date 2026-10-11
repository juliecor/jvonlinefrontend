import { headers } from "next/headers"
import { PageHeader } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { assistantName } from "@/lib/assistant-name"
import { requireSection } from "@/lib/realty-auth"
import { type StaffMember, StaffManager } from "./staff-manager"

export const metadata = { title: "Staff accounts" }

/** jvconline.ph/<realty>/dashboard/staff — a full admin's staff accounts and what each person can open. */
export default async function StaffPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireSection(slug, "staff")
  const { sections, staff } = await api<{ sections: string[]; staff: StaffMember[] }>("/realty/staff", { token })

  // Where they sign in, for the details the admin sends them.
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "jvconline.ph"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  const loginUrl = `${proto}://${host}/${slug}/login`

  const info = {
    offers: { label: "Offers", text: "Every offer, making offers, buyers' documents, marking units reserved or sold" },
    approvals: { label: "Approvals", text: "Approve or send back custom payment terms (comes with Offers)" },
    projects: { label: "Projects", text: "Add and edit projects, units, payment plans and website pages" },
    agents: { label: "Agents", text: "Invite, approve and remove agents" },
    realties: { label: "Realty invitations", text: "Invite realty companies and accept their accreditation" },
    requirements: { label: "Buyer requirements", text: "Choose what buyers have to send" },
    ai: { label: assistantName(user.realty.name), text: "Ask about projects, units and (with Offers) buyers" },
  }

  return (
    <div>
      <PageHeader eyebrow="Team" title="Staff accounts" lede={`Make accounts for your team and choose what each person can open. They sign in at ${host}/${slug}/login with the email and password you give them.`} />
      <div className="mt-8">
        <StaffManager slug={slug} realty={user.realty.name} loginUrl={loginUrl} sections={sections} info={info} staff={staff} />
      </div>
    </div>
  )
}
