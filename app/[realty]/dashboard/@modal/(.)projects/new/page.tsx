import { RouteModal } from "@/components/route-modal"
import { requireRealtyUser } from "@/lib/realty-auth"
import { ProjectForm } from "../../../projects/project-form"

/** "Add project" opens here, over the Projects page. Agents can't add projects, so they get nothing. */
export default async function NewProjectModal({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user } = await requireRealtyUser(slug)
  if (user.role !== "realty") return null

  return (
    <RouteModal eyebrow={user.realty.name} title="Add a project">
      <p className="-mt-1 mb-6 max-w-2xl text-[15px] text-[#5a554d]">Start with the basics. After you create it you can add units, payment plans, and the public page.</p>
      <ProjectForm slug={slug} />
    </RouteModal>
  )
}
