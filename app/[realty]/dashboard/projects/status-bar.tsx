"use client"

import { useState, useTransition } from "react"
import { Check, LoaderCircle } from "lucide-react"
import { Tag } from "@/components/dashboard-ui"
import { type StatusPatch, setProjectStatus } from "./page-actions"
import { STAGES } from "./types"

type Value = { status: "active" | "archived"; stage: string | null; is_public: boolean }
type Props = { slug: string; projectId: number; value: Value; pageSlug: string | null; staff: boolean }

/** The project's status at the top of its page: staff change it with one click (it saves right away); agents read it. */
export function StatusBar({ slug, projectId, value: initial, pageSlug, staff }: Props) {
  const [value, setValue] = useState(initial)
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({})
  const [pending, start] = useTransition()

  if (!staff) {
    return (
      <div className="mt-6 flex flex-wrap gap-2">
        <Tag tone={value.status === "active" ? "good" : "neutral"}>{value.status === "active" ? "Open for offers" : "Archived"}</Tag>
        {value.stage && <Tag tone="accent">{value.stage}</Tag>}
        {!value.is_public && <Tag tone="warn">Not on the website</Tag>}
      </div>
    )
  }

  const save = (patch: StatusPatch) => {
    const before = value
    setValue({ ...value, ...patch })
    setMsg({})
    start(async () => {
      const r = await setProjectStatus(slug, projectId, patch)
      if (r.error) setValue(before)
      setMsg(r)
    })
  }
  // A stage typed in before the list existed stays selectable.
  const stages = value.stage && !STAGES.includes(value.stage) ? [...STAGES, value.stage] : STAGES

  return (
    <section id="status" className="mt-8 scroll-mt-6 border border-[#e0dcd5] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#e6e2db] px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#17150f]">Status</h2>
        <span role="status" className="text-sm font-semibold">
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-[#6b665d]"><LoaderCircle className="h-4 w-4 animate-spin" /> Saving</span>
          ) : msg.error ? (
            <span className="text-red-700">{msg.error}</span>
          ) : msg.ok ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700"><Check className="h-4 w-4" strokeWidth={3} /> Saved</span>
          ) : null}
        </span>
      </div>
      <div className="grid divide-y divide-[#e6e2db] md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="p-5">
          <p className={label}>Sales</p>
          <Choice
            value={value.status}
            options={[
              { value: "active", label: "Open for offers" },
              { value: "archived", label: "Archived" },
            ]}
            onChange={(status) => save({ status })}
          />
          <p className={hint}>{value.status === "active" ? "Agents can make offers for its units." : "Hidden from New offer. Offers already sent still work."}</p>
        </div>
        <div className="p-5">
          <p className={label}>Stage</p>
          <select
            value={value.stage ?? ""}
            onChange={(e) => save({ stage: e.target.value || null })}
            aria-label="Stage"
            className="mt-2 block w-full border border-[#d9d4cb] bg-white px-3 py-2.5 text-sm font-bold text-[#17150f] outline-none focus:border-[var(--accent)]"
          >
            <option value="">Not set</option>
            {stages.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <p className={hint}>Buyers see it on the website and on every offer.</p>
        </div>
        <div className="p-5">
          <p className={label}>Website</p>
          <Choice
            value={value.is_public}
            options={[
              { value: true, label: "Shown" },
              { value: false, label: "Hidden" },
            ]}
            onChange={(is_public) => save({ is_public })}
          />
          <p className={hint}>
            {value.is_public && pageSlug ? (
              <>
                Live at{" "}
                <a href={`/projects/${pageSlug}`} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent)] hover:underline">
                  jvconline.ph/projects/{pageSlug}
                </a>
              </>
            ) : value.is_public ? (
              "On the public site."
            ) : (
              "Only your team can see this project."
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

const label = "text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b665d]"
const hint = "mt-2 text-sm text-[#6b665d]"

function Choice<T extends string | boolean>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="mt-2 flex border border-[#d9d4cb]">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            onClick={() => !on && onChange(o.value)}
            className={`flex-1 px-3 py-2.5 text-sm font-bold transition ${on ? "bg-[#17150f] text-white" : "bg-white text-[#5a554d] hover:bg-[#f6f4f0] hover:text-[#17150f]"}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
