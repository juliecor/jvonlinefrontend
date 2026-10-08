"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { AlertCircle, CircleCheck, FileText, LoaderCircle, Paperclip, Send, X } from "lucide-react"
import { ChoiceBox } from "@/components/choice-box"
import { fileSize } from "@/lib/requirements-types"
import { type AccreditationState, submitAccreditation } from "./actions"

export type AccreditationDocumentRow = { kind: string; name: string; label: string; required_for: "corporation" | "sole_proprietor" | null }

type Props = { token: string; developer: string; email: string; documents: AccreditationDocumentRow[]; civilStatuses: string[]; today: string; adultBy: string }

const MAX_FILE = 10 * 1024 * 1024
const inputBase = "block w-full border bg-white px-3.5 py-3 text-[15px] text-[#17150f] outline-none transition placeholder:text-[#b3ada3] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 disabled:bg-[#f6f4f0] disabled:text-[#a39d92]"
const input = (error?: string) => `${inputBase} ${error ? "border-red-500 bg-red-50/40" : "border-[#d9d4cb]"}`

/**
 * The accreditation form: choose Corporation or Sole Proprietor, the firm's and the representative's
 * details, and the registration documents. What can be checked here is, so a missing answer doesn't
 * send five files over again; Laravel checks everything once more. The form is submitted by hand
 * (not as a form action) so the chosen files stay put when an answer needs another look.
 */
