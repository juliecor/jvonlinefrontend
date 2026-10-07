"use client"

import { useState, useTransition } from "react"
import { Check, LoaderCircle, Trash2, X } from "lucide-react"
import { reviewApplication } from "./actions"

type Decision = "approve" | "reject" | "delete"

/** Approve / Reject for a pending application; Approve / Delete for a rejected one. Reject and Delete ask once more inline. */
export function ApplicationActions({ slug, id, name, status }: { slug: string; id: number; name: string; status: "pending" | "rejected" }) {
  const [pending, start] = useTransition()
  const [confirming, setConfirming] = useState<Decision | null>(null)
  const [error, setError] = useState<string>()
  const act = (decision: Decision) =>
    start(async () => {
      const r = await reviewApplication(slug, id, decision)
      setError(r.error)
      if (!r.error) setConfirming(null)
    })

  const first = name.split(" ")[0]

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#3d3a34]">
            {confirming === "reject" ? `Reject ${first}? They won't be able to sign in.` : `Delete ${first}'s application?`}
          </span>
          <button type="button" disabled={pending} onClick={() => act(confirming)} className="inline-flex items-center gap-1.5 bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-60">
            {pending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />} {confirming === "reject" ? "Reject" : "Delete"}
          </button>
          <button type="button" disabled={pending} onClick={() => setConfirming(null)} className="inline-flex items-center gap-1 px-2 py-2 text-xs font-semibold text-[#8a847a] hover:text-[#17150f]">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => act("approve")} className="inline-flex items-center gap-1.5 bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
            {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />} Approve
          </button>
          {status === "pending" ? (
            <button type="button" disabled={pending} onClick={() => setConfirming("reject")} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold text-[#17150f] hover:border-red-400 hover:text-red-700">
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          ) : (
            <button type="button" disabled={pending} onClick={() => setConfirming("delete")} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-bold text-[#17150f] hover:border-red-400 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
    </div>
  )
}
