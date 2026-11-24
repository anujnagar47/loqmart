import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, ProductVariant, CartItem as CartItemType } from '@/types/database'
import { cartItemPrice } from '@/lib/utils'
import { syncAddToServer, syncSetQuantityOnServer, syncRemoveFromServer, syncClearServer } from '@/lib/cart-sync'
import { trackMarketplaceEvent, trackGuestIntent } from '@/lib/analyticsTracker'

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
        trackMarketplaceEvent('add_to_cart', { productId: product.id, quantity, variantId: variantId || '' })
        if (!get().userId) trackGuestIntent('cart', get().items.map(item => ({ productId: item.product_id, quantity: item.quantity, variantId: item.variant_id })))
      },
      removeItem: (productId, variantId = null) => {
        set({ items: get().items.filter(item => !sameLine(item, productId, variantId)) })
        if (get().userId) syncRemoveFromServer(productId, variantId)
        else trackGuestIntent('cart', get().items.map(item => ({ productId: item.product_id, quantity: item.quantity, variantId: item.variant_id })))
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
        else trackGuestIntent('cart', get().items.map(item => ({ productId: item.product_id, quantity: item.quantity, variantId: item.variant_id })))
      },
      clearCart: () => {
        set({ items: [] })
        if (get().userId) syncClearServer()
        else trackGuestIntent('cart', [])
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

export interface InquiryItem {
  product_id: string
  name: string
  slug: string
  images: string[]
  state_code: string | null
  mode: Product['mode']
  seller_name: string | null
  requested_option: string | null
}

interface InquiryStore {
  items: InquiryItem[]
  drawerOpen: boolean
  toast: string | null
  addItem: (product: Product, requestedOption?: string | null) => void
  removeItem: (productId: string) => void
  clear: () => void
  openDrawer: () => void
  closeDrawer: () => void
  dismissToast: () => void
}

export const useInquiryStore = create<InquiryStore>()(persist((set, get) => ({
  items: [],
  drawerOpen: false,
  toast: null,
  addItem: (product, requestedOption = null) => {
    const existing = get().items.some(item => item.product_id === product.id)
    if (existing) {
      set(state => ({
        items: state.items.map(item => item.product_id === product.id && requestedOption
          ? { ...item, requested_option: requestedOption }
          : item),
        toast: 'This piece is already on your inquiry list',
      }))
      return
    }
    set(state => ({
      items: [...state.items, {
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        images: product.images || [],
        state_code: product.state_code || null,
        mode: product.mode,
        seller_name: product.sellers?.business_name || null,
        requested_option: requestedOption,
      }],
      toast: 'Added to your inquiry list',
    }))
  },
  removeItem: (productId) => set(state => ({ items: state.items.filter(item => item.product_id !== productId) })),
  clear: () => set({ items: [] }),
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  dismissToast: () => set({ toast: null }),
}), {
  name: 'loqmart-inquiry-list',
  partialize: state => ({ items: state.items }),
}))
