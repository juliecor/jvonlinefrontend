import { Suspense } from "react"
import Link from "next/link"
import { Empty, PageHeader, Panel, Row, Rows, Tag } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"
import { shortDate } from "@/lib/format"
import { RealtyFilter } from "../realty-filter"

export const metadata = { title: "People" }

type Person = { id: number; name: string; email: string; role: "realty" | "agent"; status?: "pending" | "active" | "rejected"; joined_at: string; offers_count: number; realty: { id: number; name: string; slug: string } | null }
type Realty = { id: number; name: string }

function List({ title, rows }: { title: string; rows: Person[] }) {
  return (
    <Panel title={`${title} · ${rows.length}`}>
      <Rows>
        {rows.map((p) => (
          <Row key={p.id}>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-base font-bold">
                {p.name}
                {p.status === "pending" && <Tag tone="warn">Pending approval</Tag>}
                {p.status === "rejected" && <Tag tone="bad">Rejected</Tag>}
              </p>
              <p className="truncate text-sm text-[#6b665d]">
                {p.email}
                {p.realty && (
                  <>
                    {" · "}
                    <Link href={`/admin/realties/${p.realty.id}`} className="font-semibold text-[#3d3a34] hover:text-[var(--accent)] hover:underline">
                      {p.realty.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <p className="shrink-0 text-sm text-[#8a847a]">
              {p.offers_count} active offer{p.offers_count === 1 ? "" : "s"} · joined {shortDate(p.joined_at)}
            </p>
          </Row>
        ))}
        {rows.length === 0 && (
          <li>
            <Empty>Nobody yet.</Empty>
          </li>
        )}
      </Rows>
    </Panel>
  )
}

/** jvconline.ph/admin/people — every realty admin and agent, with their realty. */
export default async function AdminPeoplePage({ searchParams }: { searchParams: Promise<{ realty?: string }> }) {
  const { token } = await requireAdmin()
  const { realty } = await searchParams
  const [people, realties] = await Promise.all([
    api<Person[]>(`/admin/people${realty ? `?realty_id=${encodeURIComponent(realty)}` : ""}`, { token }),
    api<Realty[]>("/admin/realties", { token }),
  ])

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="People"
        lede="Realty admins and agents across the platform. Each realty manages its own people; this is the overview."
        action={
          <Suspense>
            <RealtyFilter realties={realties} />
          </Suspense>
        }
      />
      <List title="Agents" rows={people.filter((p) => p.role === "agent")} />
      <List title="Realty admins" rows={people.filter((p) => p.role === "realty")} />
    </div>
  )
}
