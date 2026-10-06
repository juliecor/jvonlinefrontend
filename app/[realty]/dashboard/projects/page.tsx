import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { ProjectForm } from "./project-form"
import type { Project } from "./types"

export const metadata = { title: "Projects" }

/** jvconline.ph/<realty>/dashboard/projects — the realty's projects; staff can add one. */
export default async function ProjectsPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  const projects = await api<Project[]>("/realty/projects", { token })
  const staff = user.role === "realty"

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Projects</h1>
      <p className="mt-1 text-sm text-slate-500">Each project holds the units you sell and the payment plans you offer.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.id}>
            <Link href={`/${slug}/dashboard/projects/${p.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-400">
              {p.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover_url} alt="" className="aspect-[16/9] w-full object-cover" />
              ) : (
                <div className="aspect-[16/9] w-full bg-slate-100" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{p.name}</p>
                  {p.status === "archived" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Archived</span>}
                </div>
                {p.location && <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {p.location}</p>}
                <p className="mt-4 text-xs text-slate-500">
                  {p.units_count} unit{p.units_count === 1 ? "" : "s"} · {p.payment_plans_count} plan{p.payment_plans_count === 1 ? "" : "s"} · {p.offers_count} offer{p.offers_count === 1 ? "" : "s"}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-slate-900">
                  Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
        {projects.length === 0 && <li className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">No projects yet.{staff ? " Create the first one below." : " Ask your realty to add one."}</li>}
      </ul>

      {staff && (
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold">New project</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">You can add units and payment plans right after.</p>
          <ProjectForm slug={slug} />
        </section>
      )}
    </div>
  )
}
