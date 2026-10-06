import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { api } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"
import { InviteRealtyForm } from "./invite-form"
import { ResendButton } from "./resend-button"

export const metadata = { title: "Realties" }

type Realty = {
  id: number
  name: string
  slug: string
  email: string | null
  status: "invited" | "active"
  invited_at: string | null
  registered_at: string | null
  users_count: number
  latest_invitation: { email: string; expires_at: string; accepted_at: string | null } | null
}

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "—")

/** jvconline.ph/admin/realties — every realty on the platform, and the invite form. */
export default async function AdminRealtiesPage() {
  const { token } = await requireAdmin()
  const realties = await api<Realty[]>("/admin/realties", { token })

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Realties</h1>
      <p className="mt-1 text-sm text-slate-500">Each realty gets its own page at jvconline.ph/&lt;address&gt;, its own login and its own dashboard.</p>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-semibold">Invite a realty</h2>
        <p className="mt-1 mb-5 text-sm text-slate-500">They get an email with a link to the registration form. The link works for 7 days.</p>
        <InviteRealtyForm />
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {realties.map((r) => {
            const expired = r.status === "invited" && r.latest_invitation && new Date(r.latest_invitation.expires_at) < new Date()
            return (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/realties/${r.id}`} className="font-semibold hover:underline">{r.name}</Link>
                    {r.status === "active" ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Active</span>
                    ) : expired ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-700">Invite expired</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">Invited</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    jvconline.ph/{r.slug}
                    {r.email && <> · {r.email}</>}
                    {r.status === "active" ? <> · registered {when(r.registered_at)} · {r.users_count} login{r.users_count === 1 ? "" : "s"}</> : <> · invited {when(r.invited_at)}</>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/admin/realties/${r.id}`} className="inline-flex items-center rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900">
                    Details
                  </Link>
                  {r.status === "active" ? (
                    <Link href={`/${r.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900">
                      Open page <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <ResendButton id={r.id} />
                  )}
                </div>
              </li>
            )
          })}
          {realties.length === 0 && <li className="px-6 py-10 text-center text-sm text-slate-500">No realties yet — invite the first one above.</li>}
        </ul>
      </section>
    </div>
  )
}
