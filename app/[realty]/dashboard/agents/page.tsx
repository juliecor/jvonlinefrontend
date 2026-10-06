import { redirect } from "next/navigation"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { InviteAgentForm } from "./invite-form"
import { ResendAgentButton } from "./resend-button"

export const metadata = { title: "Agents" }

type Agents = {
  agents: { id: number; name: string; email: string; joined_at: string }[]
  invitations: { id: number; name: string; email: string; invited_at: string; expires_at: string; expired: boolean }[]
}

const when = (iso: string) => new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })

/** jvconline.ph/<realty>/dashboard/agents — the realty's agents and open invites. Staff only. */
export default async function RealtyAgentsPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  if (user.role !== "realty") redirect(`/${slug}/dashboard`)
  const { agents, invitations } = await api<Agents>("/realty/agents", { token })

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Agents</h1>
      <p className="mt-1 text-sm text-slate-500">Your agents sign in at jvconline.ph/{slug}/login and send buyers sales offers under your name.</p>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-semibold">Invite an agent</h2>
        <p className="mt-1 mb-5 text-sm text-slate-500">They get an email with a link to set their password. The link works for 7 days.</p>
        <InviteAgentForm slug={slug} />
      </section>

      {invitations.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-6">Invited, not yet joined</h2>
          <ul className="divide-y divide-slate-100">
            {invitations.map((i) => (
              <li key={i.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{i.name}</p>
                    {i.expired ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-700">Link expired</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">Invited</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">{i.email} · invited {when(i.invited_at)}</p>
                </div>
                <ResendAgentButton slug={slug} id={i.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-6">Agents ({agents.length})</h2>
        <ul className="divide-y divide-slate-100">
          {agents.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="font-semibold">{a.name}</p>
                <p className="mt-0.5 truncate text-sm text-slate-500">{a.email}</p>
              </div>
              <p className="text-xs text-slate-400">joined {when(a.joined_at)}</p>
            </li>
          ))}
          {agents.length === 0 && <li className="px-6 py-10 text-center text-sm text-slate-500">No agents yet. Invite the first one above.</li>}
        </ul>
      </section>
    </div>
  )
}
