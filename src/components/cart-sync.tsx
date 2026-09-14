"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useCartStore } from "@/lib/store"
import { fetchServerCart, mergeGuestCartToServer } from "@/lib/cart-sync"

/**
 * Bridges the Zustand/localStorage cart with the server-persisted one.
 * Mounted once at the app root (see ConditionalLayout) — renders nothing.
 * On sign-in: merges whatever was in the local guest cart into the
 * server cart, then replaces local state with the authoritative merged
 * result. On sign-out: reverts to local-only mode (existing local items
 * are left alone — signing out shouldn't empty a visible cart).
 */
export function CartSync() {
  const mergedForUserId = useRef<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function handleSignedIn(userId: string) {
      if (mergedForUserId.current === userId) return
      mergedForUserId.current = userId
      const localItems = useCartStore.getState().items
      const merged = localItems.length > 0
        ? await mergeGuestCartToServer(localItems)
        : await fetchServerCart()
      useCartStore.getState().replaceItems(merged)
      useCartStore.getState().setUserId(userId)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleSignedIn(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSignedIn(session.user.id)
      } else {
        mergedForUserId.current = null
        useCartStore.getState().setUserId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
