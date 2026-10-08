"use client"

import { useRef, useState } from "react"
import { ArrowUp, Check, Copy, CornerDownRight, Sparkles } from "lucide-react"
import { Markdown, splitFollowUps } from "@/components/markdown"
import type { ChatMessage, UnitCard } from "./actions"
import { UnitCards } from "./unit-cards"
import { VoiceButton } from "./voice-button"

/**
 * A conversation as the AI page and the Ask panel show it: questions, answers
 * (with unit cards), the answer still streaming in, and under the latest
 * answer the next questions the AI suggests, as buttons.
 */
export function Thread({ slug, messages, pending, status, streaming, cards, onAsk }: { slug: string; messages: ChatMessage[]; pending: boolean; status: string; streaming: string | null; cards: UnitCard[]; onAsk: (question: string) => void }) {
  return (
    <div className="space-y-6">
      {messages.map((m, i) =>
        m.role === "user" ? <Question key={m.id} text={m.content} /> : <Answer key={m.id} slug={slug} text={m.content} cards={m.cards} onAsk={!pending && i === messages.length - 1 ? onAsk : undefined} />,
      )}
      {pending && (streaming || cards.length > 0) ? (
        <Answer slug={slug} text={streaming ?? ""} cards={cards} streaming status={status} />
      ) : pending ? (
        <div className="flex gap-3">
          <Avatar />
          <Working status={status} />
        </div>
      ) : null}
    </div>
  )
}

/**
 * The question box: Enter sends, Shift+Enter is a new line, the mic fills it
 * by voice. onSend resolves false when the question didn't go through, and
 * the question comes back into the box to send again.
 */
export function AskBox({ slug, name, pending, error, hint, onSend }: { slug: string; name: string; pending: boolean; error: string; hint?: string; onSend: (question: string) => Promise<boolean> }) {
  const [text, setText] = useState("")
  const [recording, setRecording] = useState(false)
  const box = useRef<HTMLTextAreaElement>(null)
  const send = async () => {
    const q = text.trim()
    if (!q || pending) return
    setText("")
    if (!(await onSend(q))) setText(q)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void send()
      }}
      className="border-t border-[#e6e2db] p-3 sm:p-4"
    >
      {error && <p className="mb-2 text-sm font-bold text-red-700">{error}</p>}
      <div className="flex items-end gap-2 border border-[#d9d4cb] bg-white p-1.5 focus-within:border-[var(--accent)]">
        <textarea
          ref={box}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              void send()
            }
          }}
          rows={Math.min(6, Math.max(1, text.split("\n").length))}
          maxLength={2000}
          placeholder={recording ? "Listening… tap stop when you're done" : `Ask ${name}…`}
          aria-label={`Ask ${name}`}
          className="max-h-40 min-h-[44px] min-w-0 flex-1 resize-none bg-transparent px-2.5 py-2.5 text-[15px] outline-none"
        />
        <VoiceButton
          slug={slug}
          disabled={pending}
          onRecording={setRecording}
          onText={(said) => {
            setText((t) => (t.trim() ? `${t.trim()} ${said}` : said))
            box.current?.focus()
          }}
        />
        <button type="submit" disabled={pending || !text.trim()} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--accent)] text-white transition hover:brightness-110 disabled:opacity-40">
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
      {hint && <p className="mt-2 text-center text-xs text-[#8a847a]">{hint}</p>}
    </form>
  )
}

export function Avatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--accent)] text-white">
      <Sparkles className="h-4 w-4" />
    </span>
  )
}

function Question({ text }: { text: string }) {
  return <p className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap bg-[#17150f] px-4 py-2.5 text-[15px] text-white">{text}</p>
}

/** What the assistant is doing while there's no text yet, e.g. "Searching the units". */
function Working({ status }: { status: string }) {
  return (
    <p className="flex items-center gap-2 pt-1.5 text-sm font-semibold text-[#6b665d]">
      {status}
      <span className="flex gap-1">
        {[0, 150, 300].map((d) => (
          <span key={d} className="h-1.5 w-1.5 animate-bounce bg-[var(--accent)]" style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
    </p>
  )
}

function Answer({ slug, text, cards = [], streaming = false, status = "", onAsk }: { slug: string; text: string; cards?: UnitCard[]; streaming?: boolean; status?: string; onAsk?: (question: string) => void }) {
  const [copied, setCopied] = useState(false)
  const { body, followUps } = splitFollowUps(text)

  return (
    <div className="flex gap-3">
      <Avatar />
      <div className="min-w-0 flex-1">
        {body ? <Markdown text={body} streaming={streaming} /> : streaming && <Working status={status} />}
        {streaming && body && <span aria-hidden className="mt-1 inline-block h-4 w-2 animate-pulse bg-[var(--accent)]" />}
        {cards.length > 0 && <UnitCards slug={slug} cards={cards} />}
        {!streaming && (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(body).catch(() => {})
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a847a] transition hover:text-[#17150f]"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
          </button>
        )}
        {onAsk && followUps.length > 0 && (
          <div className="mt-3 flex flex-col items-start gap-1.5">
            {followUps.map((q) => (
              <button key={q} type="button" onClick={() => onAsk(q)} className="inline-flex max-w-full items-start gap-2 border border-[#e0dcd5] bg-white px-3 py-2 text-left text-sm font-semibold text-[#3d3a34] transition hover:border-[var(--accent)] hover:text-[#17150f]">
                <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
