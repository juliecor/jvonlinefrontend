import Link from "next/link"
import { ArrowRight, MapPin, Plus } from "lucide-react"
import { PageHeader, Tag, btn } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
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
      <PageHeader
        eyebrow="Sales"
        title="Projects"
        lede="Each project holds the units you sell, the payment plans you offer and its public page."
        action={
          staff ? (
            <Link href={`/${slug}/dashboard/projects/new`} className={btn.primary}>
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Add project
            </Link>
          ) : undefined
        }
      />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.id}>
            <Link href={`/${slug}/dashboard/projects/${p.id}`} className="group flex h-full flex-col overflow-hidden rounded-md border border-[#e6e2db] bg-white transition hover:border-[var(--accent)]">
              {p.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover_url} alt="" className="aspect-[16/9] w-full object-cover" />
              ) : (
                <div className="aspect-[16/9] w-full bg-[#efece6]" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-bold">{p.name}</p>
                  <span className="flex gap-1.5">{p.is_public && <Tag tone="accent">Public</Tag>}{p.status === "archived" && <Tag>Archived</Tag>}</span>
                </div>
                {p.location && <p className="mt-1 inline-flex items-center gap-1 text-sm text-[#6b665d]"><MapPin className="h-3.5 w-3.5" /> {p.location}</p>}
                <p className="mt-4 text-xs text-[#8a847a]">
                  {p.units_count} unit{p.units_count === 1 ? "" : "s"} · {p.payment_plans_count} plan{p.payment_plans_count === 1 ? "" : "s"} · {p.offers_count} offer{p.offers_count === 1 ? "" : "s"}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-[var(--accent)]">
                  Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
        {projects.length === 0 && <li className="rounded-md border border-dashed border-[#d9d4cb] p-10 text-center text-sm text-[#8a847a] sm:col-span-2 lg:col-span-3">No projects yet.{staff ? " Use Add project to create the first one." : " Ask your realty to add one."}</li>}
      </ul>

    </div>
  )
}
