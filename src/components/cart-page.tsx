"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Package, Plus, Trash2 } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { cartItemPrice, cartItemStock, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function CartPage() {
  const items = useCartStore(state => state.items)
  const updateQuantity = useCartStore(state => state.updateQuantity)
  const removeItem = useCartStore(state => state.removeItem)
  const subtotal = useCartStore(state => state.getTotal())

  if (!items.length) return <main className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 text-center"><Package className="mb-4 h-9 w-9 text-[#725c00]" /><h1 className="text-2xl font-bold tracking-tight">Your cart is empty</h1><p className="mb-5 mt-2 text-sm text-[#4d4632]">Add products to your cart to reserve them.</p><Link href="/category" className="inline-flex min-h-11 items-center rounded bg-[#fcd020] px-5 text-sm font-bold text-[#231b00]">Browse products</Link></main>

  return <main className="min-h-[55vh] bg-[#f3f3f3] px-4 py-6 pb-24 sm:px-6"><div className="mx-auto max-w-5xl"><h1 className="mb-5 text-2xl font-bold tracking-tight text-[#1a1c1c]">Your cart <span className="text-base font-normal text-[#4d4632]">({items.reduce((count, item) => count + item.quantity, 0)} items)</span></h1><div className="grid gap-5 lg:grid-cols-[1fr_320px]"><section className="space-y-3">{items.map(item => {
    const stock = cartItemStock(item)
    const image = item.product?.images?.[0]
    return <article key={item.id} className="flex gap-3 rounded border border-[#d0c6ac] bg-white p-3 sm:gap-4 sm:p-4"><div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-[#eeeeee] sm:h-24 sm:w-24">{image && item.product ? <Image src={image} alt={item.product.name} width={96} height={96} sizes="(max-width: 640px) 80px, 96px" className="h-full w-full object-cover" /> : null}</div><div className="min-w-0 flex-1"><Link href={`/product/${item.product?.slug || ""}`} className="line-clamp-2 text-sm font-semibold text-[#1a1c1c] hover:underline">{item.product?.name || "Product unavailable"}</Link>{item.variant_name && <p className="mt-1 text-xs text-[#4d4632]">Option: {item.variant_name}</p>}<p className="mt-1 text-sm font-bold text-[#1a1c1c]">{formatCurrency(cartItemPrice(item))} <span className="font-normal text-[#4d4632]">each</span></p><div className="mt-3 flex flex-wrap items-center gap-2"><div className="flex h-11 items-center rounded border border-[#d0c6ac]"><button type="button" aria-label="Decrease quantity" onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)} className="flex h-11 w-11 items-center justify-center"><Minus size={15} /></button><span className="min-w-8 text-center text-sm">{item.quantity}</span><button type="button" aria-label="Increase quantity" disabled={item.quantity >= stock} onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)} className="flex h-11 w-11 items-center justify-center disabled:opacity-40"><Plus size={15} /></button></div><button type="button" onClick={() => removeItem(item.product_id, item.variant_id)} className="inline-flex min-h-11 items-center gap-1.5 px-2 text-xs font-semibold text-red-700"><Trash2 size={14} />Remove</button>{stock <= 0 && <span className="text-xs font-medium text-red-700">Currently unavailable</span>}</div></div><p className="shrink-0 text-sm font-bold text-[#1a1c1c]">{formatCurrency(cartItemPrice(item) * item.quantity)}</p></article>
  })}</section><aside className="h-fit rounded border border-[#d0c6ac] bg-white p-5 lg:sticky lg:top-24"><h2 className="mb-4 font-bold">Order summary</h2><div className="flex justify-between border-t border-[#d0c6ac] py-4 text-sm"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><p className="mb-3 text-xs leading-5 text-[#4d4632]">Final availability and delivery details are confirmed after you submit your reservation.</p><Link href="/checkout" aria-disabled={items.some(item => cartItemStock(item) < item.quantity)} className={`inline-flex min-h-12 w-full items-center justify-center rounded bg-[#fcd020] px-4 text-center text-sm font-bold text-[#231b00] ${items.some(item => cartItemStock(item) < item.quantity) ? "pointer-events-none opacity-50" : ""}`}>Proceed to Reserve</Link></aside></div></div></main>
}
