import type { Card, OfferCard, PaymentCard as Payment, ProjectCard, UnitCard } from "./actions"
import { OfferCards } from "./offer-cards"
import { PaymentCard } from "./payment-card"
import { ProjectCards } from "./project-cards"
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
        return (of as Payment[]).map((p, i) => <PaymentCard key={`payment-${i}`} slug={slug} card={p} />)
      })}
    </>
  )
}
