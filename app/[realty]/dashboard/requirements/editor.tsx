"use client"

import { useActionState, useState, useTransition } from "react"
import { ArrowDown, ArrowUp, Eye, EyeOff, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react"
import { Panel, btn, field } from "@/components/dashboard-ui"
import { type ReqTypeState, deleteRequirement, moveRequirement, saveRequirement, setRequirementActive } from "./actions"

export type ReqType = { id: number; name: string; help: string | null; applies: string; sort: number; active: boolean; documents_count: number }

const label = "text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]"

export function RequirementsEditor({ slug, types, applies }: { slug: string; types: ReqType[]; applies: Record<string, string> }) {
  const [adding, setAdding] = useState(types.length === 0)
  return (
    <>
      <Panel
        title={`Checklist · ${types.filter((t) => t.active).length} shown to buyers`}
        aside={
          !adding && (
            <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white hover:brightness-110">
              <Plus className="h-3.5 w-3.5" /> Add requirement
            </button>
          )
        }
      >
        {adding && (
          <div className="border-b border-[#e6e2db] bg-white p-5">
            <p className="mb-4 text-lg font-bold">New requirement</p>
            <ItemForm slug={slug} applies={applies} onDone={() => setAdding(false)} />
          </div>
        )}
        <ol className="divide-y divide-[#e6e2db]">
          {types.map((t, i) => (
            <Item key={t.id} slug={slug} item={t} applies={applies} first={i === 0} last={i === types.length - 1} />
          ))}
          {types.length === 0 && !adding && <li className="py-10 text-center text-sm text-[#8a847a]">No requirements yet. Buyers won&apos;t see a requirements section until you add one.</li>}
        </ol>
      </Panel>
    </>
  )
}

function Item({ slug, item, applies, first, last }: { slug: string; item: ReqType; applies: Record<string, string>; first: boolean; last: boolean }) {
  const [editing, setEditing] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const icon = "flex h-9 w-9 items-center justify-center text-[#6b665d] transition hover:bg-[#f1eee9] hover:text-[#17150f] disabled:opacity-30"

  return (
    <li className={`py-5 ${item.active ? "" : "opacity-60"}`}>
      {editing ? (
        <ItemForm slug={slug} applies={applies} item={item} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold">{item.name}</p>
              <span className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${item.applies === "all" ? "border-[var(--accent)] text-[var(--accent)]" : "border-[#d9d4cb] text-[#5a554d]"}`}>
                {applies[item.applies] ?? item.applies}
              </span>
              {!item.active && <span className="border border-[#d9d4cb] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a847a]">Hidden</span>}
            </div>
            {item.help && <p className="mt-1 max-w-2xl text-sm text-[#5a554d]">{item.help}</p>}
            <p className="mt-1 text-xs text-[#8a847a]">{item.documents_count ? `${item.documents_count} file${item.documents_count === 1 ? "" : "s"} received` : "No files yet"}</p>
            {error && <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {pending && <LoaderCircle className="mr-1 h-4 w-4 animate-spin text-[#8a847a]" />}
            <button type="button" aria-label="Move up" disabled={first || pending} onClick={() => start(() => moveRequirement(slug, item.id, "up"))} className={icon}>
              <ArrowUp className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Move down" disabled={last || pending} onClick={() => start(() => moveRequirement(slug, item.id, "down"))} className={icon}>
              <ArrowDown className="h-4 w-4" />
            </button>
            <button type="button" aria-label={item.active ? "Hide from buyers" : "Show to buyers"} title={item.active ? "Hide from buyers" : "Show to buyers"} disabled={pending} onClick={() => start(() => setRequirementActive(slug, item, !item.active))} className={icon}>
              {item.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button type="button" aria-label="Edit" onClick={() => setEditing(true)} className={icon}>
              <Pencil className="h-4 w-4" />
            </button>
            {item.documents_count === 0 && (
              <button
                type="button"
                aria-label="Delete"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Delete "${item.name}"?`)) return
                  setError(null)
                  start(async () => {
                    const r = await deleteRequirement(slug, item.id)
                    if (r.error) setError(r.error)
                  })
                }}
                className={`${icon} hover:!text-red-700`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

function ItemForm({ slug, applies, item, onDone }: { slug: string; applies: Record<string, string>; item?: ReqType; onDone: () => void }) {
  const [state, action, pending] = useActionState<ReqTypeState, FormData>(async (prev, fd) => {
    const r = await saveRequirement(slug, item?.id ?? null, prev, fd)
    if (r.ok) onDone()
    return r
  }, {})
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={label}>Name</span>
        <input name="name" required maxLength={150} defaultValue={item?.name} placeholder="e.g. Proof of billing" className={field} />
      </label>
      <label className="block">
        <span className={label}>Who has to send it</span>
        <select name="applies" defaultValue={item?.applies ?? "all"} className={field}>
          {Object.entries(applies).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Instructions for the buyer (optional)</span>
        <textarea name="help" rows={2} maxLength={1000} defaultValue={item?.help ?? ""} placeholder="e.g. A utility bill from the last 3 months showing your current address." className={field} />
      </label>
      {item && <input type="hidden" name="active" value={item.active ? "on" : "off"} />}
      {state.error && <p className="text-sm font-semibold text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} {item ? "Save" : "Add requirement"}
        </button>
        <button type="button" onClick={onDone} className={btn.ghost}>
          Cancel
        </button>
      </div>
    </form>
  )
}
