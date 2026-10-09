"use client"

import { useTransition } from "react"
import { LoaderCircle, Trash2 } from "lucide-react"
import { confirmAction, toast } from "@/components/feedback"

/**
 * One Delete button for every list. It asks first, runs the (bound) server action and says how it went.
 * The action revalidates the dashboard, so the row disappears on its own.
 */
export function DeleteButton({
  action,
  title,
  body,
  success,
  label = "Delete",
  className = "px-2 py-1.5 text-xs font-semibold text-[#8a847a] hover:text-red-700",
}: {
  action: () => Promise<{ error?: string }>
  title: string
  body: string
  success: string
  label?: string
  className?: string
}) {
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 disabled:opacity-60 ${className}`}
      onClick={async () => {
        const ok = await confirmAction({ title, body, confirm: label, danger: true })
        if (!ok) return
        start(async () => {
          const r = await action()
          if (r.error) toast(r.error, "error")
          else toast(success)
        })
      }}
    >
      {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}
