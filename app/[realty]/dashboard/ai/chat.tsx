"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BellRing, MessageSquare, Plus, Sparkles, Trash2, X } from "lucide-react"
import { confirmAction, toast } from "@/components/feedback"
import { timeAgo } from "@/lib/format"
import { type ChatMessage, type ChatSummary, deleteChat } from "./actions"
import { AskBox, Thread } from "./messages"
import { useAssistant } from "./use-assistant"

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

/** The assistant's chat: past chats on the side, the conversation, and the question box. */
export function AssistantChat({ slug, name, firstName, isAgent, chats: initialChats, chatId: initialId, initial, attention }: Props) {
  const router = useRouter()
  const [chats, setChats] = useState(initialChats)
  const [showList, setShowList] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const base = `/${slug}/dashboard/ai`
  const { chat: chatId, messages, pending, status, error, streaming, cards, ask: send } = useAssistant({
    slug,
    chatId: initialId,
    initial,
    onSaved: (saved, isNew) => {
      setChats((list) => [saved, ...list.filter((c) => c.id !== saved.id)])
      if (isNew) window.history.replaceState(null, "", `${base}?chat=${saved.id}`)
    },
  })

  // Follow the answer as it grows, unless the person scrolled up to read something.
  useEffect(() => {
    const el = scroller.current
    if (el && messages.length > 0 && el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight
  }, [messages.length, pending, streaming, cards])

  const ask = (question: string) => {
    requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight }))
    return send(question)
  }

  const remove = async (id: number, title: string) => {
    const ok = await confirmAction({ title: "Delete this chat?", body: `"${title}" and its answers will be gone for good.`, confirm: "Delete chat", danger: true })
    if (!ok) return
    const r = await deleteChat(slug, id)
    if (r.error) return toast(r.error, "error")
    setChats((list) => list.filter((c) => c.id !== id))
    toast("Chat deleted")
    if (id === chatId) router.push(base)
  }

  const list = (
    <div className="flex h-full flex-col border border-[#e0dcd5] bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-[#e6e2db] p-3">
        <p className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-[#6b665d]">Your chats</p>
        <button type="button" onClick={() => setShowList(false)} aria-label="Close chats" className="p-1 text-[#6b665d] lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-3">
        <Link href={base} className="flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
          <Plus className="h-4 w-4" strokeWidth={2.5} /> New chat
        </Link>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {chats.map((c) => (
          <li key={c.id} className="group relative">
            <Link
              href={`${base}?chat=${c.id}`}
              className={`block py-2.5 pl-3 pr-9 transition ${c.id === chatId ? "bg-[color-mix(in_srgb,var(--accent)_10%,white)]" : "hover:bg-[#f6f4f0]"}`}
            >
              <p className={`truncate text-sm ${c.id === chatId ? "font-bold" : "font-semibold text-[#3d3a34]"}`}>{c.title}</p>
              <p className="text-xs text-[#8a847a]">{timeAgo(c.updated_at)}</p>
            </Link>
            <button type="button" onClick={() => remove(c.id, c.title)} aria-label={`Delete "${c.title}"`} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[#a39d92] opacity-100 transition hover:text-red-700 lg:opacity-0 lg:group-hover:opacity-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {chats.length === 0 && <li className="px-3 py-6 text-sm text-[#8a847a]">Your questions and answers will be kept here.</li>}
      </ul>
    </div>
  )

  return (
    <div className="flex gap-4 lg:h-[calc(100dvh-9rem)]">
      {/* Past chats: a column on wide screens, a panel on phones */}
      <aside className="hidden w-64 shrink-0 lg:block">{list}</aside>
      {showList && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button type="button" aria-label="Close chats" onClick={() => setShowList(false)} className="absolute inset-0 bg-[#17150f]/40" />
          <div className="relative h-full w-[86%] max-w-[320px]">{list}</div>
        </div>
      )}

      <section className="flex h-[calc(100dvh-10rem)] min-w-0 flex-1 flex-col border border-[#e0dcd5] bg-white lg:h-full">
        <header className="flex items-center gap-3 border-b border-[#e6e2db] px-4 py-3 sm:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--accent)] text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold leading-tight tracking-tight">{name}</h1>
            <p className="truncate text-xs text-[#6b665d]">Answers from your dashboard&apos;s live data</p>
          </div>
          <button type="button" onClick={() => setShowList(true)} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] px-3 py-2 text-sm font-bold lg:hidden">
            <MessageSquare className="h-4 w-4" /> Chats
          </button>
          {messages.length > 0 && (
            <Link href={base} className="hidden items-center gap-1.5 border border-[#d9d4cb] px-3 py-2 text-sm font-bold transition hover:border-[#17150f] sm:inline-flex">
              <Plus className="h-4 w-4" /> New chat
            </Link>
          )}
        </header>

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center pt-2 text-center sm:pt-6">
              <span className="flex h-14 w-14 items-center justify-center bg-[var(--accent)] text-white">
                <Sparkles className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Hi {firstName}, what do you want to know?</h2>
              <p className="mt-2 max-w-md text-[15px] text-[#5a554d]">
                Ask about projects, units and prices, payment plans, {isAgent ? "your offers and your buyers" : "offers, buyers and agents"}. Type or tap the mic. {name} looks it up in your dashboard as you ask.
              </p>
              <button type="button" onClick={() => ask(TODAY)} className="group mt-7 flex w-full items-center gap-4 bg-[#17150f] px-4 py-4 text-left text-white transition hover:bg-black sm:px-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--accent)]">
                  <BellRing className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold sm:text-lg">{TODAY}</span>
                  <span className="mt-0.5 block text-sm text-white/70">
                    {attention === 0 ? "You're all caught up. Ask for today's summary anyway." : isAgent ? "New answers, files to check and buyers to follow up" : "New answers, approvals, files to check and buyers to follow up"}
                  </span>
                </span>
                {!!attention && (
                  <span className="flex h-8 min-w-8 shrink-0 items-center justify-center bg-[var(--accent)] px-2 text-sm font-bold tabular-nums" aria-label={`${attention} waiting`}>
                    {attention}
                  </span>
                )}
                <ArrowRight className="hidden h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 sm:block" />
              </button>
              <div className="mt-2 grid w-full gap-2 sm:grid-cols-2">
                {(isAgent ? AGENT_IDEAS : STAFF_IDEAS).map((idea) => (
                  <button key={idea} type="button" onClick={() => ask(idea)} className="border border-[#e0dcd5] bg-[#faf8f5] px-4 py-3 text-left text-sm font-semibold text-[#3d3a34] transition hover:border-[var(--accent)] hover:bg-white hover:text-[#17150f]">
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">
              <Thread slug={slug} messages={messages} pending={pending} status={status} streaming={streaming} cards={cards} onAsk={ask} />
            </div>
          )}
        </div>

        <AskBox slug={slug} name={name} pending={pending} error={error} onSend={ask} hint={`${name} reads your dashboard and can't change anything. Check prices before you send them to a buyer.`} />
      </section>
    </div>
  )
}
