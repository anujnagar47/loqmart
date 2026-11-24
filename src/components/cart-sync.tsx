"use client"

import { useEffect, useRef, useState } from "react"
import { create } from "zustand"
import { createClient } from "@/lib/supabase/client"
import { useCartStore } from "@/lib/store"
import { fetchServerCart, mergeGuestCartToServer } from "@/lib/cart-sync"

interface CartSyncStatus { error: string | null; retryCount: number; setError: (error: string | null) => void; retry: () => void }
export const useCartSyncStatus = create<CartSyncStatus>(set => ({ error: null, retryCount: 0, setError: error => set({ error }), retry: () => set(state => ({ error: null, retryCount: state.retryCount + 1 })) }))

export function CartSync() {
  const mergedForUserId = useRef<string | null>(null)
  const retryCount = useCartSyncStatus(state => state.retryCount)

  useEffect(() => {
    const supabase = createClient()
    let active = true
    async function handleSignedIn(userId: string) {
      if (mergedForUserId.current === userId) return
      mergedForUserId.current = userId
      try {
        const localItems = useCartStore.getState().items
        const synced = localItems.length > 0 ? await mergeGuestCartToServer(localItems) : await fetchServerCart()
        if (!active) return
        useCartStore.getState().replaceItems(synced)
        useCartStore.getState().setUserId(userId)
        useCartSyncStatus.getState().setError(null)
      } catch (error) {
        mergedForUserId.current = null
        useCartSyncStatus.getState().setError(error instanceof Error ? error.message : "Cart sync failed. Your local cart is saved; retry to sync it.")
      }
    }

    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active) return
      if (error) { useCartSyncStatus.getState().setError("Could not check your cart sync status. Retry to sync your cart."); return }
      if (session?.user) void handleSignedIn(session.user.id)
    }).catch(() => useCartSyncStatus.getState().setError("Could not check your cart sync status. Retry to sync your cart."))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void handleSignedIn(session.user.id)
      else {
        mergedForUserId.current = null
        useCartStore.getState().setUserId(null)
        useCartSyncStatus.getState().setError(null)
      }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [retryCount])

  return null
}

export function CartSyncStatusBanner() {
  const error = useCartSyncStatus(state => state.error)
  const retry = useCartSyncStatus(state => state.retry)
  if (!error) return null
  return <div role="status" className="fixed left-3 right-3 top-16 z-[90] mx-auto flex max-w-xl items-center justify-between gap-3 rounded border border-red-300 bg-white p-3 text-sm text-red-800 shadow-lg"><span>{error} Your local items are preserved.</span><button type="button" onClick={retry} className="min-h-11 shrink-0 rounded bg-[#fcd020] px-4 font-semibold text-[#231b00]">Retry sync</button></div>
}
