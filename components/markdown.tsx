import Link from "next/link"
import { MessageDraft } from "./message-draft"

/**
 * The small part of Markdown the AI assistant writes: headings, paragraphs,
 * bullet and numbered lists (one level of nesting), tables, bold, code and
 * links, and ```message blocks (a message for a buyer, with Copy). Everything
 * is built as React elements, never as raw HTML, so nothing in an answer can
 * run. No italics: the dashboard doesn't use them.
 */

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; start: number; items: { text: string; children: string[] }[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "rule" }
  | { kind: "message"; text: string; open: boolean; to: string }
  | { kind: "code"; text: string }

/** Fenced blocks that hold a message for the buyer, by the word after the ``` (then the buyer's name: ```message Juliecor Repompo). */
const MESSAGE = new Set(["message", "viber", "sms", "text", "email", "messenger", "whatsapp"])
const FENCE = /^\s*```\s*([\w-]*)[ \t]*([^`]*?)\s*$/

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim())

function parse(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n")
  // The first backticks of a ``` still on their way.
  if (/^\s*`{1,2}\s*$/.test(lines[lines.length - 1])) lines.pop()
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    const fence = line.match(FENCE)
    if (fence) {
      const lang = fence[1].toLowerCase()
      const body: string[] = []
      i++
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) body.push(lines[i++])
      // No closing ``` yet: the answer is still streaming in (drop a half-written one).
      const open = i >= lines.length
      if (open && /^\s*`{1,2}\s*$/.test(body[body.length - 1] ?? "")) body.pop()
      i++
      const text = body.join("\n").replace(/^\n+|\s+$/g, "")
      // While streaming, "```mess" (or a bare ``` with nothing under it yet) is a message on its way.
      const message = MESSAGE.has(lang) || (open && "message".startsWith(lang) && (lang !== "" || body.length === 0))
      blocks.push(message ? { kind: "message", text, open, to: fence[2] } : { kind: "code", text })
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] })
      i++
      continue
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push({ kind: "rule" })
      i++
      continue
    }
    // A table: a header row, a |---| row, then body rows.
    if (line.trim().startsWith("|") && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? "")) {
      const head = cells(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(cells(lines[i++]))
      blocks.push({ kind: "table", head, rows })
      continue
    }
    const bullet = /^(\s*)([-*•]|\d+[.)])\s+(.*)$/
    if (bullet.test(line)) {
      const ordered = /^\s*\d+[.)]/.test(line)
      const start = ordered ? Number(line.match(/\d+/)?.[0] ?? 1) : 1
      const items: { text: string; children: string[] }[] = []
      // A blank line between items doesn't end the list when the next line carries on with it.
      const continues = (next: string) => bullet.test(next) && (/^\s+/.test(next) || /^\s*\d+[.)]/.test(next) === ordered)
      while (i < lines.length && (bullet.test(lines[i]) || (lines[i].trim() === "" && continues(lines[i + 1] ?? "")))) {
        const m = lines[i].match(bullet)
        if (m) {
          if (m[1].length >= 2 && items.length) items[items.length - 1].children.push(m[3])
          else items.push({ text: m[3], children: [] })
        }
        i++
      }
      blocks.push({ kind: "list", ordered, start, items })
      continue
    }
    // A paragraph always takes this line (so a lone "| …" row, half a table while an answer
    // streams in, can't stall the loop), then the lines after it until something else starts.
    const para: string[] = [lines[i++].trim()]
    while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s/.test(lines[i]) && !bullet.test(lines[i]) && !lines[i].trim().startsWith("|") && !FENCE.test(lines[i])) para.push(lines[i++].trim())
    blocks.push({ kind: "paragraph", text: para.join(" ") })
  }
  return blocks
}

/**
 * An answer without its ```followups block (the next questions the AI
 * suggests, shown as buttons instead), and those questions. While the answer
 * streams in, a ``` that may be the start of that block is held back too.
 */
