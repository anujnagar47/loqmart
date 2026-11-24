"use client"

export type MarketplaceEvent = "page_view" | "product_view" | "product_click" | "quick_view" | "product_engagement" | "search_click" | "search_submit" | "category_view" | "state_view" | "seller_view" | "add_to_cart" | "wishlist_add" | "wishlist_remove" | "customization_inquiry"

const CONSENT_KEY = "loqmart-analytics-consent"
const SESSION_KEY = "loqmart-analytics-session"
const VISITOR_KEY = "loqmart-analytics-visitor"

function idFor(key: string) {
  let value = localStorage.getItem(key)
  if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value) }
  return value
}

function context() {
  let location: any = {}
  try { location = JSON.parse(localStorage.getItem("loqmart-delivery-location") || "{}") } catch { /* ignore invalid saved delivery preference */ }
  return { sessionId: idFor(SESSION_KEY), visitorId: idFor(VISITOR_KEY), stateCode: typeof location.state === "string" ? location.state : (typeof location.stateCode === "string" ? location.stateCode : null), pincode: typeof location.pincode === "string" ? location.pincode : null }
}

export function recordAdEvent(campaignId: string, eventType: "impression" | "click") {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return
  try {
    const body=JSON.stringify({campaignId,eventType,...context()})
    void fetch("/api/ads/events",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true})
  } catch { /* ad measurement must not block navigation */ }
}

export function hasAnalyticsConsent() {
  return typeof window !== "undefined" && localStorage.getItem(CONSENT_KEY) === "accepted"
}

export function trackMarketplaceEvent(eventType: MarketplaceEvent, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return
  try {
    const body = JSON.stringify({ ...context(), eventType, ...data })
    if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics/events", new Blob([body], { type: "application/json" }))
    else void fetch("/api/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
  } catch { /* telemetry is best effort */ }
}

export function trackGuestIntent(itemType: "cart" | "wishlist", items: Array<{ productId: string; quantity: number; variantId?: string | null }>) {
  if (!hasAnalyticsConsent()) return
  try {
    const body = JSON.stringify({ ...context(), itemType, items })
    void fetch("/api/analytics/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body, keepalive: true })
  } catch { /* telemetry is best effort */ }
}

export function startProductEngagement(productSlug: string) {
  if (!hasAnalyticsConsent()) return () => {}
  const started = Date.now()
  let sent = false
  const send = () => {
    if (sent) return
    sent = true
    trackMarketplaceEvent("product_engagement", { productSlug, durationMs: Math.min(Date.now() - started, 30 * 60 * 1000) })
  }
  document.addEventListener("visibilitychange", send, { once: true })
  return () => { document.removeEventListener("visibilitychange", send); send() }
}
