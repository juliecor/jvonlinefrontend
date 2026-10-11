"use server"

import { revalidatePath } from "next/cache"
import { ApiError, api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import type { TaskComment, TaskDetail, TaskFile, TaskFields } from "./types"

/** errors: Laravel's, one message per field. */
export type TaskResult<T = undefined> = { error?: string; errors?: Record<string, string>; data?: T }

async function call<T>(slug: string, path: string, method: "GET" | "POST" | "DELETE", body?: unknown, refresh = true): Promise<TaskResult<T>> {
  const { token } = await requireRealtyUser(slug)
  try {
    const data = await api<T>(`/realty/tasks${path}`, { method, token, body })
    if (refresh) revalidatePath(`/${slug}/dashboard`, "layout")
    return { data }
  } catch (e) {
    if (e instanceof ApiError && Object.keys(e.errors).length) return { errors: Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])) }
    return { error: errorMessage(e) }
  }
}

export async function loadTask(slug: string, id: number) {
  return call<TaskDetail>(slug, `/${id}`, "GET", undefined, false)
}

export async function createTask(slug: string, fields: TaskFields) {
  return call<{ id: number }>(slug, "", "POST", fields)
}

export async function updateTask(slug: string, id: number, fields: TaskFields) {
  return call(slug, `/${id}`, "POST", fields)
}

export async function moveTask(slug: string, id: number, status: "todo" | "doing" | "done") {
  return call(slug, `/${id}/status`, "POST", { status })
}

export async function deleteTask(slug: string, id: number) {
  return call(slug, `/${id}`, "DELETE")
}

export async function addComment(slug: string, id: number, body: string) {
  return call<TaskComment>(slug, `/${id}/comments`, "POST", { body })
}

export async function addFile(slug: string, id: number, form: FormData) {
  return call<TaskFile>(slug, `/${id}/files`, "POST", form)
}

export async function deleteFile(slug: string, id: number, file: number) {
  return call(slug, `/${id}/files/${file}`, "DELETE")
}
