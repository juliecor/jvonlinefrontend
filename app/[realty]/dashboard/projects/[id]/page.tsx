import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Empty, PageHeader, Panel, btn } from "@/components/dashboard-ui"
import { ApiError, api } from "@/lib/api"
import { longDate } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { PlanCard } from "../plan-card"
import { PlanForm } from "../plan-form"
import { ProjectForm } from "../project-form"
import type { ProjectDetail } from "../types"
import { UnitForm } from "../unit-form"
import { UnitRow } from "../unit-row"

type Props = { params: Promise<{ realty: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  return { title: `Project ${(await params).id}` }
}

/** One project: its units and payment plans; staff add, edit and delete everything here. */
export default async function ProjectPage({ params }: Props) {
  const { realty: slug, id } = await params
  const { user, token } = await requireRealtyUser(slug)
  const staff = user.role === "realty"

  let project: ProjectDetail
  try {
    project = await api<ProjectDetail>(`/realty/projects/${id}`, { token })
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }
  const priced = project.units.filter((u) => u.status === "available" && u.price !== null).length

  return (
    <div>
      <Link href={`/${slug}/dashboard/projects`} className="inline-flex items-center gap-1.5 text-sm text-[#8a847a] hover:text-[#17150f]">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>
      <div className="mt-3">
        <PageHeader
          eyebrow={project.status === "archived" ? "Project · archived" : "Project"}
          title={project.name}
          lede={[project.location, project.completion_date ? `Completion ${longDate(project.completion_date)}` : null].filter(Boolean).join(" · ") || undefined}
          action={
            priced > 0 ? (
              <Link href={`/${slug}/dashboard/offers/new?project=${project.id}`} className={btn.primary}>
                New offer for this project
              </Link>
            ) : undefined
          }
        />
      </div>

      {project.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={project.cover_url} alt="" className="mt-8 aspect-[16/6] w-full rounded-md object-cover" />
      )}

      <Panel title={`Units · ${project.units.length}`} aside={priced ? `${priced} ready to offer` : "none ready to offer yet"}>
        <ul className="divide-y divide-[#e6e2db]">
          {project.units.map((u) => (
            <UnitRow key={u.id} slug={slug} projectId={project.id} unit={u} staff={staff} />
          ))}
          {project.units.length === 0 && <li><Empty>No units yet.</Empty></li>}
        </ul>
        {staff && (
          <div className="mt-6 border-t border-[#e6e2db] pt-6">
            <h3 className="mb-4 text-sm font-semibold">Add a unit</h3>
            <UnitForm slug={slug} projectId={project.id} />
          </div>
        )}
      </Panel>

      <Panel title={`Payment plans · ${project.payment_plans.length}`}>
        <ul className="grid gap-x-10 divide-y divide-[#e6e2db] sm:grid-cols-2 sm:divide-y-0">
          {project.payment_plans.map((plan) => (
            <PlanCard key={plan.id} slug={slug} projectId={project.id} plan={plan} staff={staff} />
          ))}
          {project.payment_plans.length === 0 && <li className="sm:col-span-2"><Empty>No payment plans yet. Without one, offers show the full price due on the purchase date.</Empty></li>}
        </ul>
        {staff && (
          <div className="mt-6 border-t border-[#e6e2db] pt-6">
            <h3 className="mb-4 text-sm font-semibold">Add a payment plan</h3>
            <PlanForm slug={slug} projectId={project.id} />
          </div>
        )}
      </Panel>

      {staff && (
        <Panel title="Project details" aside="Fee notes appear on every offer for this project">
          <div className="pt-6">
            <ProjectForm slug={slug} project={project} />
          </div>
        </Panel>
      )}
    </div>
  )
}
