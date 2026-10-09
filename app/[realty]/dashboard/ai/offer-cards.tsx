"use client"

import Link from "next/link"
import { ArrowRight, Copy, Eye, EyeOff, Home, MessageSquareText } from "lucide-react"
import { Tag } from "@/components/dashboard-ui"
import { confirmAction, toast } from "@/components/feedback"
import { LeadTag, NewTag } from "@/components/leads"
import { php, shortDate, timeAgo } from "@/lib/format"
import { ReqChip } from "../offers/req-chip"
import type { OfferCard } from "./actions"
import { Photo } from "@/components/photo"

/**
 * Buyers the AI put under its answer, as the offers list shows them (answer,
 * documents, how often they opened it), with Open offer, Copy link and Write
 * follow-up, which asks the AI for the message right away.
 */
export function OfferCards({ slug, cards, onAsk }: { slug: string; cards: OfferCard[]; onAsk?: (question: string) => void }) {
  return (
    <ul className="mt-4 space-y-3">
      {cards.map((o) => (
        <li key={o.id} className="border border-[#e0dcd5] bg-white">
          <div className="flex gap-3 p-3 sm:gap-4">
            <Link href={`/${slug}/dashboard/offers/${o.id}`} className="relative h-20 w-20 shrink-0 overflow-hidden bg-[#f1eee9] sm:h-24 sm:w-28">
              {o.photo ? (
                <Photo src={o.photo} sizes="112px" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <Home className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-[#c9c3b8]" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <Link href={`/${slug}/dashboard/offers/${o.id}`} className="text-base font-bold text-[#17150f] hover:text-[var(--accent)]">
                  {o.buyer}
                </Link>
                <span className="font-mono text-xs text-[#a39d92]">{o.code}</span>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {o.status === "void" && <Tag>Void</Tag>}
                {o.unit_status === "sold" && <span className="bg-[#17150f] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">Sold</span>}
                {o.unit_status === "reserved" && <Tag tone="warn">Reserved</Tag>}
                {o.status === "active" && o.approval_status === "pending" && <Tag tone="warn">Waiting for approval</Tag>}
                {o.status === "active" && o.approval_status === "rejected" && <Tag tone="bad">Sent back</Tag>}
                {o.answer ? <LeadTag kind={o.answer.kind} label={o.answer.label} /> : <Tag>No answer yet</Tag>}
                {o.new_answers > 0 && <NewTag />}
                {o.requirements.required > 0 && o.status === "active" && <ReqChip r={o.requirements} />}
              </div>
              <p className="mt-1.5 text-sm text-[#6b665d]">{[o.project, o.unit, php(o.price), o.agent ? `by ${o.agent}` : null].filter(Boolean).join(" · ")}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-[#8a847a]">
                Sent {shortDate(o.sent)} ·
                {o.views > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[#3d3a34]">
                    <Eye className="h-3.5 w-3.5" /> Opened {o.views}× · last {timeAgo(o.last_viewed_at)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <EyeOff className="h-3.5 w-3.5" /> Not opened yet
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-[#efebe5] p-2.5 sm:px-3">
            <Link href={`/${slug}/dashboard/offers/${o.id}`} className="inline-flex items-center gap-1.5 bg-[#17150f] px-3 py-2 text-sm font-bold text-white transition hover:bg-black">
              Open offer <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {o.url && (
              <button type="button" onClick={() => copyLink(o.url as string)} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-3 py-2 text-sm font-bold text-[#17150f] transition hover:border-[#17150f]">
                <Copy className="h-3.5 w-3.5" /> Copy link
              </button>
            )}
            {o.status === "active" && onAsk && (
              <button type="button" onClick={() => onAsk(`Write a Viber follow-up for ${o.buyer} (offer ${o.code})`)} className="inline-flex items-center gap-1.5 border border-[var(--accent)] bg-white px-3 py-2 text-sm font-bold text-[var(--accent)] transition hover:bg-[color-mix(in_srgb,var(--accent)_8%,white)]">
                <MessageSquareText className="h-3.5 w-3.5" /> Write follow-up
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

async function copyLink(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    toast("Buyer's link copied")
  } catch {
    await confirmAction({ title: "Copy this", body: "This browser didn't let the page copy it. Tap the box, select all and copy.", copy: url, confirm: "Done" })
  }
}
