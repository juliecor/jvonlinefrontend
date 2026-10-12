"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, LoaderCircle, Trash2 } from "lucide-react"
import { confirmAction, toast } from "@/components/feedback"
import { removePhoto, uploadPhoto } from "./actions"

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

/** Your profile photo: shown at the top of your sidebar, with your initials when there's none. */
export function ProfilePhoto({ slug, name, photo }: { slug: string; name: string; photo: string | null }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(photo)
  const [pending, start] = useTransition()

  const done = (r: { error?: string; photo?: string | null }, message: string) => {
    if (r.error) return toast(r.error, "error")
    setUrl(r.photo ?? null)
    toast(message)
    router.refresh()
  }

  return (
    <section className="flex flex-col gap-5 border border-[#e6e2db] bg-white p-5 sm:flex-row sm:items-center">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-24 w-24 shrink-0 rounded-full object-cover ring-1 ring-[#e6e2db]" />
      ) : (
        <span aria-hidden className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#17150f] text-2xl font-semibold text-white">
          {initials(name)}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-lg font-bold">Profile photo</p>
        <p className="mt-0.5 text-[15px] text-[#5a554d]">Shown at the top of your menu. A clear photo of your face works best. JPG or PNG, up to 5 MB.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => input.current?.click()} className="inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {url ? "Change photo" : "Upload photo"}
          </button>
          {url && (
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                if (!(await confirmAction({ title: "Remove your photo?", body: "Your initials show instead.", confirm: "Remove", danger: true }))) return
                start(async () => done(await removePhoto(slug), "Photo removed"))
              }}
              className="inline-flex items-center gap-2 border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#3d3a34] hover:border-red-400 hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (!file) return
          if (file.size > 5 * 1024 * 1024) return toast("The photo can be up to 5 MB.", "error")
          const fd = new FormData()
          fd.append("photo", file)
          start(async () => done(await uploadPhoto(slug, fd), "Photo saved"))
        }}
      />
    </section>
  )
}
