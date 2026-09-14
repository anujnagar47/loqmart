import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, ProductVariant, CartItem as CartItemType } from '@/types/database'
import { cartItemPrice } from '@/lib/utils'
import { syncAddToServer, syncSetQuantityOnServer, syncRemoveFromServer, syncClearServer } from '@/lib/cart-sync'

interface CartStore {
  items: CartItemType[]
  // null = guest (localStorage-only); set once on login by <CartSync/> so
  // mutations below know whether to also push a background write to the
  // server-persisted cart. Never itself the source of truth for auth state.
  userId: string | null
  setUserId: (userId: string | null) => void
  replaceItems: (items: CartItemType[]) => void
  addItem: (product: Product, quantity?: number, variant?: ProductVariant | null) => void
  removeItem: (productId: string, variantId?: string | null) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

// Two line items are "the same" only if both the product AND the selected
// variant match — this lets two variants of the same product coexist as
// distinct cart lines rather than silently merging into one.
function sameLine(item: CartItemType, productId: string, variantId?: string | null) {
  return item.product_id === productId && (item.variant_id || null) === (variantId || null)
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,
      setUserId: (userId) => set({ userId }),
      replaceItems: (items) => set({ items }),
      addItem: (product, quantity = 1, variant = null) => {
        const items = get().items
        const variantId = variant?.id || null
        const existingItem = items.find(item => sameLine(item, product.id, variantId))

        if (existingItem) {
          set({
            items: items.map(item =>
              sameLine(item, product.id, variantId)
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          })
        } else {
          set({
            items: [...items, {
              id: crypto.randomUUID(),
              user_id: '',
              product_id: product.id,
              quantity,
              created_at: new Date().toISOString(),
              product,
              variant_id: variantId,
              variant_name: variant?.name || null,
              variant_price: variant?.price ?? null,
              variant_stock: variant?.stock ?? null,
            }]
          })
        }
        if (get().userId) syncAddToServer(product.id, variantId, quantity)
      },
      removeItem: (productId, variantId = null) => {
        set({ items: get().items.filter(item => !sameLine(item, productId, variantId)) })
        if (get().userId) syncRemoveFromServer(productId, variantId)
      },
      updateQuantity: (productId, quantity, variantId = null) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId)
          return
        }
        set({
          items: get().items.map(item =>
            sameLine(item, productId, variantId) ? { ...item, quantity } : item
          )
        })
        if (get().userId) syncSetQuantityOnServer(productId, variantId, quantity)
      },
      clearCart: () => {
        set({ items: [] })
        if (get().userId) syncClearServer()
      },
      getTotal: () => {
        return get().items.reduce((sum, item) => {
          return sum + cartItemPrice(item) * item.quantity
        }, 0)
      },
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      }
    }),
    {
      name: 'loqmart-cart'
    }
  )
)

interface UserStore {
  mode: 'handmade' | 'machine_made'
  searchQuery: string
  setMode: (mode: 'handmade' | 'machine_made') => void
  setSearchQuery: (query: string) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      mode: 'handmade',
      searchQuery: '',
      setMode: (mode) => set({ mode }),
      setSearchQuery: (query) => set({ searchQuery: query })
    }),
    {
      name: 'loqmart-user-preferences'
    }
  )
)
