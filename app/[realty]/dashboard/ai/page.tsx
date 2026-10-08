import { notFound } from "next/navigation"
import { ApiError, api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import type { ChatMessage, ChatSummary } from "./actions"
import { AssistantChat } from "./chat"

export const metadata = { title: "AI assistant" }

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ chat?: string }> }

/** jvconline.ph/<realty>/dashboard/ai — ask the realty's AI assistant about projects, units, offers and agents. */
export default async function AssistantPage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const { chat: chatParam } = await searchParams
  const { user, token } = await requireRealtyUser(slug)
  const { name, chats } = await api<{ name: string; chats: ChatSummary[] }>("/realty/assistant/chats", { token })

  let open: { id: number; messages: ChatMessage[] } | null = null
  if (chatParam && /^\d+$/.test(chatParam)) {
    try {
      open = await api<{ id: number; messages: ChatMessage[] }>(`/realty/assistant/chats/${chatParam}`, { token })
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) throw e
      notFound()
    }
  }

  return <AssistantChat key={open?.id ?? "new"} slug={slug} name={name} firstName={user.name.split(" ")[0]} isAgent={user.role === "agent"} chats={chats} chatId={open?.id ?? null} initial={open?.messages ?? []} />
}
