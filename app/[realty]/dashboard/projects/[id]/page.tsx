import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react"
import { ApiError, api } from "@/lib/api"
import { longDate, php, sqm } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { setUnitStatus } from "../actions"
import { PlanForm } from "../plan-form"
import { ProjectForm } from "../project-form"
import type { ProjectDetail } from "../types"
import { UnitForm } from "../unit-form"

type Props = { params: Promise<{ realty: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  return { title: `Project ${(await params).id}` }
}

const STATUS_STYLE = { available: "bg-emerald-50 text-emerald-700", reserved: "bg-amber-50 text-amber-700", sold: "bg-slate-200 text-slate-600" }

/** One project: its units and payment plans; staff edit everything here. */
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

  return (
    <div>
      <Link href={`/${slug}/dashboard/projects`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{project.name}</h1>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            {project.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {project.location}</span>}
            {project.completion_date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Completion {longDate(project.completion_date)}</span>}
          </p>
        </div>
        <Link href={`/${slug}/dashboard/offers/new?project=${project.id}`} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
          New offer for this project
        </Link>
      </div>

      {/* Units */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-6">Units ({project.units.length})</h2>
        <ul className="divide-y divide-slate-100">
          {project.units.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-4">
                {u.floor_plan_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.floor_plan_url} alt="" className="h-14 w-14 shrink-0 rounded-md border border-slate-200 object-cover" />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-md bg-slate-100" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{u.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${STATUS_STYLE[u.status]}`}>{u.status}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {[u.unit_type, u.category, u.floor, u.area_sqm ? sqm(u.area_sqm) : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:justify-end">
                <p className="text-base font-semibold tabular-nums">{php(u.price)}</p>
                {staff && (
                  <form key={u.status} action={setUnitStatus.bind(null, slug, u.id)}>
                    {/* Keyed on the status so the dropdown shows the saved value after the refresh. The API updates the whole unit, so the unchanged fields ride along. */}
                    <input type="hidden" name="name" value={u.name} />
                    <input type="hidden" name="unit_type" value={u.unit_type ?? ""} />
                    <input type="hidden" name="category" value={u.category} />
                    <input type="hidden" name="floor" value={u.floor ?? ""} />
                    <input type="hidden" name="area_sqm" value={u.area_sqm ?? ""} />
                    <input type="hidden" name="price" value={u.price} />
                    <input type="hidden" name="notes" value={u.notes ?? ""} />
                    <select name="status" defaultValue={u.status} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700" aria-label={`Status of ${u.name}`}>
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                    </select>
                    <button type="submit" className="ml-1.5 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900">Save</button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {project.units.length === 0 && <li className="px-6 py-8 text-center text-sm text-slate-500">No units yet.</li>}
        </ul>
        {staff && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-6">
            <h3 className="mb-4 text-sm font-semibold">Add a unit</h3>
            <UnitForm slug={slug} projectId={project.id} />
          </div>
        )}
      </section>

      {/* Payment plans */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-6">Payment plans ({project.payment_plans.length})</h2>
        <ul className="grid gap-px bg-slate-100 sm:grid-cols-2">
          {project.payment_plans.map((plan) => (
            <li key={plan.id} className="bg-white px-5 py-4 sm:px-6">
              <p className="font-semibold">{plan.name}</p>
              <ol className="mt-2 space-y-1 text-sm text-slate-600">
                {plan.milestones.map((m, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{m.label}{m.days !== null && m.days > 0 ? <span className="text-slate-400"> · {m.days} days</span> : m.days === null ? <span className="text-slate-400"> · on completion</span> : null}</span>
                    <span className="tabular-nums font-medium">{m.percent}%</span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
          {project.payment_plans.length === 0 && <li className="bg-white px-6 py-8 text-center text-sm text-slate-500 sm:col-span-2">No payment plans yet. Without one, offers show the full price due on the purchase date.</li>}
        </ul>
        {staff && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-6">
            <h3 className="mb-4 text-sm font-semibold">Add a payment plan</h3>
            <PlanForm slug={slug} projectId={project.id} />
          </div>
        )}
      </section>

      {staff && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold">Project details</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">Fee notes appear on every offer for this project.</p>
          <ProjectForm slug={slug} project={project} />
        </section>
      )}
    </div>
  )
}
