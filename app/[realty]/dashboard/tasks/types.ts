/** A task as the board shows it (see TaskController::row). */
export type Task = {
  id: number
  title: string
  status: "todo" | "doing" | "done"
  priority: "normal" | "urgent"
  due_on: string | null
  overdue: boolean
  assignee: { id: number; name: string; role: "staff" | "agent" } | null
  creator: string | null
  link: { type: "offer" | "project"; id: number; label: string } | null
  comment_count: number
  file_count: number
  completed_at: string | null
  created_at: string
  can_edit: boolean
  can_move: boolean
}

export type TaskComment = { id: number; body: string; by: string; mine: boolean; at: string }
export type TaskFile = { id: number; name: string; size: number; mime: string; by: string; at: string; can_delete: boolean }

export type TaskDetail = Task & { description: string | null; assignee_id: number | null; offer_id: number | null; project_id: number | null; comments: TaskComment[]; files: TaskFile[] }

/** What a new or edited task sends. */
export type TaskFields = { title: string; description: string | null; assignee_id: number | null; due_on: string | null; priority: "normal" | "urgent"; offer_id: number | null; project_id: number | null }

/** Who and what a task can be given to and linked with. */
export type TaskOptions = { people: { id: number; name: string; role: "staff" | "agent"; you: boolean }[]; projects: { id: number; name: string }[]; offers: { id: number; label: string }[] }

export const COLUMNS = [
  { status: "todo", label: "To do" },
  { status: "doing", label: "In progress" },
  { status: "done", label: "Done" },
] as const