export function AccreditationForm({ token, developer, email, documents, civilStatuses, today, adultBy }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const [type, setType] = useState<"corporation" | "sole_proprietor" | "">("")
  const [hlurb, setHlurb] = useState("")
  const [files, setFiles] = useState<Record<string, { name: string; size: number } | null>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()
  const [sent, setSent] = useState<{ email: string } | null>(null)
  const [pending, start] = useTransition()

  // After an error, bring the first marked answer into view.
  useEffect(() => {
    if (Object.keys(errors).length === 0) return
    const first = formRef.current?.querySelector<HTMLElement>('[data-invalid="true"]')
    first?.scrollIntoView({ behavior: "smooth", block: "center" })
    first?.querySelector<HTMLElement>("input, select")?.focus({ preventScroll: true })
  }, [errors])

  const required = (doc: AccreditationDocumentRow) => doc.required_for !== null && doc.required_for === type

  const pick = (doc: AccreditationDocumentRow, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const okType = file.type === "application/pdf" || file.type.startsWith("image/")
    const problem = !okType ? "Attach a photo (JPG, PNG, HEIC) or a PDF." : file.size > MAX_FILE ? "Each file can be up to 10 MB." : null
    if (problem) {
      e.target.value = ""
      setFiles((f) => ({ ...f, [doc.kind]: null }))
      setErrors((x) => ({ ...x, [`documents.${doc.kind}`]: problem }))
      return
    }
    setFiles((f) => ({ ...f, [doc.kind]: { name: file.name, size: file.size } }))
    setErrors((x) => {
      const rest = { ...x }
      delete rest[`documents.${doc.kind}`]
      return rest
    })
  }

  const clearFile = (kind: string) => {
    const el = fileInputs.current[kind]
    if (el) el.value = ""
    setFiles((f) => ({ ...f, [kind]: null }))
  }

  /** The obvious mistakes, found before anything is uploaded. */
  const check = (fd: FormData): Record<string, string> => {
    const text = (k: string) => String(fd.get(k) ?? "").trim()
    const found: Record<string, string> = {}
    const need = (k: string, message: string) => {
      if (!text(k)) found[k] = message
    }
    if (!type) found.business_type = "Choose Corporation or Sole Proprietor."
    need("firm_name", "Enter the name of your realty firm or broker.")
    need("residential_address", "Enter your residential address.")
    if (type === "corporation") need("tin_company", "Enter the company's tax identification number.")
    need("tin_personal", "Enter your personal tax identification number.")
    need("prc_number", "Enter your PRC registration number.")
    if (!text("prc_valid_until")) found.prc_valid_until = "Enter the date your PRC registration is valid until."
    else if (text("prc_valid_until") < today) found.prc_valid_until = "The PRC registration has to be valid today or later."
    if (text("hlurb_number") && !text("hlurb_issued_at")) found.hlurb_issued_at = "Enter the date the HLURB registration was issued."
    need("representative_name", "Enter the representative's full name.")
    need("place_of_birth", "Enter the place of birth.")
    if (!text("date_of_birth")) found.date_of_birth = "Enter the date of birth."
    else if (text("date_of_birth") > adultBy) found.date_of_birth = "The representative has to be at least 18 years old."
    need("citizenship", "Enter the citizenship.")
    if (!text("gender")) found.gender = "Choose Male or Female."
    need("civil_status", "Choose the civil status.")
    if (!/^09\d{9}$/.test(text("mobile"))) found.mobile = "Enter an 11-digit mobile number that starts with 09, e.g. 09171234567."
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(text("login_email"))) found.login_email = "Enter a valid email address."
    for (const k of ["years_in_real_estate", "years_firm_operating", "salespersons"]) {
      if (text(k) === "" || Number(text(k)) < 0) found[k] = "Enter a number, 0 or more."
    }
    for (const doc of documents) {
      if (required(doc) && !files[doc.kind]) found[`documents.${doc.kind}`] = `Attach your ${doc.name}.`
    }
    return found
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const found = check(fd)
    setFormError(undefined)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFormError(`Please check ${Object.keys(found).length === 1 ? "the answer that is" : "the answers that are"} marked below.`)
      return
    }
    start(async () => {
      const res: AccreditationState = await submitAccreditation(token, fd)
      if (res.ok) {
        setSent({ email: String(fd.get("login_email") ?? email) })
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }
      setErrors(res.fieldErrors ?? {})
      setFormError(res.error)
    })
  }

  if (sent) {
    return (
      <div role="status" className="border-l-4 border-emerald-600 bg-emerald-50 px-6 py-8 sm:px-8">
        <CircleCheck className="h-9 w-9 text-emerald-700" />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-emerald-950">Thank you. Your form is in.</h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-emerald-900">
          {developer} will review your accreditation. Once it is accepted we will email <strong>{sent.email}</strong> your username and a temporary password for your dashboard. You can close this page now.
        </p>
      </div>
    )
  }

  const err = (k: string) => errors[k]

  return (
    <form ref={formRef} onSubmit={submit} onChange={() => formError && setFormError(undefined)} noValidate className="space-y-14">
      {/* ACCREDITATION DETAILS */}
      <Section title="Accreditation details">
        <div data-invalid={!!err("business_type")} className="flex flex-wrap gap-x-12 gap-y-3">
          <ChoiceBox name="business_type" value="corporation" label="Corporation" checked={type === "corporation"} onChange={() => setType("corporation")} invalid={!!err("business_type")} />
          <ChoiceBox name="business_type" value="sole_proprietor" label="Sole Proprietor" checked={type === "sole_proprietor"} onChange={() => setType("sole_proprietor")} invalid={!!err("business_type")} />
        </div>
        {err("business_type") && <p className="mt-2 text-sm font-semibold text-red-700">{err("business_type")}</p>}

        <Grid>
          <Field label="Name of Realty Firm or Broker" required error={err("firm_name")}>
            <input name="firm_name" maxLength={150} autoComplete="organization" className={input(err("firm_name"))} />
          </Field>
          <Field label="Residential Address" required error={err("residential_address")}>
            <input name="residential_address" maxLength={255} autoComplete="street-address" className={input(err("residential_address"))} />
          </Field>
          <Field label="Tax Identification No. (Company)" required={type === "corporation"} hint={type === "sole_proprietor" ? "Not needed for a sole proprietor." : undefined} error={err("tin_company")}>
            <input name="tin_company" maxLength={40} inputMode="numeric" placeholder="000-000-000-000" className={input(err("tin_company"))} />
          </Field>
          <Field label="Tax Identification No. (Personal)" required error={err("tin_personal")}>
            <input name="tin_personal" maxLength={40} inputMode="numeric" placeholder="000-000-000-000" className={input(err("tin_personal"))} />
          </Field>
          <Field label="PRC Registration Number" required error={err("prc_number")}>
            <input name="prc_number" maxLength={60} className={input(err("prc_number"))} />
          </Field>
          <Field label="Valid Until" required error={err("prc_valid_until")}>
            <input name="prc_valid_until" type="date" min={today} className={input(err("prc_valid_until"))} />
          </Field>
          <Field label="HLURB Registration Number" hint="If you have one." error={err("hlurb_number")}>
            <input name="hlurb_number" maxLength={60} value={hlurb} onChange={(e) => setHlurb(e.target.value)} className={input(err("hlurb_number"))} />
          </Field>
          <Field label="Date Issued" required={hlurb.trim() !== ""} error={err("hlurb_issued_at")}>
            <input name="hlurb_issued_at" type="date" max={today} className={input(err("hlurb_issued_at"))} />
          </Field>
        </Grid>
      </Section>

      {/* PERSONAL & CONTACT DETAILS */}
      <Section title="Personal & contact details" note="Of the person who represents your realty. This person gets the login for your dashboard.">
        <Grid>
          <Field label="Full Name of Representative" required error={err("representative_name")} wide>
            <input name="representative_name" maxLength={120} autoComplete="name" className={input(err("representative_name"))} />
          </Field>
          <Field label="Place of Birth" required error={err("place_of_birth")}>
            <input name="place_of_birth" maxLength={150} className={input(err("place_of_birth"))} />
          </Field>
          <Field label="Date of Birth" required error={err("date_of_birth")}>
            <input name="date_of_birth" type="date" max={adultBy} autoComplete="bday" className={input(err("date_of_birth"))} />
          </Field>
          <Field label="Citizenship" required error={err("citizenship")}>
            <input name="citizenship" maxLength={80} defaultValue="Filipino" className={input(err("citizenship"))} />
          </Field>
          <div data-invalid={!!err("gender")} className="flex flex-col justify-end pb-1">
            <span className="mb-2.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]">
              Sex <span className="text-[var(--accent)]">*</span>
            </span>
            <div className="flex flex-wrap gap-x-12 gap-y-3">
              <ChoiceBox name="gender" value="male" label="Male" invalid={!!err("gender")} />
              <ChoiceBox name="gender" value="female" label="Female" invalid={!!err("gender")} />
            </div>
            {err("gender") && <p className="mt-2 text-sm font-semibold text-red-700">{err("gender")}</p>}
          </div>
          <Field label="Civil Status" required error={err("civil_status")}>
            <select name="civil_status" defaultValue="" className={input(err("civil_status"))}>
              <option value="" disabled>
                Choose…
              </option>
              {civilStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Landline Number" error={err("landline")}>
            <input name="landline" type="tel" maxLength={40} autoComplete="tel-national" className={input(err("landline"))} />
          </Field>
          <Field label="Mobile Number" required error={err("mobile")}>
            <input
              name="mobile"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="09171234567"
              autoComplete="tel"
              // Numbers only: anything else is dropped as it is typed or pasted.
              onChange={(e) => (e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 11))}
              className={input(err("mobile"))}
            />
          </Field>
          <Field label="Email" required hint="This becomes your username." error={err("login_email")}>
            <input name="login_email" type="email" maxLength={190} defaultValue={email} autoComplete="email" className={input(err("login_email"))} />
          </Field>
          <Field label="Facebook" hint="Page or profile link." error={err("facebook")}>
            <input name="facebook" maxLength={190} className={input(err("facebook"))} />
          </Field>
          <Field label="No. of Years in Real Estate" required error={err("years_in_real_estate")}>
            <input name="years_in_real_estate" type="number" min={0} max={100} inputMode="numeric" defaultValue={0} className={input(err("years_in_real_estate"))} />
          </Field>
          <Field label="No. of Years the Realty Firm Has Been in Operation" required error={err("years_firm_operating")}>
            <input name="years_firm_operating" type="number" min={0} max={200} inputMode="numeric" defaultValue={0} className={input(err("years_firm_operating"))} />
          </Field>
          <Field label="Number of Salespersons" required error={err("salespersons")}>
            <input name="salespersons" type="number" min={0} max={100000} inputMode="numeric" defaultValue={0} className={input(err("salespersons"))} />
          </Field>
        </Grid>
      </Section>

      {/* REQUIRED DOCUMENTS */}
      <Section title="Required documents" note="A PDF or a clear photo, up to 10 MB each.">
        {!type && <p className="mb-4 border-l-4 border-[#e6e2db] bg-[#faf8f5] px-4 py-3 text-sm text-[#6b665d]">Choose Corporation or Sole Proprietor above to see which documents are required for you.</p>}
        <ul className="divide-y divide-[#e6e2db] border-y border-[#e6e2db]">
          {documents.map((doc) => {
            const picked = files[doc.kind]
            const must = required(doc)
            const problem = err(`documents.${doc.kind}`)
            return (
              <li key={doc.kind} data-invalid={!!problem} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div className="min-w-0 sm:max-w-[60%]">
                  <p className="text-[15px] leading-relaxed text-[#17150f]">{doc.label}</p>
                  <p className={`mt-1.5 text-xs font-bold uppercase tracking-[0.12em] ${must ? "text-[var(--accent)]" : "text-[#8a847a]"}`}>{must ? "Required for you" : doc.required_for ? "Not needed for you" : "Optional"}</p>
                </div>
                <div className="sm:w-[40%] sm:text-right">
                  {/* One file input for the life of the row: it holds the chosen file, so it must never unmount. */}
                  <input
                    ref={(el) => {
                      fileInputs.current[doc.kind] = el
                    }}
                    id={`doc-${doc.kind}`}
                    name={`documents[${doc.kind}]`}
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => pick(doc, e)}
                    className="peer sr-only"
                  />
                  {picked ? (
                    <div className="inline-flex max-w-full items-center gap-2.5 border border-emerald-300 bg-emerald-50 px-3 py-2 text-left">
                      <FileText className="h-5 w-5 shrink-0 text-emerald-700" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-emerald-950">{picked.name}</span>
                        <span className="block text-xs text-emerald-800">{fileSize(picked.size)}</span>
                      </span>
                      <button type="button" onClick={() => clearFile(doc.kind)} aria-label={`Remove ${picked.name}`} className="ml-1 shrink-0 p-1 text-emerald-800 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor={`doc-${doc.kind}`} className="inline-flex cursor-pointer items-center gap-2 px-1 py-2 text-sm font-bold uppercase tracking-[0.08em] text-[var(--accent)] transition hover:brightness-75 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)]/40">
                      <Paperclip className="h-4 w-4" /> Choose file
                    </label>
                  )}
                  {problem && <p className="mt-2 text-sm font-semibold text-red-700">{problem}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      </Section>

      {formError && (
        <p role="alert" className="flex gap-3 border-l-4 border-red-600 bg-red-50 px-4 py-3.5 text-[15px] font-semibold text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> {formError}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2.5 bg-[var(--accent)] px-6 py-4 text-base font-bold uppercase tracking-[0.1em] text-white transition hover:brightness-110 disabled:opacity-60">
          {pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {pending ? "Sending your form…" : "Submit"}
        </button>
        <p className="mt-4 text-center text-xs leading-relaxed text-[#8a847a]">
          Your details and documents are private. Only {developer}&apos;s accreditation team can see them, and they are used to review your accreditation.
        </p>
      </div>
    </form>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-[#6b665d]">{title}</h2>
      {note && <p className="mx-auto mt-2 max-w-lg text-center text-sm text-[#8a847a]">{note}</p>}
      <div className="mt-7">{children}</div>
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 grid gap-x-6 gap-y-5 first:mt-0 sm:grid-cols-2">{children}</div>
}

function Field({ label, required, hint, error, wide, children }: { label: string; required?: boolean; hint?: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label data-invalid={!!error} className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-bold uppercase leading-snug tracking-[0.12em] text-[#5a554d]">
        {label} {required && <span className="text-[var(--accent)]">*</span>}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {error ? <span className="mt-1.5 block text-sm font-semibold text-red-700">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-[#8a847a]">{hint}</span> : null}
    </label>
  )
}
