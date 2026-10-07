import { Suspense } from "react"
import Link from "next/link"
import { Empty, PageHeader, Panel, Row, Rows, Tag } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { shortDate } from "@/lib/format"
import type { PlatformContext } from "./realties-view"
import { RealtyFilter } from "./realty-filter"

type Person = { id: number; name: string; email: string; role: "realty" | "agent"; status?: "pending" | "active" | "rejected"; joined_at: string; offers_count: number; realty: { id: number; name: string; slug: string } | null }
type Realty = { id: number; name: string }

function List({ title, rows, base }: { title: string; rows: Person[]; base: string }) {
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
                    <Link href={`${base}/realties/${p.realty.id}`} className="font-semibold text-[#3d3a34] hover:text-[var(--accent)] hover:underline">
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

/** Every realty admin and agent on the platform, with their realty; ?realty=<id> narrows it to one. */
export async function PeopleView({ ctx, realty, eyebrow }: { ctx: PlatformContext; realty?: string; eyebrow: string }) {
  const token = ctx.token
  const [people, realties] = await Promise.all([
    api<Person[]>(`/admin/people${realty ? `?realty_id=${encodeURIComponent(realty)}` : ""}`, { token }),
    api<Realty[]>("/admin/realties", { token }),
  ])

  return (
    <div>
      <PageHeader
        eyebrow={eyebrow}
        title="People"
        lede="Realty admins and agents across the platform. Each realty manages its own people; this is the overview."
        action={
          <Suspense>
            <RealtyFilter realties={realties} />
          </Suspense>
        }
      />
      <List title="Agents" rows={people.filter((p) => p.role === "agent")} base={ctx.base} />
      <List title="Realty admins" rows={people.filter((p) => p.role === "realty")} base={ctx.base} />
    </div>
  )
}
