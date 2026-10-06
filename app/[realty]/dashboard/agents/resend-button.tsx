"use client"

import { useActionState } from "react"
import { Link2, LoaderCircle } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { btn } from "@/components/dashboard-ui"
import { type NewLinkState, newAgentLink } from "./actions"

/** "New link" on a pending invite: shows the fresh link right there with a copy button. */
export function NewLinkButton({ slug, id }: { slug: string; id: number }) {
  const [state, action, pending] = useActionState<NewLinkState, FormData>(newAgentLink.bind(null, slug), {})
  if (state.url) {
    return (
      <div className="flex max-w-full flex-col items-start gap-1.5 sm:items-end">
        <p className="max-w-[320px] truncate font-mono text-xs text-[#6b665d]" title={state.url}>{state.url}</p>
        <CopyButton text={state.url} />
      </div>
    )
  }
  return (
    <form action={action} className="flex flex-col items-start gap-1 sm:items-end">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className={btn.ghost}>
        {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
        New link
      </button>
      {state.error && <span className="text-xs text-red-700">{state.error}</span>}
    </form>
  )
}
