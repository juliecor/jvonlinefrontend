import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PageHeader, Panel } from "@/components/dashboard-ui"
import { requireRealtyUser } from "@/lib/realty-auth"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { ProjectForm } from "../project-form"

export const metadata = { title: "Add project" }

/** jvconline.ph/<realty>/dashboard/projects/new — staff start a project; units, plans and its public page come next. */
export default async function NewProjectPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user } = await requireRealtyUser(slug)
  if (!isDeveloperStaff(user)) redirect(`/${slug}/dashboard/projects`)

  return (
    <div>
      <Link href={`/${slug}/dashboard/projects`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b665d] hover:text-[#17150f]">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>
      <div className="mt-3">
        <PageHeader eyebrow="Sales" title="Add project" lede="Start with the basics. After you create it you can add units, payment plans, and the public page: hero photos, site plan, models, amenities and construction updates." />
      </div>
      <Panel title="Project details">
        <div className="pt-6">
          <ProjectForm slug={slug} />
        </div>
      </Panel>
    </div>
  )
}
