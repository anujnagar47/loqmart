import type { CartItem, Product, ProductVariant } from "@/types/database"

interface ServerCartRow {
  id: string
  user_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  created_at: string
  product: Product | null
  variant: ProductVariant | null
}

export function mapServerCartItem(row: ServerCartRow): CartItem {
  return {
    id: row.id,
    user_id: row.user_id,
    product_id: row.product_id,
    quantity: row.quantity,
    created_at: row.created_at,
    product: row.product || undefined,
    variant_id: row.variant_id,
    variant_name: row.variant?.name || null,
    variant_price: row.variant?.price ?? null,
    variant_stock: row.variant?.stock ?? null,
  }
}

async function parseCartResponse(res: Response): Promise<CartItem[]> {
  if (!res.ok) throw new Error(`Cart sync failed (${res.status}).`)
  const data = await res.json()
  if (!Array.isArray(data.items)) throw new Error("Cart sync returned an invalid response.")
  return ((data.items || []) as ServerCartRow[]).map(mapServerCartItem)
}

export async function fetchServerCart(): Promise<CartItem[]> {
  const res = await fetch("/api/cart")
  return parseCartResponse(res)
}

export async function mergeGuestCartToServer(items: CartItem[]): Promise<CartItem[]> {
  const res = await fetch("/api/cart/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map(i => ({ product_id: i.product_id, variant_id: i.variant_id || undefined, quantity: i.quantity })),
    }),
  })
  return parseCartResponse(res)
}

export function syncAddToServer(productId: string, variantId: string | null, quantity: number) {
  fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, variant_id: variantId || undefined, quantity }),
  }).catch(() => { /* best-effort background sync — local state is already updated */ })
}

export function syncSetQuantityOnServer(productId: string, variantId: string | null, quantity: number) {
  fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, variant_id: variantId || undefined, quantity }),
  }).catch(() => { /* best-effort background sync */ })
}

export function syncRemoveFromServer(productId: string, variantId: string | null) {
  fetch("/api/cart", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, variant_id: variantId || undefined }),
  }).catch(() => { /* best-effort background sync */ })
}

export function syncClearServer() {
  fetch("/api/cart?all=1", { method: "DELETE" }).catch(() => { /* best-effort background sync */ })
}
