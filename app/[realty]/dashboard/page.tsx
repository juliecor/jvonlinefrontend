import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Ledger, PageHeader, Panel, btn, display } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export const metadata = { title: "Overview" }

type Overview = {
  realty: { name: string; slug: string; email: string | null; contact_name: string | null; phone: string | null; address: string | null; about: string | null; registered_at: string | null }
  stats: { agents: number; agents_invited: number; staff: number; projects: number; units: number; offers: number }
}

const greeting = () => {
  const h = Number(new Date().toLocaleString("en-PH", { hour: "numeric", hour12: false, timeZone: "Asia/Manila" }))
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
}

/** The realty dashboard's first page: the numbers, and the two things people come here to do. */
export default async function RealtyOverviewPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  const { realty, stats } = await api<Overview>("/realty/overview", { token })
  const staff = user.role === "realty"

  return (
    <div>
      <PageHeader eyebrow={realty.name} title={`${greeting()}, ${user.name.split(" ")[0]}.`} lede={staff ? "Here's where your realty stands today." : "Here's where your sales stand today."} />

      <Ledger
        items={[
          { label: "Projects", value: stats.projects, note: `${stats.units} unit${stats.units === 1 ? "" : "s"} listed`, href: `/${slug}/dashboard/projects` },
          { label: staff ? "Active offers" : "Your offers", value: stats.offers, note: "links sent to buyers", href: `/${slug}/dashboard/offers` },
          ...(staff
            ? [{ label: "Agents", value: stats.agents, note: stats.agents_invited ? `${stats.agents_invited} invite${stats.agents_invited === 1 ? "" : "s"} open` : "on your team", href: `/${slug}/dashboard/agents` }]
            : []),
        ]}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <h2 className={`${display} text-3xl tracking-tight`}>Send a buyer an offer</h2>
          <p className="mt-2 max-w-md text-sm text-[#6b665d]">Pick a unit and a payment plan, type the buyer&apos;s name, and you get a link with the price, the schedule and your contact details.</p>
          <Link href={`/${slug}/dashboard/offers/new`} className={`${btn.primary} mt-5`}>
            New offer <ArrowRight className="h-4 w-4" />
          </Link>
          {stats.units === 0 && <p className="mt-4 text-xs text-amber-700">{staff ? "Add a project with at least one unit first." : "Your realty hasn't listed any units yet."}</p>}
        </section>
        <Panel title="Company" className="!mt-0">
          <dl className="divide-y divide-[#e6e2db] text-sm">
            {[
              ["Page", <Link key="p" href={`/${slug}`} className="font-medium hover:text-[var(--accent)]">jvconline.ph/{slug}</Link>],
              ["Contact", realty.contact_name ?? "—"],
              ["Email", realty.email ?? "—"],
              ["Phone", realty.phone ?? "—"],
              ["Address", realty.address ?? "—"],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between gap-4 py-2.5">
                <dt className="text-[#8a847a]">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  )
}
