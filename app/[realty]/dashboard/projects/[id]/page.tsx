import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Empty, PageHeader, Panel, btn } from "@/components/dashboard-ui"
import { Alert } from "@/components/form"
import { ApiError, api } from "@/lib/api"
import { longDate } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { AddPlan, AddUnit } from "../add-dialog"
import { PlanCard } from "../plan-card"
import { ProjectForm } from "../project-form"
import { PublicPageEditor } from "../public-page"
import { StatusBar } from "../status-bar"
import type { ProjectDetail } from "../types"
import { UnitRow } from "../unit-row"

type Props = { params: Promise<{ realty: string; id: string }>; searchParams: Promise<{ plan_error?: string }> }

export async function generateMetadata({ params }: Props) {
  return { title: `Project ${(await params).id}` }
}

/** One project: its units and payment plans; staff add, edit and delete everything here. */
export default async function ProjectPage({ params, searchParams }: Props) {
  const { realty: slug, id } = await params
  const { plan_error: planError } = await searchParams
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

      <StatusBar slug={slug} projectId={project.id} value={{ status: project.status, stage: project.stage, is_public: project.is_public }} pageSlug={project.slug} staff={staff} />

      {planError && (
        <div className="mt-6">
          <Alert kind="error">The project was created, but the site plan didn&apos;t upload: {planError} Try again in Site development plan below.</Alert>
        </div>
      )}

      {project.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={project.cover_url} alt="" className="mt-8 aspect-[16/6] w-full rounded-md object-cover" />
      )}

      <Panel
        title={`Units · ${project.units.length}`}
        aside={
          <span className="flex items-center gap-4">
            <span>{priced ? `${priced} ready to offer` : "none ready to offer yet"}</span>
            {staff && <AddUnit slug={slug} projectId={project.id} projectName={project.name} />}
          </span>
        }
      >
        <ul className="divide-y divide-[#e6e2db]">
          {project.units.map((u) => (
            <UnitRow key={u.id} slug={slug} projectId={project.id} unit={u} staff={staff} />
          ))}
          {project.units.length === 0 && <li><Empty>No units yet.{staff ? " Use Add unit to add the first one." : ""}</Empty></li>}
        </ul>
      </Panel>

      <Panel title={`Payment plans · ${project.payment_plans.length}`} aside={staff ? <AddPlan slug={slug} projectId={project.id} projectName={project.name} /> : undefined}>
        <ul className="grid gap-x-10 divide-y divide-[#e6e2db] sm:grid-cols-2 sm:divide-y-0">
          {project.payment_plans.map((plan) => (
            <PlanCard key={plan.id} slug={slug} projectId={project.id} plan={plan} staff={staff} />
          ))}
          {project.payment_plans.length === 0 && <li className="sm:col-span-2"><Empty>No payment plans yet. Without one, offers show the full price due on the purchase date.</Empty></li>}
        </ul>
      </Panel>

      {staff && (
        <PublicPageEditor
          slug={slug}
          projectId={project.id}
          projectName={project.name}
          data={{
            slug: project.slug,
            region: project.region,
            stage: project.stage,
            is_public: project.is_public,
            official_url: project.official_url,
            amenities: project.amenities,
            hero_urls: project.hero_urls,
            site_plan_urls: project.site_plan_urls,
            unit_types: project.unit_types,
            updates: project.updates,
          }}
        />
      )}

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
