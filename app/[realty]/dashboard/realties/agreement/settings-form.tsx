"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Plus, Save, X } from "lucide-react"
import { toast } from "@/components/feedback"
import { type AgreementSettings, saveAgreementSettings } from "../actions"

const field = (error?: string) =>
  `rounded-xl block w-full border bg-white px-3.5 py-2.5 text-[15px] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 ${error ? "border-red-500 bg-red-50/40" : "border-[#d9d4cb]"}`

/** Who signs for the developer, its office address, the commission rates and the days to send the signed copy. */
export function AgreementSettingsForm({ slug, initial }: { slug: string; initial: AgreementSettings }) {
  const router = useRouter()
  const [s, setS] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()

  const set = <K extends keyof AgreementSettings>(k: K, v: AgreementSettings[K]) => setS((x) => ({ ...x, [k]: v }))
  const setRow = (i: number, k: "classification" | "rate", v: string) =>
    set(
      "commission",
      s.commission.map((r, j) => (j === i ? { ...r, [k]: v } : r)),
    )

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const r = await saveAgreementSettings(slug, {
        ...s,
        commission: s.commission.filter((c) => c.classification.trim() || c.rate.trim()),
      })
      setErrors(r.fieldErrors ?? {})
      if (r.error) {
        toast(r.error, "error")
        return
      }
      toast("Agreement details saved")
      router.refresh()
    })
  }

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Label text="Signs for your company" hint="Full name, as it prints under the signature line." error={errors.representative_name} required>
          <input value={s.representative_name} onChange={(e) => set("representative_name", e.target.value)} maxLength={120} className={field(errors.representative_name)} />
        </Label>
        <Label text="Position" hint="e.g. Sales Director. Leave empty to print “Representative”." error={errors.representative_title}>
          <input value={s.representative_title} onChange={(e) => set("representative_title", e.target.value)} maxLength={120} className={field(errors.representative_title)} />
        </Label>
        <Label text="Office address" hint="Printed after your company's name in the agreement." error={errors.office_address} required wide>
          <input value={s.office_address} onChange={(e) => set("office_address", e.target.value)} maxLength={255} className={field(errors.office_address)} />
        </Label>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]">
          Commission scheme <span className="text-[var(--accent)]">*</span>
        </p>
        <p className="mt-1 text-xs text-[#8a847a]">Article 8&apos;s table: who gets which rate (net of EVAT and discount).</p>
        {errors.commission && <p className="mt-2 text-sm font-semibold text-red-700">{errors.commission}</p>}
        <ul className="mt-3 space-y-2">
          {s.commission.map((row, i) => {
            const rowError = errors[`commission.${i}.classification`] ?? errors[`commission.${i}.rate`]
            return (
              <li key={i}>
                <div className="flex items-start gap-2">
                  <input
                    value={row.classification}
                    onChange={(e) => setRow(i, "classification", e.target.value)}
                    maxLength={120}
                    placeholder="e.g. PRC Licensed Broker"
                    aria-label="Classification"
                    className={`${field(errors[`commission.${i}.classification`])} min-w-0 flex-1`}
                  />
                  <input value={row.rate} onChange={(e) => setRow(i, "rate", e.target.value)} maxLength={60} placeholder="5%" aria-label="Commission rate" className={`${field(errors[`commission.${i}.rate`])} w-24 shrink-0 sm:w-32`} />
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "commission",
                        s.commission.filter((_, j) => j !== i),
                      )
                    }
                    disabled={s.commission.length === 1}
                    aria-label="Remove this rate"
                    className="shrink-0 p-3 text-[#8a847a] hover:text-red-700 disabled:opacity-30"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {rowError && <p className="mt-1 text-sm font-semibold text-red-700">{rowError}</p>}
              </li>
            )
          })}
        </ul>
        {s.commission.length < 20 && (
          <button type="button" onClick={() => set("commission", [...s.commission, { classification: "", rate: "" }])} className="mt-2 inline-flex items-center gap-1.5 py-1 text-sm font-bold text-[var(--accent)] hover:underline">
            <Plus className="h-4 w-4" /> Add a rate
          </button>
        )}
      </div>

      <div className="sm:max-w-xs">
        <Label text="Days to send the signed copy" hint="After you accept a realty: print, sign, notarize, upload." error={errors.signed_copy_days} required>
          <input type="number" min={1} max={365} value={s.signed_copy_days} onChange={(e) => set("signed_copy_days", Number(e.target.value))} className={field(errors.signed_copy_days)} />
        </Label>
      </div>

      <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60">
        {pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Save details
      </button>
    </form>
  )
}

function Label({ text, hint, error, required, wide, children }: { text: string; hint?: string; error?: string; required?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]">
        {text} {required && <span className="text-[var(--accent)]">*</span>}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {error ? <span className="mt-1.5 block text-sm font-semibold text-red-700">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-[#8a847a]">{hint}</span> : null}
    </label>
  )
}
