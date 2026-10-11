import { PageHeader } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { TaskBoard } from "./board"
import type { Task, TaskOptions } from "./types"

export const metadata = { title: "Tasks" }

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ task?: string; new?: string; offer?: string; project?: string; scope?: string }> }

/**
 * jvconline.ph/<realty>/dashboard/tasks — a board of To do, In progress and
 * Done. Everyone sees the tasks given to them; staff with the Tasks section
 * see everyone's and give tasks out. ?task=<id> opens one (the email's link),
 * ?new=1&offer=<id> starts one about an offer.
 */
export default async function TasksPage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const query = await searchParams
  const { user, token } = await requireRealtyUser(slug)
  const scope = query.scope === "mine" ? "mine" : "all"
  const { manager, tasks } = await api<{ manager: boolean; tasks: Task[] }>(`/realty/tasks?scope=${scope}`, { token })
  const options = manager ? await api<TaskOptions>("/realty/tasks/options", { token }) : null

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title={manager ? "Tasks" : "My tasks"}
        lede={manager ? "Give tasks to your staff and agents, and see where each one is. Drag a card to move it." : `What ${user.realty.name} needs from you. Move a task along as you work on it, and add notes or files.`}
      />
      <div className="mt-8">
        <TaskBoard
          slug={slug}
          tasks={tasks}
          manager={manager}
          scope={scope}
          options={options}
          openTask={query.task && /^\d+$/.test(query.task) ? Number(query.task) : null}
          startNew={manager && query.new ? { offer_id: query.offer && /^\d+$/.test(query.offer) ? Number(query.offer) : null, project_id: query.project && /^\d+$/.test(query.project) ? Number(query.project) : null } : null}
        />
      </div>
    </div>
  )
}
