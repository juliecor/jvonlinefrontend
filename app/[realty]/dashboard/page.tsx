import Link from "next/link"
import { ArrowRight, Building2, FileText, Users } from "lucide-react"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export const metadata = { title: "Overview" }

type Overview = {
  realty: { name: string; slug: string; email: string | null; contact_name: string | null; phone: string | null; address: string | null; about: string | null; registered_at: string | null }
  stats: { agents: number; agents_invited: number; staff: number; projects: number; units: number; offers: number }
}

/** The realty dashboard's first page. */
export default async function RealtyOverviewPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  const { realty, stats } = await api<Overview>("/realty/overview", { token })
  const staff = user.role === "realty"

  const tiles = [
    { icon: Building2, value: stats.projects, label: "Projects", note: `${stats.units} unit${stats.units === 1 ? "" : "s"} listed`, href: `/${slug}/dashboard/projects` },
    { icon: FileText, value: stats.offers, label: staff ? "Active offers" : "Your active offers", note: "sent to buyers", href: `/${slug}/dashboard/offers` },
    ...(staff ? [{ icon: Users, value: stats.agents, label: "Agents", note: stats.agents_invited ? `${stats.agents_invited} invite${stats.agents_invited === 1 ? "" : "s"} open` : "signed up", href: `/${slug}/dashboard/agents` }] : []),
  ]

  return (
    <div>
      <p className="text-sm text-slate-500">Hello, {user.name.split(" ")[0]}.</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{realty.name}</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {tiles.map(({ icon: Icon, value, label, note, href }) => (
          <Link key={label} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400">
            <Icon className="h-5 w-5 text-slate-400" />
            <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            <p className="mt-1 text-sm font-medium">{label}</p>
            <p className="text-xs text-slate-500">{note}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold">Send a buyer an offer</h2>
          <p className="mt-1 text-sm text-slate-500">Pick a unit and a payment plan, enter the buyer&apos;s name, and you get a link to send them.</p>
          <Link href={`/${slug}/dashboard/offers/new`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
            New offer <ArrowRight className="h-4 w-4" />
          </Link>
          {stats.units === 0 && staff && <p className="mt-3 text-xs text-amber-700">Add a project with at least one unit first.</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold">Company details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex gap-3"><dt className="w-20 shrink-0 text-slate-400">Page</dt><dd><Link href={`/${slug}`} className="font-medium text-slate-900 hover:underline">jvconline.ph/{slug}</Link></dd></div>
            <div className="flex gap-3"><dt className="w-20 shrink-0 text-slate-400">Contact</dt><dd>{realty.contact_name ?? "—"}</dd></div>
            <div className="flex gap-3"><dt className="w-20 shrink-0 text-slate-400">Email</dt><dd>{realty.email ?? "—"}</dd></div>
            <div className="flex gap-3"><dt className="w-20 shrink-0 text-slate-400">Phone</dt><dd>{realty.phone ?? "—"}</dd></div>
            <div className="flex gap-3"><dt className="w-20 shrink-0 text-slate-400">Address</dt><dd>{realty.address ?? "—"}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  )
}
