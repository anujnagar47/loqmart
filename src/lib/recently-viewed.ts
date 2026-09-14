const RECENTLY_VIEWED_KEY = "loqmart-recently-viewed"
const MAX_RECENTLY_VIEWED = 12

export function trackRecentlyViewed(productId: string) {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
    const ids: string[] = stored ? JSON.parse(stored) : []
    const next = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX_RECENTLY_VIEWED)
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable — recently-viewed just won't persist
  }
}

export function getRecentlyViewedIds(excludeId?: string): string[] {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
    const ids: string[] = stored ? JSON.parse(stored) : []
    return excludeId ? ids.filter((id) => id !== excludeId) : ids
  } catch {
    return []
  }
}
