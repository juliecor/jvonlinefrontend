import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { Ledger, PageHeader, Panel, Tag, btn } from "@/components/dashboard-ui"
import { ContactButtons, LeadTag, VIA_LABEL, type Lead } from "@/components/leads"
import { ApiError, api } from "@/lib/api"
import { longDate, php, shortDate, sqm, timeAgo } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { voidOffer } from "../actions"
import { SyncCounts } from "./sync"

export const metadata = { title: "Offer" }

type OfferDetail = {
  id: number
  code: string
  status: "active" | "void"
  buyer_name: string
  buyer_email: string | null
  purchase_date: string
  price: number
  views: number
  created_at: string
  project: string | null
  unit: string | null
  agent: string | null
  url: string
  first_viewed_at: string | null
  last_viewed_at: string | null
  responses_count: number
  new_responses: number
  schedule: { label: string; percent: number; date: string | null; amount: number }[]
  fee_notes: string | null
  unit_detail: { name: string | null; unit_type: string | null; area_sqm: number | null; status: string | null }
  responses: Lead[]
}

/** jvconline.ph/<realty>/dashboard/offers/<id> — one offer: did the buyer open it, what did they say, and how to reach them. */
export default async function OfferDetailPage({ params }: { params: Promise<{ realty: string; id: string }> }) {
  const { realty: slug, id } = await params
  const { user, token } = await requireRealtyUser(slug)
  if (!/^\d+$/.test(id)) notFound()
  let o: OfferDetail
  try {
    o = await api<OfferDetail>(`/realty/offers/${id}`, { token })
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }
  const staff = user.role === "realty"
  const hadNew = o.responses.some((r) => r.new)
  const latest = o.responses[0]

  // What happened, newest first: responses, views, the offer being sent.
  const activity = [
    ...o.responses.map((r) => ({ at: r.created_at, text: `${r.name} answered: ${r.label}` })),
    ...(o.last_viewed_at && o.views > 1 ? [{ at: o.last_viewed_at, text: "Opened the offer again" }] : []),
    ...(o.first_viewed_at ? [{ at: o.first_viewed_at, text: "Opened the offer for the first time" }] : []),
    { at: o.created_at, text: `${o.agent ?? "The agent"} sent the offer` },
  ].sort((a, b) => b.at.localeCompare(a.at))

  return (
    <div>
      {hadNew && <SyncCounts slug={slug} />}
      <Link href={`/${slug}/dashboard/offers`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b665d] hover:text-[#17150f]">
        <ArrowLeft className="h-4 w-4" /> All offers
      </Link>
      <PageHeader
        eyebrow={`Sales offer · ${o.code}`}
        title={o.buyer_name}
        lede={[o.project, o.unit, staff && o.agent ? `by ${o.agent}` : null].filter(Boolean).join(" · ")}
        action={
          o.status === "active" ? (
            <>
              <CopyButton text={o.url} className="!rounded-none !px-4 !py-3 !text-sm" />
              <a href={o.url} target="_blank" rel="noreferrer" className={btn.primary}>
                Open buyer&apos;s page <ExternalLink className="h-4 w-4" />
              </a>
            </>
          ) : (
            <Tag tone="bad">Void</Tag>
          )
        }
      />

      <Ledger
        items={[
          { label: "Opened", value: o.views ? `${o.views}×` : "Not yet", note: o.views ? `last ${timeAgo(o.last_viewed_at)}` : "the buyer hasn't opened the link" },
          { label: "Response", value: latest ? latest.label : "None yet", note: latest ? timeAgo(latest.created_at) : "waiting for the buyer" },
          { label: "Price", value: php(o.price), note: `sent ${shortDate(o.created_at)}` },
        ]}
      />

      <div className="grid gap-x-12 lg:grid-cols-[1.5fr_1fr]">
        <Panel title={`Buyer responses · ${o.responses.length}`}>
          {o.responses.length ? (
            <ul className="divide-y divide-[#e6e2db]">
              {o.responses.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <LeadTag kind={r.kind} label={r.label} />
                    <span className="text-sm font-medium text-[#8a847a]">
                      {timeAgo(r.created_at)} · {longDate(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-bold tracking-tight">{r.name}</p>
                  <p className="mt-1 text-[15px] text-[#3d3a34]">
                    {[r.phone, r.email].filter(Boolean).join(" · ") || "No contact details left"}
                    {r.contact_via && r.kind !== "not_interested" && <span className="text-[#8a847a]"> · prefers {VIA_LABEL[r.contact_via]}</span>}
                  </p>
                  {r.message && <blockquote className="mt-4 border-l-4 border-[var(--accent)] bg-[#f6f4f0] px-4 py-3 text-[15px] leading-relaxed text-[#17150f]">{r.message}</blockquote>}
                  <div className="mt-4">
                    <ContactButtons phone={r.phone} email={r.email} via={r.contact_via} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8">
              <p className="text-lg font-bold">No response yet.</p>
              <p className="mt-1 max-w-lg text-[15px] text-[#5a554d]">
                The offer page asks {o.buyer_name.split(" ")[0]} what they&apos;d like to do: they&apos;re interested, they have a question, or it&apos;s not for them. Their answer shows up here
                {o.agent ? `, and ${staff ? o.agent : "you"} get${staff ? "s" : ""} an email` : ""}.
              </p>
              {o.status === "active" && !o.views && <p className="mt-3 text-sm font-semibold text-amber-700">They haven&apos;t opened the link yet. Copy it and send it again?</p>}
            </div>
          )}
        </Panel>

        <div>
          <Panel title="Activity">
            <ol className="relative mt-4 space-y-5 border-l-2 border-[#e6e2db] pl-5">
              {activity.map((a, i) => (
                <li key={i} className="relative">
                  <span aria-hidden className={`absolute -left-[27px] top-1.5 h-3 w-3 ${i === 0 ? "bg-[var(--accent)]" : "bg-[#d9d4cb]"}`} />
                  <p className="text-[15px] font-semibold">{a.text}</p>
                  <p className="text-sm text-[#8a847a]">
                    {shortDate(a.at)} · {new Date(a.at).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" })}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="The offer">
            <dl className="divide-y divide-[#e6e2db] text-[15px]">
              {[
                ["Unit", [o.unit_detail.name, o.unit_detail.unit_type].filter(Boolean).join(" · ") || "—"],
                ["Floor area", sqm(o.unit_detail.area_sqm)],
                ["Buyer email", o.buyer_email ?? "—"],
                ["Purchase date", longDate(o.purchase_date)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-[#8a847a]">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#6b665d]">Payment schedule</h3>
            <ul className="mt-2 divide-y divide-[#e6e2db] text-sm">
              {o.schedule.map((s, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 py-2">
                  <span className="min-w-0">
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-[#8a847a]"> · {s.percent}%{s.date ? ` · ${shortDate(s.date)}` : ""}</span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">{php(s.amount)}</span>
                </li>
              ))}
            </ul>
            {o.status === "active" && (
              <form action={voidOffer.bind(null, slug, o.id)} className="mt-6 border-t border-[#e6e2db] pt-4">
                <button type="submit" className="text-sm font-semibold text-[#8a847a] hover:text-red-700">Void this offer</button>
                <p className="mt-1 text-xs text-[#a39d92]">The buyer&apos;s link stops working. Responses already received stay here.</p>
              </form>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
