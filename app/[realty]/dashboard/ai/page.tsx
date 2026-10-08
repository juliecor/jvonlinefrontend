import { notFound, redirect } from "next/navigation"
import { ApiError, api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { isBroker } from "@/lib/realty-roles"
import type { ChatMessage, ChatSummary } from "./actions"
import { AssistantChat } from "./chat"

export const metadata = { title: "AI assistant" }

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ chat?: string }> }

/** jvconline.ph/<realty>/dashboard/ai — ask the realty's AI assistant about projects, units, offers and agents. */
export default async function AssistantPage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const { chat: chatParam } = await searchParams
  const { user, token } = await requireRealtyUser(slug)
  if (isBroker(user)) redirect(`/${slug}/dashboard`)
  // attention: how many things wait for this person (null if it couldn't be counted).
  const { name, chats, attention } = await api<{ name: string; chats: ChatSummary[]; attention: number | null }>("/realty/assistant/chats", { token })

  let open: { id: number; messages: ChatMessage[] } | null = null
  if (chatParam && /^\d+$/.test(chatParam)) {
    try {
      open = await api<{ id: number; messages: ChatMessage[] }>(`/realty/assistant/chats/${chatParam}`, { token })
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) throw e
      notFound()
    }
  }

  return <AssistantChat key={open?.id ?? "new"} slug={slug} name={name} firstName={user.name.split(" ")[0]} isAgent={user.role === "agent"} chats={chats} chatId={open?.id ?? null} initial={open?.messages ?? []} attention={attention ?? null} />
}
