"use client"

import { useRef, useState, useTransition } from "react"
import { AlertCircle, Camera, Check, CheckCircle2, ChevronDown, Clock, FileText, LoaderCircle, Lock, UserRound, X } from "lucide-react"
import { INCOME_SOURCES, type Requirement, STATE_LABEL, fileSize } from "@/lib/requirements-types"
import { type ReqResult, removeDocument, submitDetails, uploadDocuments } from "./actions"

const input = "mt-1.5 block w-full border border-[#d9d4cb] bg-white px-3.5 py-3 text-[15px] text-[#17150f] outline-none transition placeholder:text-[#b3ada3] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const label = "text-xs font-bold uppercase tracking-[0.1em] text-[#5a554d]"

const STATE_STYLE = {
  missing: "border-[#d9d4cb] text-[#6b665d]",
  review: "border-amber-300 bg-amber-50 text-amber-800",
  approved: "border-emerald-300 bg-emerald-50 text-emerald-800",
  rejected: "border-red-300 bg-red-50 text-red-700",
} as const

type Prefill = { name: string; email: string | null; phone: string | null }

/**
 * "Your requirements" on the buyer's offer: their details (the fields of the
 * realty's reservation form), then each document, uploaded from the phone.
 * Files go to the realty only; this page never shows them back.
 */
export function RequirementsSection({ code, initial, detailsAt: initialDetailsAt, prefill, realtyName }: { code: string; initial: Requirement[]; detailsAt: string | null; prefill: Prefill; realtyName: string }) {
  const [reqs, setReqs] = useState(initial)
  const [detailsAt, setDetailsAt] = useState(initialDetailsAt)
  const [editing, setEditing] = useState(false)

  const apply = (r: ReqResult) => {
    if (r.requirements) setReqs(r.requirements)
    if (r.detailsAt !== undefined) setDetailsAt(r.detailsAt)
  }

  const shown = reqs.filter((r) => r.needed !== "not_needed")
  const required = shown.filter((r) => r.needed === "required")
  const done = required.filter((r) => r.state === "review" || r.state === "approved").length + (detailsAt ? 1 : 0)
  const total = required.length + 1
  const allApproved = !!detailsAt && required.every((r) => r.state === "approved")

  return (
    <div>
      {/* Progress */}
      <div className="border border-[#e0dcd5] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-lg font-bold">{allApproved ? "All set. Your requirements are approved." : `${done} of ${total} done`}</p>
          <p className="text-sm text-[#6b665d]">{allApproved ? "Your agent will contact you for the next step." : "Required items for your reservation"}</p>
        </div>
        <div className="mt-3 flex h-2.5 gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`flex-1 ${i < done ? "bg-[var(--accent)]" : "bg-[#ebe7e1]"}`} />
          ))}
        </div>
      </div>

      {/* Step 1: details */}
      <div className="mt-4 border border-[#e0dcd5] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${detailsAt ? "bg-emerald-600 text-white" : "bg-[#f3f0eb] text-[#17150f]"}`}>
              {detailsAt ? <Check className="h-5 w-5" strokeWidth={3} /> : <UserRound className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-lg font-bold">Your details</p>
              <p className="text-sm text-[#5a554d]">{detailsAt ? `Sent ${new Date(detailsAt).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}. Your agent has them.` : "Personal info, address, work and income. About 5 minutes."}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition ${detailsAt ? "border border-[#d9d4cb] text-[#17150f] hover:border-[#17150f]" : "bg-[var(--accent)] text-white hover:brightness-110"}`}
          >
            {editing ? "Close" : detailsAt ? "Update my details" : "Fill in my details"}
            <ChevronDown className={`h-4 w-4 transition ${editing ? "rotate-180" : ""}`} />
          </button>
        </div>
        {editing && (
          <DetailsForm
            code={code}
            prefill={prefill}
            realtyName={realtyName}
            update={!!detailsAt}
            onDone={(r) => {
              apply(r)
              setEditing(false)
            }}
          />
        )}
      </div>

      {/* Step 2: documents */}
      <ul className="mt-4 space-y-4">
        {shown.map((r) => (
          <DocumentItem key={r.id} code={code} req={r} onChange={apply} />
        ))}
      </ul>
      {reqs.length > shown.length && (
        <p className="mt-3 text-sm text-[#8a847a]">
          {reqs.length - shown.length} other item{reqs.length - shown.length === 1 ? "" : "s"} on {realtyName}&apos;s list {reqs.length - shown.length === 1 ? "doesn't" : "don't"} apply to you, going by your details.
        </p>
      )}

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-[#8a847a]">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Your documents go only to {realtyName} and your agent, for this purchase. They&apos;re stored privately and never shown on this page.
      </p>
    </div>
  )
}

function DocumentItem({ code, req, onChange }: { code: string; req: Requirement; onChange: (r: ReqResult) => void }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = (files: FileList | null) => {
    if (!files?.length) return
    const fd = new FormData()
    for (const f of Array.from(files)) fd.append("files", f)
    setError(null)
    start(async () => {
      const r = await uploadDocuments(code, req.id, fd)
      if (r.error) setError(r.error)
      onChange(r)
      if (fileRef.current) fileRef.current.value = ""
    })
  }
  const remove = (id: number) =>
    start(async () => {
      const r = await removeDocument(code, id)
      if (r.error) setError(r.error)
      onChange(r)
    })

  const canUpload = req.state !== "approved"

  return (
    <li className={`border bg-white p-5 sm:p-6 ${req.state === "rejected" ? "border-red-300" : "border-[#e0dcd5]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="w-full min-w-0 sm:w-auto sm:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold">{req.name}</p>
            <span className={`text-[11px] font-bold uppercase tracking-[0.12em] ${req.needed === "required" ? "text-[var(--accent)]" : "text-[#8a847a]"}`}>{req.needed === "required" ? "Required" : "If it applies to you"}</span>
          </div>
          {req.help && <p className="mt-1 text-[15px] leading-relaxed text-[#5a554d]">{req.help}</p>}
        </div>
        {/* On a phone the status sits above the title, so the text gets the full width. */}
        <span className={`order-first inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-bold sm:order-none ${STATE_STYLE[req.state]}`}>
          {req.state === "approved" ? <CheckCircle2 className="h-3.5 w-3.5" /> : req.state === "review" ? <Clock className="h-3.5 w-3.5" /> : req.state === "rejected" ? <AlertCircle className="h-3.5 w-3.5" /> : null}
          {STATE_LABEL[req.state]}
        </span>
      </div>

      {req.state === "rejected" && req.note && <p className="mt-3 border-l-4 border-red-400 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-800">Your agent says: {req.note}</p>}

      {req.files.length > 0 && (
        <ul className="mt-4 divide-y divide-[#ebe7e1] border-y border-[#ebe7e1]">
          {req.files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2.5 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-[#8a847a]" />
              <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
              <span className="shrink-0 text-xs text-[#8a847a]">
                {fileSize(f.size)} · {f.status === "pending" ? "sent" : f.status === "approved" ? "approved" : "sent back"}
              </span>
              {f.status === "pending" && (
                <button type="button" onClick={() => remove(f.id)} disabled={pending} aria-label={`Remove ${f.name}`} className="shrink-0 p-1 text-[#8a847a] hover:text-red-700 disabled:opacity-40">
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canUpload && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className={`inline-flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-bold transition ${req.state === "missing" || req.state === "rejected" ? "bg-[#17150f] text-white hover:bg-[#3d3a34]" : "border border-[#d9d4cb] text-[#17150f] hover:border-[#17150f]"} ${pending ? "pointer-events-none opacity-60" : ""}`}>
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {pending ? "Sending…" : req.files.length ? "Add another file" : "Upload photo or PDF"}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={pending} />
          </label>
          <span className="text-xs text-[#8a847a]">Photo or PDF, up to 10 MB each. Make sure every corner is visible.</span>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </li>
  )
}

function DetailsForm({ code, prefill, realtyName, update, onDone }: { code: string; prefill: Prefill; realtyName: string; update: boolean; onDone: (r: ReqResult) => void }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [civil, setCivil] = useState("")
  const [home, setHome] = useState("")
  const [co, setCo] = useState(false)
  const parts = prefill.name.trim().split(/\s+/)
  const guess = { first: parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] ?? "", last: parts.length > 1 ? parts[parts.length - 1] : "" }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    start(async () => {
      const r = await submitDetails(code, fd)
      if (r.error) {
        setError(r.error)
        setFields(r.fields ?? {})
        return
      }
      setFields({})
      onDone(r)
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6 border-t border-[#e0dcd5] bg-[#fbfaf8] p-5 sm:p-6">
      <p className="text-sm text-[#5a554d]">
        {update ? "Fill in the form again to replace what you sent. " : ""}For required information that doesn&apos;t apply to you, write <strong>N/A</strong>.
      </p>
      <Group title="Personal profile">
        <Field name="first_name" text="First name" def={guess.first} error={fields.first_name} />
        <Field name="middle_name" text="Middle name" error={fields.middle_name} />
        <Field name="last_name" text="Last name" def={guess.last} error={fields.last_name} />
        <Field name="name_extension" text="Name extension" req={false} ph="Jr., III" error={fields.name_extension} />
        <Field name="birth_date" text="Birth date" type="date" error={fields.birth_date} />
        <Select name="civil_status" text="Civil status" options={["Single", "Married", "Widowed", "Legally separated/annulled"]} value={civil} onChange={setCivil} error={fields.civil_status} />
        <Select name="gender" text="Gender" options={["Male", "Female"]} error={fields.gender} />
        <Field name="citizenship" text="Citizenship" def="Filipino" error={fields.citizenship} />
        <Field name="religion" text="Religion" req={false} error={fields.religion} />
        {civil === "Married" && <Field name="spouse_name" text="Spouse's full name" req={false} error={fields.spouse_name} />}
      </Group>
      <Group title="Contact">
        <Field name="email" text="Email" type="email" def={prefill.email} error={fields.email} />
        <Field name="phone" text="Mobile number" type="tel" def={prefill.phone} ph="09XX XXX XXXX" error={fields.phone} />
        <Field name="messenger" text="Messenger / Viber account" span ph="Name or number you use on Messenger or Viber" error={fields.messenger} />
      </Group>
      <Group title="Government numbers">
        <Field name="tin" text="TIN" error={fields.tin} />
        <Field name="sss" text="SSS / GSIS number" error={fields.sss} />
        <Field name="pagibig_mid" text="Pag-IBIG MID number" req={false} error={fields.pagibig_mid} />
      </Group>
      <Group title="Address">
        <Field name="current_address" text="Current address" span error={fields.current_address} />
        <Field name="provincial_address" text="Provincial address" span error={fields.provincial_address} />
        <Field name="zip" text="Zip code" error={fields.zip} />
        <Select name="home_ownership" text="Current home" options={["Owned", "Living with relatives or others", "Renting"]} req={false} value={home} onChange={setHome} error={fields.home_ownership} />
        {home === "Renting" && <Field name="rent_cost" text="Monthly rent" req={false} ph="₱" error={fields.rent_cost} />}
      </Group>
      <Group title="Work & income">
        <Select name="income_source" text="Main source of income" options={INCOME_SOURCES} error={fields.income_source} />
        <Field name="monthly_income" text="Monthly gross income" req={false} ph="₱" error={fields.monthly_income} />
        <Field name="employer" text="Employer or business name" req={false} error={fields.employer} />
        <Field name="position" text="Position or line of work" req={false} error={fields.position} />
      </Group>
      <fieldset className="border-t border-[#ebe7e1] pt-5">
        <legend className="pr-3 text-sm font-bold text-[#17150f]">Co-borrower</legend>
        <label className="mt-3 flex items-center gap-3 text-[15px]">
          <input type="checkbox" name="co_borrower" checked={co} onChange={(e) => setCo(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
          I&apos;ll have a co-borrower
        </label>
        {co && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field name="co_borrower_name" text="Co-borrower's full name" req={false} error={fields.co_borrower_name} />
            <Select name="co_borrower_relationship" text="Relationship" options={["Parent", "Sibling", "Child"]} req={false} error={fields.co_borrower_relationship} />
          </div>
        )}
      </fieldset>

      <label className={`flex items-start gap-3 border p-4 text-sm leading-relaxed ${fields.consent ? "border-red-400 bg-red-50" : "border-[#e0dcd5] bg-white"}`}>
        <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]" />
        <span>
          I agree that {realtyName} may collect and use my personal information and documents to process this purchase and my financing, under the Data Privacy Act of 2012 (RA 10173).
        </span>
      </label>

      {error && (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] px-6 py-4 text-base font-bold text-white transition hover:brightness-110 disabled:opacity-60 sm:w-auto">
        {pending && <LoaderCircle className="h-5 w-5 animate-spin" />} {update ? "Send my updated details" : "Send my details"}
      </button>
    </form>
  )
}

type FieldProps = { name: string; text: string; type?: string; req?: boolean; def?: string | null; ph?: string; span?: boolean; error?: string }

function Field({ name, text, type = "text", req = true, def, ph, span, error }: FieldProps) {
  return (
    <label className={`block ${span ? "sm:col-span-2" : ""}`}>
      <span className={label}>
        {text}
        {req ? <span className="text-[var(--accent)]"> *</span> : <span className="font-semibold normal-case tracking-normal text-[#a39d92]"> (optional)</span>}
      </span>
      <input name={name} type={type} required={req} defaultValue={def ?? ""} placeholder={ph} className={`${input} ${error ? "border-red-400" : ""}`} />
      {error && <span className="mt-1 block text-xs font-semibold text-red-700">{error}</span>}
    </label>
  )
}

type SelectProps = { name: string; text: string; options: readonly (string | { v: string; l: string })[]; req?: boolean; value?: string; onChange?: (v: string) => void; error?: string }

function Select({ name, text, options, req = true, value, onChange, error }: SelectProps) {
  return (
    <label className="block">
      <span className={label}>
        {text}
        {req && <span className="text-[var(--accent)]"> *</span>}
      </span>
      <select name={name} required={req} {...(onChange ? { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value) } : { defaultValue: "" })} className={`${input} ${error ? "border-red-400" : ""}`}>
        <option value="" disabled={req}>
          Choose…
        </option>
        {options.map((o) => (typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>))}
      </select>
      {error && <span className="mt-1 block text-xs font-semibold text-red-700">{error}</span>}
    </label>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-[#ebe7e1] pt-5">
      <legend className="pr-3 text-sm font-bold text-[#17150f]">{title}</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}
