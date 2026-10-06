import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react"
import { Tag } from "@/components/dashboard-ui"

/**
 * A buyer's answer to a sales offer, as the realty dashboard shows it: the
 * kind as a tag, and one-tap ways to get back to them.
 */

export type LeadKind = "interested" | "question" | "not_interested"

export type Lead = {
  id: number
  kind: LeadKind
  label: string
  name: string
  phone: string | null
  email: string | null
  contact_via: "call" | "viber" | "whatsapp" | "sms" | "email" | null
  message: string | null
  new: boolean
  created_at: string
}

const TONE = { interested: "good", question: "warn", not_interested: "neutral" } as const

export function LeadTag({ kind, label }: { kind: LeadKind; label: string }) {
  return <Tag tone={TONE[kind] ?? "neutral"}>{label}</Tag>
}

export function NewTag() {
  return <span className="bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">New</span>
}

export const VIA_LABEL = { call: "a call", viber: "Viber", whatsapp: "WhatsApp", sms: "a text", email: "email" } as const

/** 0917 123 4567 / +63 917… / 917… → 639171234567, for Viber and WhatsApp links. */
function intl(phone: string) {
  const d = phone.replace(/\D/g, "")
  if (d.startsWith("63")) return d
  if (d.startsWith("0")) return `63${d.slice(1)}`
  if (d.length === 10 && d.startsWith("9")) return `63${d}`
  return d
}

const link = "inline-flex items-center gap-2 border px-3.5 py-2.5 text-sm font-bold transition"

/** Call / Viber / WhatsApp / Text / Email — the buyer's preferred way first and filled in. */
export function ContactButtons({ phone, email, via, limit }: { phone: string | null; email: string | null; via: Lead["contact_via"]; limit?: number }) {
  const n = phone ? intl(phone) : ""
  const all = [
    phone && { key: "call", label: "Call", href: `tel:+${n}`, icon: Phone },
    phone && { key: "viber", label: "Viber", href: `viber://chat?number=%2B${n}`, icon: MessageCircle },
    phone && { key: "whatsapp", label: "WhatsApp", href: `https://wa.me/${n}`, icon: MessageCircle },
    phone && { key: "sms", label: "Text", href: `sms:+${n}`, icon: MessageSquare },
    email && { key: "email", label: "Email", href: `mailto:${email}`, icon: Mail },
  ].filter((x): x is { key: string; label: string; href: string; icon: typeof Phone } => Boolean(x))
  const sorted = [...all.filter((x) => x.key === via), ...all.filter((x) => x.key !== via)].slice(0, limit)
  if (!sorted.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map(({ key, label, href, icon: Icon }) => (
        <a
          key={key}
          href={href}
          target={key === "whatsapp" ? "_blank" : undefined}
          rel={key === "whatsapp" ? "noreferrer" : undefined}
          className={`${link} ${key === via ? "border-[var(--accent)] bg-[var(--accent)] text-white hover:brightness-110" : "border-[#d9d4cb] bg-white text-[#17150f] hover:border-[#17150f]"}`}
        >
          <Icon className="h-4 w-4" /> {label}
        </a>
      ))}
    </div>
  )
}
