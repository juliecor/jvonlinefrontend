"use client"

import { useState, useTransition } from "react"
import { Check, LoaderCircle, RotateCw } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { resendInvite } from "./actions"

/** A fresh link for an invite that was never filled in: it is emailed again, and can be copied. */
export function ResendInviteButton({ slug, id }: { slug: string; id: number }) {
  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ error?: string; url?: string; emailed?: boolean }>({})

  const resend = () =>
    start(async () => {
      const r = await resendInvite(slug, id)
      setResult({ error: r.error, url: r.sent?.accreditation_url, emailed: r.sent?.emailed })
    })

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button type="button" onClick={resend} disabled={pending} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold text-[#17150f] hover:border-[#17150f] disabled:opacity-60">
        {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />} Send a new link
      </button>
      {result.url && (
        <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#3d3a34]">
          {result.emailed ? (
            <span className="inline-flex items-center gap-1 text-emerald-800">
              <Check className="h-3.5 w-3.5" strokeWidth={3} /> Emailed
            </span>
          ) : (
            <span className="text-amber-800">Couldn&apos;t email it, so copy the link</span>
          )}
          <CopyButton text={result.url} className="bg-white" />
        </p>
      )}
      {result.error && <p className="text-xs font-semibold text-red-700">{result.error}</p>}
    </div>
  )
}
