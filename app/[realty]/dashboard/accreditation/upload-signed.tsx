"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileText, LoaderCircle, Paperclip, Upload, X } from "lucide-react"
import { toast } from "@/components/feedback"
import { fileSize } from "@/lib/requirements-types"
import { uploadSignedCopy } from "./actions"

const MAX = 20 * 1024 * 1024

/** Choose the scanned, signed and notarized agreement (a PDF, or a photo) and send it. */
export function UploadSignedCopy({ slug, again }: { slug: string; again: boolean }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>()
  const [pending, start] = useTransition()

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    const problem = !f ? null : !(f.type === "application/pdf" || f.type.startsWith("image/")) ? "Upload a PDF (best) or a photo." : f.size > MAX ? "The file can be up to 20 MB." : null
    setError(problem ?? undefined)
    setFile(problem ? null : f)
    if (problem) e.target.value = ""
  }

  const send = () =>
    start(async () => {
      if (!file) return
      const fd = new FormData()
      fd.set("file", file)
      const r = await uploadSignedCopy(slug, fd)
      if (r.error) {
        setError(r.error)
        toast(r.error, "error")
        return
      }
      setFile(null)
      if (input.current) input.current.value = ""
      toast("Signed agreement sent for checking")
      router.refresh()
    })

  return (
    <div>
      <input ref={input} id="signed-copy" type="file" accept="application/pdf,image/*" onChange={pick} className="peer sr-only" />
      {file ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex max-w-full items-center gap-2.5 border border-emerald-300 bg-emerald-50 px-3 py-2">
            <FileText className="h-5 w-5 shrink-0 text-emerald-700" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-emerald-950">{file.name}</span>
              <span className="block text-xs text-emerald-800">{fileSize(file.size)}</span>
            </span>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove" className="p-1 text-emerald-800 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </span>
          <button type="button" onClick={send} disabled={pending} className="inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white hover:brightness-110 disabled:opacity-60">
            {pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />} {pending ? "Sending…" : "Send it"}
          </button>
        </div>
      ) : (
        <label
          htmlFor="signed-copy"
          className="inline-flex cursor-pointer items-center gap-2 border border-[#17150f] bg-white px-5 py-3 text-[15px] font-bold text-[#17150f] hover:bg-[#f6f4f0] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)]/40"
        >
          <Paperclip className="h-5 w-5" /> {again ? "Upload a new copy" : "Choose the scanned agreement"}
        </label>
      )}
      <p className="mt-2 text-xs text-[#8a847a]">One PDF with every page is best. Up to 20 MB.</p>
      {error && <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  )
}
