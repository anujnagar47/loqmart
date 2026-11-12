import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const GUEST_WISHLIST_KEY = "loqmart_guest_wishlist"

function readGuestWishlist(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]")
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []
  } catch { return [] }
}

export function isGuestWishlisted(productId: string): boolean {
  return readGuestWishlist().includes(productId)
}

/**
 * Toggles a product in the signed-in user's wishlist, persisted to
 * Supabase, or in local storage for guests. Shared by
 * every place a wishlist heart is rendered (product cards across all
 * listing pages, the product detail page) so the real add/remove logic
 * lives in exactly one place.
 */
export function useWishlist() {
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function toggleWishlist(productId: string, isCurrentlyWishlisted: boolean): Promise<boolean | null> {
    setPendingId(productId)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        const ids = readGuestWishlist()
        const nextIds = isCurrentlyWishlisted ? ids.filter(id => id !== productId) : [...new Set([...ids, productId])]
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(nextIds))
        return !isCurrentlyWishlisted
      }

      if (isCurrentlyWishlisted) {
        const { error } = await supabase.from("wishlists").delete()
          .eq("user_id", session.user.id).eq("product_id", productId)
        if (error) throw error
        return false
      } else {
        const { error } = await supabase.from("wishlists").insert({ user_id: session.user.id, product_id: productId })
        if (error) throw error
        return true
      }
    } finally {
      setPendingId(null)
    }
  }

  return { toggleWishlist, wishlistPendingId: pendingId }
}
