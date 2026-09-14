import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Toggles a product in the signed-in user's wishlist, persisted to
 * Supabase. Redirects to /auth if the caller isn't signed in. Shared by
 * every place a wishlist heart is rendered (product cards across all
 * listing pages, the product detail page) so the real add/remove logic
 * lives in exactly one place.
 */
export function useWishlist() {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function toggleWishlist(productId: string, isCurrentlyWishlisted: boolean): Promise<boolean | null> {
    setPendingId(productId)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push("/auth")
        return null
      }

      if (isCurrentlyWishlisted) {
        await supabase.from("wishlists").delete()
          .eq("user_id", session.user.id).eq("product_id", productId)
        return false
      } else {
        await supabase.from("wishlists").insert({ user_id: session.user.id, product_id: productId })
        return true
      }
    } finally {
      setPendingId(null)
    }
  }

  return { toggleWishlist, wishlistPendingId: pendingId }
}
