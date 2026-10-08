import Link from "next/link"
import { Plus } from "lucide-react"
import { PageHeader, btn } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { isDeveloperStaff } from "@/lib/realty-roles"
import { ProjectList } from "./project-list"
import { type Filters, NO_FILTERS, type Project } from "./types"

export const metadata = { title: "Projects" }

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<Partial<Record<keyof Filters, string>>> }

/** jvconline.ph/<realty>/dashboard/projects — the realty's projects, with search and filters; staff can add one. */
export default async function ProjectsPage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const query = await searchParams
  const initial = Object.fromEntries(Object.entries(NO_FILTERS).map(([k, v]) => [k, typeof query[k as keyof Filters] === "string" ? query[k as keyof Filters] : v])) as Filters
  const { user, token } = await requireRealtyUser(slug)
  const projects = await api<Project[]>("/realty/projects", { token })
  const staff = isDeveloperStaff(user)

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

      <ProjectList slug={slug} projects={projects} staff={staff} initial={initial} />
    </div>
  )
}
