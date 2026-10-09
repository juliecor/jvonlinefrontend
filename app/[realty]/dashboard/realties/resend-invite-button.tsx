"use client"

import { useState, useTransition } from "react"
import { Check, Link2, LoaderCircle, Send } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { toast } from "@/components/feedback"
import { resendInvite } from "./actions"

const button = "inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold text-[#17150f] hover:border-[#17150f] disabled:opacity-60"

/**
 * An invite that was never filled in: email it again, or just get the link to send on Messenger or Viber.
 * Either way the link is a new one; the earlier one stops working, because links are only stored hashed.
 */
export function ResendInviteButton({ slug, id, email }: { slug: string; id: number; email: string }) {
  const [pending, start] = useTransition()
  const [busy, setBusy] = useState<"send" | "copy" | null>(null)
  // The new link, shown with a Copy button when the browser wouldn't copy it by itself or the email didn't go out.
  const [shown, setShown] = useState<string | null>(null)

  const run = (mode: "send" | "copy") =>
    start(async () => {
      setBusy(mode)
      setShown(null)
      const r = await resendInvite(slug, id, mode === "send")
      setBusy(null)
      if (r.error || !r.sent) return toast(r.error ?? "Couldn't make the link.", "error")
      const url = r.sent.accreditation_url
      if (mode === "send") {
        if (r.sent.emailed) toast(`Invitation emailed to ${email}`)
        else {
          toast("Couldn't email it, so copy the link and send it yourself.", "error")
          setShown(url)
        }
        return
      }
      try {
        await navigator.clipboard.writeText(url)
        toast("Link copied. It replaces the earlier link.")
      } catch {
        setShown(url)
      }
    })

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => run("send")} disabled={pending} className={button}>
          {busy === "send" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Resend invitation
        </button>
        <button type="button" onClick={() => run("copy")} disabled={pending} className={button}>
          {busy === "copy" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />} Copy link
        </button>
      </div>
      {shown && (
        <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#3d3a34]">
          <span className="inline-flex items-center gap-1 text-emerald-800">
            <Check className="h-3.5 w-3.5" strokeWidth={3} /> New link ready
          </span>
          <CopyButton text={shown} className="bg-white" />
        </p>
      )}
    </div>
  )
}
