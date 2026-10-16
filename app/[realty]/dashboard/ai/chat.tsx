"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BellRing, MessageSquare, Plus, Sparkles, Trash2, X } from "lucide-react"
import { display } from "@/components/dashboard-ui"
import { confirmAction, toast } from "@/components/feedback"
import { timeAgo } from "@/lib/format"
import { type ChatMessage, type ChatSummary, deleteChat } from "./actions"
import { AskBox, Thread } from "./messages"
import { useAssistant } from "./use-assistant"
import { useFollow } from "./use-follow"

const TODAY = "What needs my attention today?"
const STAFF_IDEAS = [
  "Show the 4 cheapest available units",
  "Which offers are still missing documents?",
  "Write a Viber follow-up for buyers missing documents",
  "What did buyers say this week?",
  "Compare the payment plans of our projects",
  "Which agents have the most active offers?",
]
const AGENT_IDEAS = [
  "Show the 4 cheapest available units",
  "Which of my buyers haven't answered yet?",
  "Write a Viber follow-up for my buyers missing documents",
  "What payment plans does each project have?",
]

type Props = { slug: string; name: string; firstName: string; isAgent: boolean; chats: ChatSummary[]; chatId: number | null; initial: ChatMessage[]; attention: number | null }

/** The assistant's chat across the whole screen: past chats on the side, the conversation, and the question box. */
export function AssistantChat({ slug, name, firstName, isAgent, chats: initialChats, chatId: initialId, initial, attention }: Props) {
  const router = useRouter()
  const [chats, setChats] = useState(initialChats)
  const [showList, setShowList] = useState(false)
  const { ref: scroller, follow } = useFollow<HTMLDivElement>()
  const base = `/${slug}/dashboard/ai`
  const { chat: chatId, messages, pending, status, error, streaming, cards, ask: send, reset } = useAssistant({
    slug,
    chatId: initialId,
    initial,
    onSaved: (saved, isNew) => {
      setChats((list) => [saved, ...list.filter((c) => c.id !== saved.id)])
      if (isNew) window.history.replaceState(null, "", `${base}?chat=${saved.id}`)
    },
  })

  const ask = (question: string) => {
    follow()
    return send(question)
  }

  // A chat started here only changed the address (not the page), so the page alone wouldn't start over:
  // clear it in place, then go to the plain address so the server's page matches.
  const startNew = () => {
    if (pending) return
    reset()
    setShowList(false)
    follow()
    router.push(base)
  }

  const remove = async (id: number, title: string) => {
    const ok = await confirmAction({ title: "Delete this chat?", body: `"${title}" and its answers will be gone for good.`, confirm: "Delete chat", danger: true })
    if (!ok) return
    const r = await deleteChat(slug, id)
    if (r.error) return toast(r.error, "error")
    setChats((list) => list.filter((c) => c.id !== id))
    toast("Chat deleted")
    if (id === chatId) startNew()
  }

  const list = (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8eaed] bg-white shadow-[0_2px_12px_-2px_rgba(23,21,15,0.06)]">
      <div className="flex items-center justify-between gap-2 border-b border-[#f0eeea] px-4 py-3.5">
        <p className={`${display} flex items-center gap-2 text-[17px] text-[#17150f]`}>
          Your chats {chats.length > 0 && <span className="rounded-full bg-[#f1eee9] px-2 py-0.5 text-xs font-bold tabular-nums text-[#6b665d]">{chats.length}</span>}
        </p>
        <button type="button" onClick={() => setShowList(false)} aria-label="Close chats" className="p-1 text-[#6b665d] lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-3">
        <button type="button" onClick={startNew} disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50">
          <Plus className="h-4 w-4" strokeWidth={2.5} /> New chat
        </button>
      </div>
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {chats.map((c) => (
          <li key={c.id} className="group relative">
            <Link
              href={`${base}?chat=${c.id}`}
              className={`flex items-start gap-2.5 rounded-xl py-2.5 pl-3 pr-9 transition ${c.id === chatId ? "bg-[color-mix(in_srgb,var(--accent)_9%,white)] shadow-[inset_3px_0_0_var(--accent)]" : "hover:bg-[#f6f4f0]"}`}
            >
              <MessageSquare className={`mt-0.5 h-4 w-4 shrink-0 ${c.id === chatId ? "text-[var(--accent)]" : "text-[#a39d92]"}`} />
              <span className="min-w-0">
                <span className={`block truncate text-sm ${c.id === chatId ? "font-bold text-[#17150f]" : "font-semibold text-[#3d3a34]"}`}>{c.title}</span>
                <span className="block text-xs text-[#8a847a]">{timeAgo(c.updated_at)}</span>
              </span>
            </Link>
            <button type="button" onClick={() => remove(c.id, c.title)} aria-label={`Delete "${c.title}"`} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#a39d92] opacity-100 transition hover:bg-red-50 hover:text-red-700 lg:opacity-0 lg:group-hover:opacity-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {chats.length === 0 && <li className="px-3 py-6 text-sm text-[#8a847a]">Your questions and answers will be kept here.</li>}
      </ul>
    </div>
  )

  return (
    <div className="flex gap-4 lg:h-[calc(100dvh-2.5rem)]">
      {/* Past chats: a column on wide screens, a panel on phones */}
      <aside className="hidden w-72 shrink-0 lg:block">{list}</aside>
      {showList && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button type="button" aria-label="Close chats" onClick={() => setShowList(false)} className="absolute inset-0 bg-[#17150f]/40" />
          <div className="relative h-full w-[86%] max-w-[320px]">{list}</div>
        </div>
      )}

      <section className="flex h-[calc(100dvh-6rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e8eaed] bg-white shadow-[0_2px_12px_-2px_rgba(23,21,15,0.06)] sm:h-[calc(100dvh-7rem)] lg:h-full">
        <header className="flex items-center gap-3 border-b border-[#f0eeea] px-4 py-3 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-[0_6px_16px_-6px_var(--accent)]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className={`${display} text-[19px] leading-tight tracking-tight text-[#17150f]`}>{name}</h1>
            <p className="truncate text-xs text-[#6b665d]">Answers from your dashboard&apos;s live data</p>
          </div>
          <button type="button" onClick={() => setShowList(true)} className="rounded-xl inline-flex items-center gap-1.5 border border-[#d9d4cb] px-3 py-2 text-sm font-bold lg:hidden">
            <MessageSquare className="h-4 w-4" /> Chats
          </button>
          {messages.length > 0 && (
            <button type="button" onClick={startNew} disabled={pending} className="hidden items-center gap-1.5 rounded-xl border border-[#d9d4cb] px-3 py-2 text-sm font-bold transition hover:border-[#17150f] disabled:opacity-50 sm:inline-flex">
              <Plus className="h-4 w-4" /> New chat
            </button>
          )}
        </header>

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-4xl flex-col items-center pt-1 text-center sm:pt-3">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-[0_10px_28px_-10px_var(--accent)]">
                <Sparkles className="h-8 w-8" />
              </span>
              <h2 className={`${display} mt-5 text-[26px] leading-tight tracking-tight text-[#17150f] sm:text-[34px]`}>Hi {firstName}, what do you want to know?</h2>
              <p className="mt-2 max-w-xl text-[15px] text-[#5a554d]">
                Ask about projects, units and prices, payment plans, {isAgent ? "your offers and your buyers" : "offers, buyers and agents"}. Type or tap the mic. {name} looks it up in your dashboard as you ask.
              </p>
              <button type="button" onClick={() => ask(TODAY)} className="group mt-6 flex w-full items-center gap-4 rounded-2xl bg-[#17150f] px-4 py-4 text-left text-white shadow-[0_10px_30px_-14px_rgba(23,21,15,0.6)] transition hover:bg-black sm:px-6 sm:py-5">
                <span className="rounded-xl flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--accent)]">
                  <BellRing className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`${display} block text-base sm:text-[19px]`}>{TODAY}</span>
                  <span className="mt-0.5 block text-sm text-white/70">
                    {attention === 0 ? "You're all caught up. Ask for today's summary anyway." : isAgent ? "New answers, files to check and buyers to follow up" : "New answers, approvals, files to check and buyers to follow up"}
                  </span>
                </span>
                {!!attention && (
                  <span className="rounded-xl flex h-8 min-w-8 shrink-0 items-center justify-center bg-[var(--accent)] px-2 text-sm font-bold tabular-nums" aria-label={`${attention} waiting`}>
                    {attention}
                  </span>
                )}
                <ArrowRight className="hidden h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 sm:block" />
              </button>
              <p className="mt-5 w-full text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a847a]">Or try one of these</p>
              <div className="mt-2 grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(isAgent ? AGENT_IDEAS : STAFF_IDEAS).map((idea) => (
                  <button key={idea} type="button" onClick={() => ask(idea)} className="group flex items-center justify-between gap-3 rounded-xl border border-[#e8eaed] bg-[#fbfaf8] px-4 py-3.5 text-left text-sm font-semibold text-[#3d3a34] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-white hover:text-[#17150f] hover:shadow-[0_6px_18px_-8px_rgba(23,21,15,0.2)]">
                    {idea}
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#c9c4bb] transition group-hover:text-[var(--accent)]" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl">
              <Thread slug={slug} messages={messages} pending={pending} status={status} streaming={streaming} cards={cards} onAsk={ask} />
            </div>
          )}
        </div>

        <AskBox slug={slug} name={name} pending={pending} error={error} onSend={ask} inner="mx-auto max-w-4xl" hint={`${name} reads your dashboard. It only changes something when you press a button it shows you. Check prices before you send them to a buyer.`} />
      </section>
    </div>
  )
}
