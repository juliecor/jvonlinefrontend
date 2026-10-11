/** An accepted realty's accreditation period, as Laravel sends it (RealtyAccreditationController::period). */
export type Period = {
  state: "active" | "ending" | "expired" | "ended" | "open"
  from: string | null
  until: string | null
  days_left: number | null
  ended_at: string | null
  end_note: string | null
  signed_copy: {
    status: "missing" | "submitted" | "verified" | "returned" | null
    due: string | null
    overdue: boolean
    note: string | null
    document_id: number | null
    uploaded_at: string | null
  }
}

export const PERIOD_TAG = {
  active: { tone: "good", label: "Accredited" },
  ending: { tone: "warn", label: "Ends soon" },
  expired: { tone: "bad", label: "Expired" },
  ended: { tone: "bad", label: "Ended" },
  open: { tone: "good", label: "Accredited" },
} as const
