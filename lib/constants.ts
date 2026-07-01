export const PLAN_LABELS: Record<"starter" | "growth", string> = {
  starter: "Starter",
  growth: "Growth",
}

export const PLAN_PRICES: Record<"starter" | "growth", number> = {
  starter: 29,
  growth: 59,
}

export const PLAN_LOCATION_LIMITS: Record<"starter" | "growth", number> = {
  starter: 1,
  growth: 5,
}

export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const

export const REPLY_VARIATION_LABELS = [
  "Professional & Direct",
  "Warm & Conversational",
  "Short & Punchy",
] as const

export const MOTION = {
  wheel: "350ms cubic-bezier(0.16, 1, 0.3, 1)",
  cardExpand: "250ms cubic-bezier(0, 0, 0.2, 1)",
  crossFade: "150ms cubic-bezier(0, 0, 0.2, 1)",
  tabFade: "120ms cubic-bezier(0, 0, 0.2, 1)",
  dialog: "250ms cubic-bezier(0, 0, 0.2, 1)",
  buttonPress: "100ms cubic-bezier(0, 0, 0.2, 1)",
} as const
