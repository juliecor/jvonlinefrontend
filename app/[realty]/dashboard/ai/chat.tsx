"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUp, Check, Copy, MessageSquare, Plus, Sparkles, Trash2, X } from "lucide-react"
import { Markdown } from "@/components/markdown"
import { timeAgo } from "@/lib/format"
import { type ChatMessage, type ChatSummary, askAssistant, deleteChat } from "./actions"

const STAFF_IDEAS = [
  "How many units are available in each project?",
  "Which offers are still missing documents?",
  "What did buyers say this week?",
  "Show the 5 cheapest available units",
  "Compare the payment plans of our projects",
  "Which agents have the most active offers?",
]
const AGENT_IDEAS = [
  "Which of my buyers haven't answered yet?",
  "Which of my offers are missing documents?",
  "Show the 5 cheapest available units",
  "What payment plans does each project have?",
]

type Props = { slug: string; name: string; firstName: string; isAgent: boolean; chats: ChatSummary[]; chatId: number | null; initial: ChatMessage[] }

/** The assistant's chat: past chats on the side, the conversation, and the question box. */
export function AssistantChat({ slug, name, firstName, isAgent, chats: initialChats, chatId: initialId, initial }: Props) {
  const router = useRouter()
  const [chats, setChats] = useState(initialChats)
  const [chatId, setChatId] = useState(initialId)
  const [messages, setMessages] = useState(initial)
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [showList, setShowList] = useState(false)
  const [pending, start] = useTransition()
  const bottom = useRef<HTMLDivElement>(null)
  const base = `/${slug}/dashboard/ai`

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" })
  }, [messages.length, pending])

  const ask = (question: string) => {
    const q = question.trim()
    if (!q || pending) return
    setError("")
    setText("")
    setMessages((m) => [...m, { id: -Date.now(), role: "user", content: q, created_at: new Date().toISOString() }])
    start(async () => {
      const r = await askAssistant(slug, chatId, q)
      if (!r.message || !r.chat) {
        // Nothing was saved: take the question back so it can be sent again.
        setMessages((m) => m.slice(0, -1))
        setText(q)
        setError(r.error ?? "Something went wrong. Try again.")
        return
      }
      const saved = r.chat
      setMessages((m) => [...m, r.message!])
      setChats((list) => [saved, ...list.filter((c) => c.id !== saved.id)])
      if (!chatId) {
        setChatId(saved.id)
        window.history.replaceState(null, "", `${base}?chat=${saved.id}`)
      }
    })
  }

  const remove = async (id: number) => {
    if (!confirm("Delete this chat?")) return
    const r = await deleteChat(slug, id)
    if (r.error) return setError(r.error)
    setChats((list) => list.filter((c) => c.id !== id))
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
            <button type="button" onClick={() => remove(c.id)} aria-label={`Delete "${c.title}"`} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[#a39d92] opacity-100 transition hover:text-red-700 lg:opacity-0 lg:group-hover:opacity-100">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center pt-6 text-center sm:pt-12">
              <span className="flex h-14 w-14 items-center justify-center bg-[var(--accent)] text-white">
                <Sparkles className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Hi {firstName}, what do you want to know?</h2>
              <p className="mt-2 max-w-md text-[15px] text-[#5a554d]">
                Ask about projects, units and prices, payment plans, {isAgent ? "your offers and your buyers" : "offers, buyers and agents"}. {name} looks it up in your dashboard as you ask.
              </p>
              <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
                {(isAgent ? AGENT_IDEAS : STAFF_IDEAS).map((idea) => (
                  <button key={idea} type="button" onClick={() => ask(idea)} className="border border-[#e0dcd5] bg-[#faf8f5] px-4 py-3 text-left text-sm font-semibold text-[#3d3a34] transition hover:border-[var(--accent)] hover:bg-white hover:text-[#17150f]">
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((m) => (m.role === "user" ? <Question key={m.id} text={m.content} /> : <Answer key={m.id} text={m.content} />))}
              {pending && (
                <div className="flex gap-3">
                  <Avatar />
                  <p className="flex items-center gap-2 pt-1.5 text-sm font-semibold text-[#6b665d]">
                    Looking it up
                    <span className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="h-1.5 w-1.5 animate-bounce bg-[var(--accent)]" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
          <div ref={bottom} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(text)
          }}
          className="border-t border-[#e6e2db] p-3 sm:p-4"
        >
          {error && <p className="mb-2 text-sm font-bold text-red-700">{error}</p>}
          <div className="flex items-end gap-2 border border-[#d9d4cb] bg-white p-1.5 focus-within:border-[var(--accent)]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  ask(text)
                }
              }}
              rows={Math.min(6, Math.max(1, text.split("\n").length))}
              maxLength={2000}
              placeholder={`Ask ${name}…`}
              aria-label={`Ask ${name}`}
              className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2.5 py-2.5 text-[15px] outline-none"
            />
            <button type="submit" disabled={pending || !text.trim()} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--accent)] text-white transition hover:brightness-110 disabled:opacity-40">
              <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-[#8a847a]">{name} reads your dashboard and can&apos;t change anything. Check prices before you send them to a buyer.</p>
        </form>
      </section>
    </div>
  )
}

function Avatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--accent)] text-white">
      <Sparkles className="h-4 w-4" />
    </span>
  )
}

function Question({ text }: { text: string }) {
  return <p className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap bg-[#17150f] px-4 py-2.5 text-[15px] text-white">{text}</p>
}

function Answer({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex gap-3">
      <Avatar />
      <div className="min-w-0 flex-1">
        <Markdown text={text} />
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(text).catch(() => {})
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a847a] transition hover:text-[#17150f]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}