export function splitFollowUps(text: string): { body: string; followUps: string[] } {
  const block = text.match(/(^|\n)[ \t]*```[ \t]*follow-?ups\b[^\n]*(?:\n([\s\S]*?))?(?:\n[ \t]*```[ \t]*(?=\n|$)|$)/i)
  if (block?.index !== undefined) {
    const body = (text.slice(0, block.index) + text.slice(block.index + block[0].length)).trimEnd()
    const followUps = (block[2] ?? "")
      .split("\n")
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
      .filter((l) => l && !l.startsWith("```"))
      .slice(0, 3)
    return { body, followUps }
  }
  const lines = text.split("\n")
  const partial = lines[lines.length - 1].match(/^[ \t]*```[ \t]*([a-z-]*)$/i)?.[1].toLowerCase()
  if (partial !== undefined && ("followups".startsWith(partial) || "follow-ups".startsWith(partial))) return { body: lines.slice(0, -1).join("\n").trimEnd(), followUps: [] }
  return { body: text, followUps: [] }
}

/** **bold**, `code` and [links](/path or https://…); a lone *word* is shown plain. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i} className="font-bold text-[#17150f]">{p.slice(2, -2)}</strong>
        if (p.startsWith("`") && p.endsWith("`") && p.length > 2) return <code key={i} className="bg-[#f1eee9] px-1 py-0.5 font-mono text-[0.9em]">{p.slice(1, -1)}</code>
        const link = p.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
        if (link) {
          const [, label, href] = link
          if (href.startsWith("/")) return <Link key={i} href={href} className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline">{label}</Link>
          if (/^https:\/\//.test(href)) return <a key={i} href={href} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline">{label}</a>
          return <span key={i}>{label}</span>
        }
        return <span key={i}>{p.replace(/(^|\s)\*([^*\s][^*]*)\*(?=\s|$|[.,!?])/g, "$1$2")}</span>
      })}
    </>
  )
}

/** streaming: the answer is still coming in, so a message block without its closing ``` is still being written. */
export function Markdown({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-[#2a2722]">
      {parse(text).map((b, i) => {
        switch (b.kind) {
          case "heading":
            return (
              <p key={i} className={`pt-1 font-bold tracking-tight text-[#17150f] ${b.level <= 2 ? "text-lg" : "text-base"}`}>
                <Inline text={b.text} />
              </p>
            )
          case "rule":
            return <hr key={i} className="border-[#e6e2db]" />
          case "message":
            return <MessageDraft key={i} text={b.text} to={b.to} writing={b.open && streaming} />
          case "code":
            return (
              <pre key={i} className="overflow-x-auto whitespace-pre-wrap bg-[#f6f4f0] p-3 font-mono text-sm [overflow-wrap:anywhere]">
                {b.text}
              </pre>
            )
          case "table":
            return (
              <div key={i} className="overflow-x-auto border border-[#e0dcd5]">
                <table className="w-full text-sm">
                  <thead className="bg-[#f6f4f0]">
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j} className="whitespace-nowrap px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.08em] text-[#5a554d]">
                          <Inline text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebe7e1] bg-white">
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k} className={`px-3 py-2 align-top ${/^[₱\d,.\s%×-]+$/.test(c) ? "whitespace-nowrap tabular-nums" : ""}`}>
                            <Inline text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case "list": {
            const Tag = b.ordered ? "ol" : "ul"
            return (
              <Tag key={i} start={b.ordered && b.start !== 1 ? b.start : undefined} className={`space-y-1.5 pl-5 ${b.ordered ? "list-decimal" : "list-disc"} marker:text-[var(--accent)]`}>
                {b.items.map((it, j) => (
                  <li key={j} className="pl-1">
                    <Inline text={it.text} />
                    {it.children.length > 0 && (
                      <ul className="mt-1 list-[circle] space-y-1 pl-5 marker:text-[#a39d92]">
                        {it.children.map((c, k) => (
                          <li key={k} className="pl-1">
                            <Inline text={c} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </Tag>
            )
          }
          default:
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            )
        }
      })}
    </div>
  )
}
