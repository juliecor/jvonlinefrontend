"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Maximize2, Plus, Sparkles, X } from "lucide-react"
import { AskBox, Thread } from "./messages"
import { useAssistant } from "./use-assistant"

/** What the panel offers to ask, by the page it's opened on. */
function aboutPage(path: string, slug: string, isAgent: boolean): { label: string; ideas: string[] } {
  const rest = path.slice(`/${slug}/dashboard`.length)
  if (/^\/projects\/\d+/.test(rest)) return { label: "this project", ideas: ["What's still available in this project?", "Show the cheapest units here", "Explain this project's payment plans in pesos"] }
  if (/^\/offers\/\d+/.test(rest)) return { label: "this offer", ideas: ["What is this buyer still missing?", "Write a Viber follow-up for this buyer", "Show this buyer's payment schedule"] }
  if (rest.startsWith("/offers")) return { label: "your offers", ideas: ["Which buyers opened their offer but never answered?", "Which offers are still missing documents?", "What did buyers say this week?"] }
  if (rest.startsWith("/projects")) return { label: "your projects", ideas: ["Which projects have the most available units?", "Compare the payment plans of our projects", "Show the 4 cheapest available units"] }
  if (rest.startsWith("/agents") && !isAgent) return { label: "your team", ideas: ["Which agents have the most active offers?", "Who applied and is waiting for approval?"] }
  return { label: "", ideas: ["What needs my attention today?", "Show the 4 cheapest available units", "Which offers are still missing documents?"] }
}

/**
 * "Ask Johndorf AI" on every dashboard page but the AI page itself: a button
 * in the corner that opens the assistant on the side (full screen on phones).
 * It knows the page it's asked from, so "this project" or "this buyer" works.
 * Closing keeps the conversation; it's saved like any chat.
 */
export function AskPanel({ slug, name, isAgent }: { slug: string; name: string; isAgent: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  // Each new conversation is a fresh panel.
  const [round, setRound] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("dialog[open]") && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  if (pathname.startsWith(`/${slug}/dashboard/ai`)) return null

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setStarted(true)
            setOpen(true)
          }}
          className="fixed bottom-4 right-4 z-40 flex h-12 items-center gap-2 bg-[var(--accent)] px-4 text-sm font-bold text-white shadow-[0_12px_32px_-10px_rgba(0,0,0,0.45)] transition hover:brightness-110 sm:bottom-6 sm:right-6"
        >
          <Sparkles className="h-5 w-5" />
          <span className="sm:hidden">Ask AI</span>
          <span className="hidden sm:inline">Ask {name}</span>
        </button>
      )}
      {started && <Panel key={round} slug={slug} name={name} isAgent={isAgent} page={pathname} hidden={!open} onClose={() => setOpen(false)} onNew={() => setRound((r) => r + 1)} />}
    </>
  )
}

function Panel({ slug, name, isAgent, page, hidden, onClose, onNew }: { slug: string; name: string; isAgent: boolean; page: string; hidden: boolean; onClose: () => void; onNew: () => void }) {
  const scroller = useRef<HTMLDivElement>(null)
  const { chat, messages, pending, status, error, streaming, cards, ask: send } = useAssistant({ slug, chatId: null, initial: [] })
  const { label, ideas } = aboutPage(page, slug, isAgent)

  useEffect(() => {
    const el = scroller.current
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight
  }, [messages.length, pending, streaming, cards])

  const ask = (question: string) => {
    requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight }))
    return send(question, page)
  }

  return (
    <section aria-label={`Ask ${name}`} className={`fixed inset-0 z-50 flex-col bg-white sm:left-auto sm:w-[440px] sm:border-l sm:border-[#e0dcd5] sm:shadow-[-24px_0_48px_-24px_rgba(0,0,0,0.3)] ${hidden ? "hidden" : "flex"}`}>
      <header className="flex items-center gap-3 border-b border-[#e6e2db] px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--accent)] text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-tight tracking-tight">{name}</p>
          <p className="truncate text-xs text-[#6b665d]">{label ? `Knows you're on ${label}` : "Answers from your dashboard's live data"}</p>
        </div>
        {chat && (
          <Link href={`/${slug}/dashboard/ai?chat=${chat}`} onClick={onClose} title="Open in the full chat" aria-label="Open in the full chat" className="p-2 text-[#6b665d] transition hover:text-[#17150f]">
            <Maximize2 className="h-4 w-4" />
          </Link>
        )}
        {messages.length > 0 && (
          <button type="button" onClick={onNew} disabled={pending} title="New chat" aria-label="New chat" className="p-2 text-[#6b665d] transition hover:text-[#17150f] disabled:opacity-40">
            <Plus className="h-5 w-5" />
          </button>
        )}
        <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-[#6b665d] transition hover:text-[#17150f]">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <div>
            <p className="text-lg font-bold tracking-tight">Ask about {label || "anything in your dashboard"}</p>
            <p className="mt-1 text-sm text-[#5a554d]">Type or tap the mic. {name} looks it up as you ask.</p>
            <div className="mt-4 grid gap-2">
              {ideas.map((idea) => (
                <button key={idea} type="button" onClick={() => ask(idea)} className="border border-[#e0dcd5] bg-[#faf8f5] px-4 py-3 text-left text-sm font-semibold text-[#3d3a34] transition hover:border-[var(--accent)] hover:bg-white hover:text-[#17150f]">
                  {idea}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Thread slug={slug} messages={messages} pending={pending} status={status} streaming={streaming} cards={cards} onAsk={ask} />
        )}
      </div>

      <AskBox slug={slug} name={name} pending={pending} error={error} onSend={ask} />
    </section>
  )
}
