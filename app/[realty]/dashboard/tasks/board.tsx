"use client"

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, Check, FileText, Flag, LoaderCircle, MessageSquare, Paperclip, Pencil, Play, Plus, RotateCcw, Send, Trash2, Upload, X } from "lucide-react"
import { confirmAction, toast } from "@/components/feedback"
import { Modal } from "@/components/modal"
import { shortDate, timeAgo } from "@/lib/format"
import { addComment, addFile, createTask, deleteFile, deleteTask, loadTask, moveTask, updateTask } from "./actions"
import { COLUMNS, type Task, type TaskDetail, type TaskFields, type TaskOptions } from "./types"

type Status = Task["status"]
const today = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

/** "Due Oct 12", "Due today", "Late · Oct 9". */
function dueText(t: Pick<Task, "due_on" | "overdue" | "status">) {
  if (!t.due_on) return null
  if (t.overdue) return { text: `Late · ${shortDate(t.due_on)}`, tone: "late" as const }
  if (t.due_on === today() && t.status !== "done") return { text: "Due today", tone: "soon" as const }
  return { text: `Due ${shortDate(t.due_on)}`, tone: "plain" as const }
}

/**
 * The board: To do, In progress, Done. Cards move by drag and drop (on a
 * computer) or with the buttons in a task. Managers also filter by person
 * and give out new tasks; a task opens in a dialog with its comments and files.
 */
