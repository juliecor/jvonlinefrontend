import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Eye } from "lucide-react"
import { Empty, Ledger, PageHeader, Panel, Row, Rows, Tag, btn } from "@/components/dashboard-ui"
import { ApiError, api } from "@/lib/api"
import { php, shortDate } from "@/lib/format"
import { DashboardButton, type PlatformContext } from "./realties-view"
import { ResendButton } from "./resend-button"

type Detail = {
  realty: {
    id: number; name: string; slug: string; email: string | null; contact_name: string | null; phone: string | null; address: string | null; about: string | null
    status: "invited" | "active"; logo_url: string | null; invited_at: string | null; registered_at: string | null
    users_count: number; agents_count: number; projects_count: number; offers_count: number
  }
  people: { id: number; name: string; email: string; role: "realty" | "agent"; joined_at: string }[]
  projects: { id: number; name: string; location: string | null; status: string; units_count: number; payment_plans_count: number; offers_count: number }[]
  offers: { id: number; code: string; status: string; buyer_name: string; price: number; views: number; created_at: string; project: string | null; unit: string | null; agent: string | null; url: string }[]
  offer_views: number
}

/** Everything about one realty, read-only. */
export async function RealtyView({ ctx, id }: { ctx: PlatformContext; id: string }) {
  let d: Detail
  try {
    d = await api<Detail>(`/admin/realties/${id}`, { token: ctx.token })
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }
  const r = d.realty

  return (
    <div>
      <Link href={`${ctx.base}/realties`} className="inline-flex items-center gap-1.5 text-sm text-[#8a847a] hover:text-[#17150f]">
        <ArrowLeft className="h-4 w-4" /> Realties
      </Link>
      {r.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.logo_url} alt="" className="mt-5 h-14 w-auto max-w-[200px] object-contain" />
      )}
      <div className="mt-3">
        <PageHeader
          eyebrow={r.status === "active" ? "Realty · active" : "Realty · invited"}
          title={r.name}
          lede={`jvconline.ph/${r.slug}${r.registered_at ? ` · registered ${shortDate(r.registered_at)}` : r.invited_at ? ` · invited ${shortDate(r.invited_at)}` : ""}`}
          action={
            r.status === "active" ? (
              <>
                {ctx.superAdmin && <DashboardButton ctx={ctx} slug={r.slug} />}
                <Link href={`/${r.slug}`} target="_blank" className={btn.outline}>
                  Public page <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <Link href={`/${r.slug}/login`} target="_blank" className={btn.outline}>
                  Their login <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <ResendButton id={r.id} />
            )
          }
        />
      </div>

      <Ledger
        items={[
          { label: "People", value: d.people.length, note: `${r.agents_count} agent${r.agents_count === 1 ? "" : "s"}` },
          { label: "Projects", value: r.projects_count, note: `${d.projects.reduce((n, p) => n + p.units_count, 0)} units` },
          { label: "Offers", value: r.offers_count, note: `${d.offers.filter((o) => o.status === "active").length} active` },
          { label: "Offer views", value: d.offer_views, note: "buyers opening links" },
        ]}
      />

      <div className="grid gap-x-10 lg:grid-cols-2">
        <Panel title="Company">
          <dl className="divide-y divide-[#e6e2db] text-sm">
            {[
              ["Contact", r.contact_name],
              ["Email", r.email],
              ["Phone", r.phone],
              ["Address", r.address],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-[#8a847a]">{k}</dt>
                <dd className="text-right font-medium">{v ?? "—"}</dd>
              </div>
            ))}
          </dl>
          {r.about && <p className="mt-4 whitespace-pre-line text-sm text-[#5a554d]">{r.about}</p>}
        </Panel>
        <Panel title={`People · ${d.people.length}`}>
          <Rows>
            {d.people.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold">{p.name}</p>
                  <p className="truncate text-sm text-[#6b665d]">{p.email}</p>
                </div>
                <Tag tone={p.role === "realty" ? "accent" : "neutral"}>{p.role === "realty" ? "Admin" : "Agent"}</Tag>
              </li>
            ))}
            {d.people.length === 0 && (
              <li>
                <Empty>No logins yet.</Empty>
              </li>
            )}
          </Rows>
        </Panel>
      </div>

      <Panel title={`Projects · ${d.projects.length}`}>
        <Rows>
          {d.projects.map((p) => (
            <Row key={p.id} muted={p.status === "archived"}>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-base font-bold">
                  {p.name}
                  {p.status === "archived" && <Tag>Archived</Tag>}
                </p>
                {p.location && <p className="text-sm text-[#6b665d]">{p.location}</p>}
              </div>
              <p className="shrink-0 text-sm text-[#6b665d]">
                {p.units_count} unit{p.units_count === 1 ? "" : "s"} · {p.payment_plans_count} plan{p.payment_plans_count === 1 ? "" : "s"} · {p.offers_count} offer{p.offers_count === 1 ? "" : "s"}
              </p>
            </Row>
          ))}
          {d.projects.length === 0 && (
            <li>
              <Empty>No projects yet.</Empty>
            </li>
          )}
        </Rows>
      </Panel>

      <Panel title="Latest offers">
        <Rows>
          {d.offers.map((o) => (
            <Row key={o.id} muted={o.status === "void"}>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-base font-bold">
                  {o.buyer_name}
                  <span className="font-mono text-xs font-normal text-[#8a847a]">{o.code}</span>
                  {o.status === "void" && <Tag>Void</Tag>}
                </p>
                <p className="text-sm text-[#6b665d]">
                  {[o.project, o.unit, php(o.price), o.agent && `by ${o.agent}`, shortDate(o.created_at)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <a href={o.url} target="_blank" rel="noreferrer" className={btn.outline}>
                <Eye className="h-4 w-4" /> {o.views} · Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Row>
          ))}
          {d.offers.length === 0 && (
            <li>
              <Empty>No offers yet.</Empty>
            </li>
          )}
        </Rows>
      </Panel>
    </div>
  )
}
