"use client"

import { useState, useTransition } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "@/components/feedback"
import { extendOffer } from "./actions"
import { DEFAULT_VALIDITY, VALIDITY } from "./validity"

/** Open an offer again (or longer): valid for the chosen time from now, on the same link. */
export function ExtendOffer({ slug, id, expired }: { slug: string; id: number; expired: boolean }) {
  const [hours, setHours] = useState<number>(DEFAULT_VALIDITY)
  const [pending, start] = useTransition()

  return (
    <span className="inline-flex items-center gap-1.5">
      <select value={hours} onChange={(e) => setHours(Number(e.target.value))} disabled={pending} aria-label="Open the offer for" className="border border-[#d9d4cb] bg-white px-2 py-1.5 text-xs font-semibold text-[#17150f]">
        {VALIDITY.map((v) => (
          <option key={v.hours} value={v.hours}>
            {v.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await extendOffer(slug, id, hours)
            if (r.error) toast(r.error, "error")
            else toast("Offer open again. The same link works.")
          })
        }
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold disabled:opacity-60 ${expired ? "bg-[var(--accent)] text-white hover:brightness-110" : "border border-[#d9d4cb] bg-white text-[#17150f] hover:border-[#17150f]"}`}
      >
        {pending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
        {expired ? "Reopen" : "Extend"}
      </button>
    </span>
  )
}