export function TaskBoard({ slug, tasks, manager, scope, options, openTask, startNew }: { slug: string; tasks: Task[]; manager: boolean; scope: "all" | "mine"; options: TaskOptions | null; openTask: number | null; startNew: { offer_id: number | null; project_id: number | null } | null }) {
  const router = useRouter()
  const path = usePathname()
  const [person, setPerson] = useState<string>("")
  const [open, setOpen] = useState<number | null>(openTask)
  const [form, setForm] = useState<{ task: TaskDetail | null; preset?: { offer_id: number | null; project_id: number | null } } | null>(startNew ? { task: null, preset: startNew } : null)
  const [dragging, setDragging] = useState<number | null>(null)
  // The card being dragged, also carried in the drag itself, so a fast drop still knows which one.
  const dragged = useRef<number | null>(null)
  const [over, setOver] = useState<Status | null>(null)
  const [, start] = useTransition()
  // A moved card lands in its new column at once; the server confirms (or it goes back).
  const [shown, place] = useOptimistic(tasks, (list, move: { id: number; status: Status }) => list.map((t) => (t.id === move.id ? { ...t, status: move.status } : t)))

  // The address stays clean once a link's task (or new-task form) has opened.
  useEffect(() => {
    if (openTask || startNew) router.replace(scope === "mine" ? `${path}?scope=mine` : path, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const move = (t: Task, status: Status) => {
    if (t.status === status || !t.can_move) return
    start(async () => {
      place({ id: t.id, status })
      const r = await moveTask(slug, t.id, status)
      if (r.error) toast(r.error, "error")
      else toast(status === "done" ? `Done: ${t.title}` : status === "doing" ? `In progress: ${t.title}` : `Back to To do: ${t.title}`)
    })
  }

  const visible = shown.filter((t) => !person || String(t.assignee?.id ?? "none") === person)
  const people = [...new Map(tasks.filter((t) => t.assignee).map((t) => [t.assignee!.id, t.assignee!.name])).entries()]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {manager && (
            <div className="flex gap-1 rounded-xl border border-[#d9d4cb] bg-white p-1 text-sm font-bold">
              <Link href={path} className={`rounded-lg px-3.5 py-1.5 ${scope === "all" ? "bg-[#17150f] text-white" : "text-[#3d3a34] hover:bg-[#f6f4f0]"}`}>
                Everyone&apos;s
              </Link>
              <Link href={`${path}?scope=mine`} className={`rounded-lg px-3.5 py-1.5 ${scope === "mine" ? "bg-[#17150f] text-white" : "text-[#3d3a34] hover:bg-[#f6f4f0]"}`}>
                Mine
              </Link>
            </div>
          )}
          {manager && scope === "all" && people.length > 1 && (
            <select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Show one person's tasks" className="rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-sm font-semibold text-[#17150f]">
              <option value="">Everyone</option>
              {people.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
              <option value="none">Nobody yet</option>
            </select>
          )}
        </div>
        {manager && (
          <button type="button" onClick={() => setForm({ task: null })} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
            <Plus className="h-4 w-4" strokeWidth={2.5} /> New task
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const cards = visible.filter((t) => t.status === col.status)
          return (
            <section
              key={col.status}
              onDragOver={(e) => {
                if (dragged.current === null && !e.dataTransfer.types.includes("text/plain")) return
                e.preventDefault()
                setOver(col.status)
              }}
              onDragLeave={() => setOver((o) => (o === col.status ? null : o))}
              onDrop={(e) => {
                e.preventDefault()
                setOver(null)
                const id = Number(e.dataTransfer.getData("text/plain")) || dragged.current
                const t = shown.find((x) => x.id === id)
                dragged.current = null
                setDragging(null)
                if (t) move(t, col.status)
              }}
              className={`flex min-h-40 flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_2px_12px_-2px_rgba(23,21,15,0.06)] transition ${over === col.status ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_6%,white)]" : "border-[#e8eaed]"}`}
            >
              <header className="flex items-center justify-between border-b border-[#e6e2db] px-4 py-3">
                <h2 className="text-[15px] font-bold text-[#17150f]">{col.label}</h2>
                <span className="rounded-full bg-[#f3f1ed] px-2 py-0.5 text-xs font-bold tabular-nums text-[#3d3a34]">{cards.length}</span>
              </header>
              <ul className="flex-1 space-y-2.5 bg-[#faf9f7] p-3">
                {cards.map((t) => {
                  const due = dueText(t)
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        draggable={t.can_move}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move"
                          e.dataTransfer.setData("text/plain", String(t.id))
                          dragged.current = t.id
                          setDragging(t.id)
                        }}
                        onDragEnd={() => {
                          dragged.current = null
                          setDragging(null)
                        }}
                        onClick={() => setOpen(t.id)}
                        className={`rounded-xl block w-full border bg-white p-3.5 text-left transition hover:border-[#17150f] ${t.priority === "urgent" && t.status !== "done" ? "border-l-4 border-[#e0dcd5] border-l-red-600" : "border-[#e0dcd5]"} ${dragging === t.id ? "opacity-50" : ""}`}
                      >
                        {t.priority === "urgent" && t.status !== "done" && (
                          <span className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-red-700">
                            <Flag className="h-3 w-3" /> Urgent
                          </span>
                        )}
                        <span className={`block text-[15px] font-bold leading-snug ${t.status === "done" ? "text-[#8a847a] line-through decoration-[#c9c3b8]" : "text-[#17150f]"}`}>{t.title}</span>
                        {t.link && (
                          <span className="rounded-full mt-1.5 inline-flex max-w-full items-center gap-1 bg-[#f6f4f0] px-2 py-0.5 text-xs font-semibold text-[#3d3a34]">
                            <FileText className="h-3 w-3 shrink-0" /> <span className="truncate">{t.link.label}</span>
                          </span>
                        )}
                        <span className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            {t.assignee ? (
                              <>
                                <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#17150f] text-[10px] font-bold text-white">{initials(t.assignee.name)}</span>
                                <span className="truncate text-xs font-semibold text-[#5a554d]">{t.assignee.name}</span>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-[#a39d92]">Nobody yet</span>
                            )}
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[#8a847a]">
                            {due && <span className={due.tone === "late" ? "font-bold text-red-700" : due.tone === "soon" ? "font-bold text-amber-700" : ""}>{due.text}</span>}
                            {t.comment_count > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <MessageSquare className="h-3.5 w-3.5" /> {t.comment_count}
                              </span>
                            )}
                            {t.file_count > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Paperclip className="h-3.5 w-3.5" /> {t.file_count}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
                {cards.length === 0 && <li className="px-1 py-6 text-center text-sm text-[#a39d92]">{col.status === "done" ? "Finished tasks show here for 30 days." : "Nothing here."}</li>}
              </ul>
            </section>
          )
        })}
      </div>

      <Modal open={open !== null} onClose={() => setOpen(null)} title="Task">
        {open !== null && (
          <TaskView
            key={open}
            slug={slug}
            id={open}
            onMove={(t, s) => move(t, s)}
            onEdit={(t) => {
              setOpen(null)
              setForm({ task: t })
            }}
            onDeleted={() => setOpen(null)}
          />
        )}
      </Modal>
      <Modal open={form !== null} onClose={() => setForm(null)} title={form?.task ? "Change the task" : "New task"}>
        {form && options && <TaskForm slug={slug} task={form.task} preset={form.preset} options={options} onDone={() => setForm(null)} />}
      </Modal>
    </div>
  )
}

/** One task: what, who, when, the buttons to move it, then comments and files. */
function TaskView({ slug, id, onMove, onEdit, onDeleted }: { slug: string; id: number; onMove: (t: Task, s: Status) => void; onEdit: (t: TaskDetail) => void; onDeleted: () => void }) {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [error, setError] = useState("")
  const [comment, setComment] = useState("")
  const [busy, start] = useTransition()
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let live = true
    loadTask(slug, id).then((r) => {
      if (!live) return
      if (r.data) setTask(r.data)
      else setError(r.error ?? "This task isn't there anymore.")
    })
    return () => {
      live = false
    }
  }, [slug, id])

  if (error) return <p className="text-sm font-bold text-red-700">{error}</p>
  if (!task) return <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#8a847a]" />

  const due = dueText(task)
  const go = (s: Status) => {
    onMove(task, s)
    setTask({ ...task, status: s })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-[#17150f] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">{COLUMNS.find((c) => c.status === task.status)?.label}</span>
          {task.priority === "urgent" && <span className="rounded-full inline-flex items-center gap-1 bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-red-700"><Flag className="h-3 w-3" /> Urgent</span>}
          {due && <span className={`inline-flex items-center gap-1 text-xs font-bold ${due.tone === "late" ? "text-red-700" : due.tone === "soon" ? "text-amber-700" : "text-[#5a554d]"}`}><CalendarDays className="h-3.5 w-3.5" /> {due.text}</span>}
        </div>
        <h3 className="mt-2 text-2xl font-bold tracking-tight">{task.title}</h3>
        <p className="mt-1 text-sm text-[#6b665d]">
          {task.assignee ? `For ${task.assignee.name}` : "Not given to anyone yet"}
          {task.creator && ` · from ${task.creator}`} · {timeAgo(task.created_at)}
        </p>
        {task.description && <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-[#2a2722]">{task.description}</p>}
        {task.link && (
          <Link href={task.link.type === "offer" ? `/${slug}/dashboard/offers/${task.link.id}` : `/${slug}/dashboard/projects/${task.link.id}`} className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-sm font-bold text-[#17150f] hover:border-[#17150f]">
            <FileText className="h-4 w-4" /> {task.link.type === "offer" ? "Offer" : "Project"}: {task.link.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {(task.can_move || task.can_edit) && (
        <div className="flex flex-wrap gap-2 border-y border-[#e6e2db] py-4">
          {task.can_move && task.status === "todo" && (
            <button type="button" onClick={() => go("doing")} className="inline-flex items-center gap-1.5 rounded-xl bg-[#17150f] px-4 py-2.5 text-sm font-bold text-white hover:bg-black">
              <Play className="h-4 w-4" /> Start
            </button>
          )}
          {task.can_move && task.status !== "done" && (
            <button type="button" onClick={() => go("done")} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110">
              <Check className="h-4 w-4" /> Mark done
            </button>
          )}
          {task.can_move && task.status !== "todo" && (
            <button type="button" onClick={() => go(task.status === "done" ? "doing" : "todo")} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-[#17150f]">
              <RotateCcw className="h-4 w-4" /> {task.status === "done" ? "Reopen" : "Back to To do"}
            </button>
          )}
          {task.can_edit && (
            <>
              <button type="button" onClick={() => onEdit(task)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-[#17150f]">
                <Pencil className="h-4 w-4" /> Change
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirmAction({ title: "Delete this task?", body: `"${task.title}", its comments and its files are gone for good.`, confirm: "Delete task", danger: true })
                  if (!ok) return
                  start(async () => {
                    const r = await deleteTask(slug, task.id)
                    if (r.error) return toast(r.error, "error")
                    toast("Task deleted")
                    onDeleted()
                  })
                }}
                aria-label="Delete task"
                className="inline-flex items-center px-3 py-2.5 text-[#a39d92] hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}

      <section>
        <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[#17150f]">Files · {task.files.length}</h4>
        <ul className="mt-2 divide-y divide-[#efebe5] border border-[#e6e2db]">
          {task.files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <Paperclip className="h-4 w-4 shrink-0 text-[#8a847a]" />
              <a href={`/${slug}/dashboard/tasks/${task.id}/files/${f.id}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-semibold text-[#17150f] hover:text-[var(--accent)]">
                {f.name}
              </a>
              <span className="shrink-0 text-xs text-[#8a847a]">{f.by} · {timeAgo(f.at)}</span>
              {f.can_delete && (
                <button
                  type="button"
                  aria-label={`Delete ${f.name}`}
                  onClick={async () => {
                    const ok = await confirmAction({ title: "Delete this file?", body: f.name, confirm: "Delete file", danger: true })
                    if (!ok) return
                    const r = await deleteFile(slug, task.id, f.id)
                    if (r.error) return toast(r.error, "error")
                    setTask({ ...task, files: task.files.filter((x) => x.id !== f.id) })
                    toast("File deleted")
                  }}
                  className="p-1 text-[#a39d92] hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
          {task.files.length === 0 && <li className="px-3 py-3 text-sm text-[#a39d92]">No files yet.</li>}
        </ul>
        <input
          ref={fileInput}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.heic,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (!file) return
            if (file.size > 10 * 1024 * 1024) return toast("That file is bigger than 10 MB.", "error")
            const form = new FormData()
            form.append("file", file)
            start(async () => {
              const r = await addFile(slug, task.id, form)
              if (!r.data) return toast(r.error ?? Object.values(r.errors ?? {})[0] ?? "Couldn't add the file.", "error")
              setTask((t) => (t ? { ...t, files: [...t.files, r.data as TaskDetail["files"][number]] } : t))
              toast("File added")
            })
          }}
        />
        <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-sm font-bold text-[#17150f] hover:border-[#17150f] disabled:opacity-50">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Add a file
        </button>
        <span className="ml-2 text-xs text-[#8a847a]">Photo, PDF, Word or Excel, up to 10 MB</span>
      </section>

      <section>
        <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[#17150f]">Comments · {task.comments.length}</h4>
        <ul className="mt-3 space-y-3">
          {task.comments.map((c) => (
            <li key={c.id} className={`rounded-xl border-l-4 px-3.5 py-2.5 ${c.mine ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_5%,white)]" : "border-[#d9d4cb] bg-[#faf8f5]"}`}>
              <p className="text-xs font-bold text-[#5a554d]">
                {c.by} <span className="font-medium text-[#a39d92]">· {timeAgo(c.at)}</span>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] text-[#17150f]">{c.body}</p>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const body = comment.trim()
            if (!body) return
            start(async () => {
              const r = await addComment(slug, task.id, body)
              if (!r.data) return toast(r.error ?? "Couldn't add the comment.", "error")
              setTask((t) => (t ? { ...t, comments: [...t.comments, r.data as TaskDetail["comments"][number]] } : t))
              setComment("")
            })
          }}
          className="mt-3 flex items-end gap-2"
        >
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={2000} placeholder="Add an update, e.g. Called the buyer, visiting Sunday" aria-label="Add a comment" className="min-w-0 flex-1 resize-none rounded-xl border border-[#d9d4cb] bg-white px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
          <button type="submit" disabled={busy || !comment.trim()} aria-label="Send comment" className="rounded-xl flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--accent)] text-white disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  )
}

/** New task, or changing one: what, for whom, by when, how urgent, about which offer or project. */
function TaskForm({ slug, task, preset, options, onDone }: { slug: string; task: TaskDetail | null; preset?: { offer_id: number | null; project_id: number | null }; options: TaskOptions; onDone: () => void }) {
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [assignee, setAssignee] = useState<string>(task?.assignee_id ? String(task.assignee_id) : "")
  const [due, setDue] = useState(task?.due_on ?? "")
  const [priority, setPriority] = useState<"normal" | "urgent">(task?.priority ?? "normal")
  const initialLink = task ? (task.offer_id ? "offer" : task.project_id ? "project" : "none") : preset?.offer_id ? "offer" : preset?.project_id ? "project" : "none"
  const [linkType, setLinkType] = useState<"none" | "offer" | "project">(initialLink)
  const [offer, setOffer] = useState<string>(String(task?.offer_id ?? preset?.offer_id ?? ""))
  const [project, setProject] = useState<string>(String(task?.project_id ?? preset?.project_id ?? ""))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()
  const field = "mt-1.5 block w-full rounded-xl border border-[#d9d4cb] bg-white px-3.5 py-3 text-[15px] text-[#17150f] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
  const label = "text-xs font-bold uppercase tracking-[0.12em] text-[#6b665d]"
  const staff = options.people.filter((p) => p.role === "staff")
  const agents = options.people.filter((p) => p.role === "agent")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fields: TaskFields = {
          title,
          description: description.trim() || null,
          assignee_id: assignee ? Number(assignee) : null,
          due_on: due || null,
          priority,
          offer_id: linkType === "offer" && offer ? Number(offer) : null,
          project_id: linkType === "project" && project ? Number(project) : null,
        }
        start(async () => {
          const r = task ? await updateTask(slug, task.id, fields) : await createTask(slug, fields)
          if (r.errors) return setErrors(r.errors)
          if (r.error) return toast(r.error, "error")
          const who = options.people.find((p) => String(p.id) === assignee)
          toast(task ? "Task saved" : who && !who.you ? `Task given to ${who.name}. They'll get an email.` : "Task added")
          onDone()
        })
      }}
      className="space-y-5"
    >
      <label className="block">
        <span className={label}>What needs doing</span>
        <input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Collect Juliecor's payslip" className={field} />
        {errors.title && <span className="mt-1.5 block text-sm font-semibold text-red-700">{errors.title}</span>}
      </label>
      <label className="block">
        <span className={label}>Details (optional)</span>
        <textarea rows={3} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} className={`${field} resize-y`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Give it to</span>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={field}>
            <option value="">Nobody yet</option>
            {staff.length > 0 && (
              <optgroup label="Staff">
                {staff.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.you ? " (you)" : ""}
                  </option>
                ))}
              </optgroup>
            )}
            {agents.length > 0 && (
              <optgroup label="Agents">
                {agents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {errors.assignee_id && <span className="mt-1.5 block text-sm font-semibold text-red-700">{errors.assignee_id}</span>}
        </label>
        <label className="block">
          <span className={label}>Due date (optional)</span>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} />
        </label>
      </div>
      <fieldset>
        <legend className={label}>Priority</legend>
        <div className="mt-1.5 flex gap-2">
          {(["normal", "urgent"] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPriority(p)} aria-pressed={priority === p} className={`rounded-xl inline-flex items-center gap-1.5 border-2 px-4 py-2 text-sm font-bold transition ${priority === p ? (p === "urgent" ? "border-red-600 bg-red-50 text-red-700" : "border-[#17150f] bg-[#17150f] text-white") : "border-[#d9d4cb] bg-white text-[#3d3a34] hover:border-[#17150f]"}`}>
              {p === "urgent" && <Flag className="h-3.5 w-3.5" />}
              {p === "urgent" ? "Urgent" : "Normal"}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className={label}>About (optional)</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {(["none", "offer", "project"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setLinkType(k)} aria-pressed={linkType === k} className={`rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition ${linkType === k ? "border-[var(--accent)] bg-white text-[#17150f]" : "border-[#d9d4cb] bg-white text-[#3d3a34] hover:border-[#17150f]"}`}>
              {k === "none" ? "Nothing" : k === "offer" ? "A buyer's offer" : "A project"}
            </button>
          ))}
        </div>
        {linkType === "offer" && (
          <select value={offer} onChange={(e) => setOffer(e.target.value)} required aria-label="Which offer" className={field}>
            <option value="">Choose the offer…</option>
            {options.offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        {linkType === "project" && (
          <select value={project} onChange={(e) => setProject(e.target.value)} required aria-label="Which project" className={field}>
            <option value="">Choose the project…</option>
            {options.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </fieldset>
      <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {task ? "Save task" : "Add task"}
      </button>
      <p className="text-xs text-[#8a847a]">Add files and comments once the task is made.</p>
    </form>
  )
}
