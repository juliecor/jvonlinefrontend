import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Building2, ExternalLink, MapPin, Plus } from "lucide-react"
import { Empty, Panel, Tag, btn } from "@/components/dashboard-ui"
import { Alert } from "@/components/form"
import { HashTabs } from "@/components/hash-tabs"
import { ApiError, api } from "@/lib/api"
import { longDate, php } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { AddPlan, AddUnit } from "../add-dialog"
import { PlanCard } from "../plan-card"
import { ProjectForm } from "../project-form"
import { ModelsEditor, WebsiteEditor } from "../public-page"
import { StatusBar } from "../status-bar"
import type { ProjectDetail, Unit } from "../types"
import { UnitList } from "../unit-list"

type Props = { params: Promise<{ realty: string; id: string }>; searchParams: Promise<{ plan_error?: string }> }

export async function generateMetadata({ params }: Props) {
  return { title: `Project ${(await params).id}` }
}

/** "₱2.6M – ₱4.4M", or one price, or nothing. */
const priceRange = (units: Unit[]) => {
  const prices = units.map((u) => Number(u.price)).filter((n) => n > 0)
  if (!prices.length) return null
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  return lo === hi ? php(lo) : `${php(lo)} – ${php(hi)}`
}

/** One project, in tabs: its status and units at a glance, the units, plans, website, models and details. */
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
  const units = project.units
  const by = (s: Unit["status"]) => units.filter((u) => u.status === s).length
  const priced = units.filter((u) => u.status === "available" && u.price !== null).length
  const photo = project.hero_urls[0] ?? project.cover_url
  // Units grouped by type: how many, how many left, and the price range.
  const types = [...new Set(units.map((u) => u.unit_type ?? "Other"))].map((t) => {
    const of = units.filter((u) => (u.unit_type ?? "Other") === t)
    return { type: t, total: of.length, available: of.filter((u) => u.status === "available").length, reserved: of.filter((u) => u.status === "reserved").length, sold: of.filter((u) => u.status === "sold").length, price: priceRange(of), area: of[0]?.area_sqm }
  })
  const pageData = {
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
  }

  return (
    <div>
      <Link href={`/${slug}/dashboard/projects`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b665d] hover:text-[#17150f]">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>

      {/* The project at a glance */}
      <section className="overflow-hidden border border-[#e0dcd5] bg-white">
        <div className="flex flex-col sm:flex-row">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="aspect-[2/1] w-full object-cover sm:aspect-auto sm:w-64 sm:shrink-0 lg:w-80" />
          ) : (
            <div className="hidden w-64 shrink-0 items-center justify-center bg-[#efece6] sm:flex lg:w-80">
              <Building2 className="h-10 w-10 text-[#c9c3b9]" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Project</p>
                {project.stage && <Tag tone="accent">{project.stage}</Tag>}
                {project.status === "archived" && <Tag>Archived</Tag>}
                {!project.is_public && <Tag tone="warn">Hidden from website</Tag>}
              </div>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
              {project.location && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#3d3a34]">
                  <MapPin className="h-4 w-4 text-[var(--accent)]" /> {project.location}
                </p>
              )}
              <p className="mt-1 text-sm text-[#6b665d]">{[priceRange(units), project.completion_date ? `turnover ${longDate(project.completion_date)}` : null].filter(Boolean).join(" · ") || "No prices yet"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {priced > 0 && (
                <Link href={`/${slug}/dashboard/offers/new?project=${project.id}`} className="inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
                  <Plus className="h-4 w-4" strokeWidth={2.5} /> New offer for this project
                </Link>
              )}
              {project.is_public && project.slug && (
                <a href={`/projects/${project.slug}`} target="_blank" rel="noreferrer" className={btn.outline}>
                  View on website <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-3 border-t border-[#e6e2db] sm:grid-cols-6">
          {[
            { label: "Units", value: units.length, href: "#units" },
            { label: "Available", value: by("available"), href: "#units" },
            { label: "Reserved", value: by("reserved"), href: "#units" },
            { label: "Sold", value: by("sold"), href: "#units" },
            { label: "Plans", value: project.payment_plans.length, href: "#plans" },
            { label: "Offers", value: project.offers_count ?? 0, href: `/${slug}/dashboard/offers` },
          ].map((st, i) => (
            <a key={st.label} href={st.href} className={`block px-4 py-3 transition hover:bg-[#faf8f5] sm:px-5 ${i % 3 ? "border-l border-[#e6e2db]" : "sm:border-l sm:first:border-l-0"} ${i > 2 ? "border-t border-[#e6e2db] sm:border-t-0" : ""}`}>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a847a]">{st.label}</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums">{st.value}</dd>
            </a>
          ))}
        </dl>
      </section>

      {planError && (
        <div className="mt-6">
          <Alert kind="error">The project was created, but the site plan didn&apos;t upload: {planError} Try again in the Website tab, under Site development plan.</Alert>
        </div>
      )}

      <HashTabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <>
                <StatusBar slug={slug} projectId={project.id} value={{ status: project.status, stage: project.stage, is_public: project.is_public }} pageSlug={project.slug} staff={staff} />
                <Panel className="!mt-8" title="Units at a glance" aside={priced ? `${priced} ready to offer` : "none ready to offer yet"}>
                  {types.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-[15px]">
                        <thead>
                          <tr className="border-b border-[#e6e2db] text-left text-xs uppercase tracking-[0.12em] text-[#8a847a]">
                            <th className="py-2.5 pr-3 font-bold">Type</th>
                            <th className="py-2.5 pr-3 text-right font-bold">Units</th>
                            <th className="py-2.5 pr-3 text-right font-bold">Available</th>
                            <th className="py-2.5 pr-3 text-right font-bold">Reserved</th>
                            <th className="py-2.5 pr-3 text-right font-bold">Sold</th>
                            <th className="py-2.5 text-right font-bold">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6e2db]">
                          {types.map((t) => (
                            <tr key={t.type}>
                              <td className="py-3 pr-3 font-bold">{t.type}</td>
                              <td className="py-3 pr-3 text-right tabular-nums">{t.total}</td>
                              <td className="py-3 pr-3 text-right font-semibold tabular-nums text-emerald-700">{t.available}</td>
                              <td className="py-3 pr-3 text-right tabular-nums text-amber-700">{t.reserved || "—"}</td>
                              <td className="py-3 pr-3 text-right tabular-nums">{t.sold || "—"}</td>
                              <td className="py-3 text-right font-semibold tabular-nums">{t.price ?? <span className="font-normal text-[#a39d92]">on request</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty>No units yet.{staff ? " Add them in the Units tab." : ""}</Empty>
                  )}
                </Panel>
              </>
            ),
          },
          {
            id: "units",
            label: "Units",
            badge: units.length,
            content: (
              <Panel className="!mt-6" title={`Units · ${units.length}`} aside={staff ? <AddUnit slug={slug} projectId={project.id} projectName={project.name} /> : undefined}>
                <UnitList slug={slug} projectId={project.id} units={units} staff={staff} />
              </Panel>
            ),
          },
          {
            id: "plans",
            label: "Payment plans",
            short: "Plans",
            badge: project.payment_plans.length,
            content: (
              <Panel className="!mt-6" title={`Payment plans · ${project.payment_plans.length}`} aside={staff ? <AddPlan slug={slug} projectId={project.id} projectName={project.name} /> : undefined}>
                <ul className="grid gap-x-10 divide-y divide-[#e6e2db] sm:grid-cols-2 sm:divide-y-0">
                  {project.payment_plans.map((plan) => (
                    <PlanCard key={plan.id} slug={slug} projectId={project.id} plan={plan} staff={staff} />
                  ))}
                  {project.payment_plans.length === 0 && (
                    <li className="sm:col-span-2">
                      <Empty>No payment plans yet. Without one, offers show the full price due on the purchase date.</Empty>
                    </li>
                  )}
                </ul>
              </Panel>
            ),
          },
          ...(staff
            ? [
                { id: "website", label: "Website", content: <WebsiteEditor slug={slug} projectId={project.id} projectName={project.name} data={pageData} /> },
                { id: "models", label: "Models & updates", short: "Models", badge: project.unit_types.length || null, content: <ModelsEditor slug={slug} projectId={project.id} data={pageData} /> },
                {
                  id: "details",
                  label: "Details",
                  content: (
                    <Panel className="!mt-6" title="Project details" aside="Fee notes appear on every offer for this project">
                      <div className="pt-6">
                        <ProjectForm slug={slug} project={project} />
                      </div>
                    </Panel>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  )
}
