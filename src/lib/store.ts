import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, CartItem as CartItemType } from '@/types/database'

interface CartStore {
  items: CartItemType[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const items = get().items
        const existingItem = items.find(item => item.product_id === product.id)
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.product_id === product.id
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
              product
            }]
          })
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.product_id !== productId) })
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map(item =>
            item.product_id === productId ? { ...item, quantity } : item
          )
        })
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((sum, item) => {
          return sum + (item.product?.price || 0) * item.quantity
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
