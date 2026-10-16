import type { ActionCard as ActionCardData, Card, MapCard as MapCardData, OfferCard, PaymentCard as Payment, ProjectCard, ReportCard as ReportCardData, UnitCard } from "./actions"
import { ActionCard } from "./action-card"
import { MapCard } from "./map-card"
import { OfferCards } from "./offer-cards"
import { PaymentCard } from "./payment-card"
import { ProjectCards } from "./project-cards"
import { ReportCard } from "./report-card"
import { UnitCards } from "./unit-cards"

/**
 * Everything the AI put under an answer, kind by kind in the order it showed
 * them: units, buyers' offers, projects, payment schedules.
 * onAsk: for a card's own questions (an offer's "Write follow-up").
 */
export function AnswerCards({ slug, cards, onAsk }: { slug: string; cards: Card[]; onAsk?: (question: string) => void }) {
  const kinds = [...new Set(cards.map((c) => c.type))]
  return (
    <>
      {kinds.map((kind) => {
        const of = cards.filter((c) => c.type === kind)
        if (kind === "unit") return <UnitCards key={kind} slug={slug} cards={of as UnitCard[]} />
        if (kind === "offer") return <OfferCards key={kind} slug={slug} cards={of as OfferCard[]} onAsk={onAsk} />
        if (kind === "project") return <ProjectCards key={kind} slug={slug} cards={of as ProjectCard[]} />
        if (kind === "map") return (of as MapCardData[]).map((m) => <MapCard key={`map-${m.id}`} slug={slug} card={m} />)
        if (kind === "report") return (of as ReportCardData[]).map((r) => <ReportCard key={`report-${r.period.from}-${r.period.to}`} slug={slug} card={r} />)
        if (kind === "action") return (of as ActionCardData[]).map((a, i) => <ActionCard key={`action-${i}`} slug={slug} card={a} />)
        return (of as Payment[]).map((p, i) => <PaymentCard key={`payment-${i}`} slug={slug} card={p} />)
      })}
    </>
  )
}
