import type { RequirementSummary } from "@/lib/requirements-types"

/** "Docs 1/3 · 2 to review" — how far the buyer is with their requirements (details count as one). The offers list and the AI's offer cards. */
export function ReqChip({ r }: { r: RequirementSummary }) {
  const done = r.submitted + (r.details ? 1 : 0)
  const total = r.required + 1
  const complete = r.details && r.approved === r.required
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#d9d4cb] text-[#5a554d]"}`}>
        {complete ? "Docs complete" : `Docs ${done}/${total}`}
      </span>
      {r.to_review > 0 && <span className="border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800">{r.to_review} to review</span>}
    </span>
  )
}
