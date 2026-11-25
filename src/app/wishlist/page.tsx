"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Heart, Loader2, MessageSquareText, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useInquiryStore } from "@/lib/store"
import type { Product } from "@/types/database"

const GUEST_WISHLIST_KEY = "loqmart_guest_wishlist"

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const addInquiry = useInquiryStore(state => state.addItem)
  const openInquiry = useInquiryStore(state => state.openDrawer)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data, error: wishlistError } = await supabase.from("wishlists")
          .select("product:products(*, sellers(business_name))")
          .eq("user_id", session.user.id)
        if (wishlistError) {
          if (!cancelled) setError("We could not load your wishlist. Please retry.")
        } else if (!cancelled) {
          setProducts((data || []).map(row => row.product).filter(Boolean) as unknown as Product[])
        }
      } else {
        let ids: string[] = []
        try {
          const value: unknown = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]")
          if (Array.isArray(value)) ids = [...new Set(value.filter((id): id is string => typeof id === "string"))]
        } catch { /* Empty guest wishlist when local storage is unavailable. */ }
        if (ids.length) {
          const { data, error: productsError } = await supabase.from("products").select("*, sellers(business_name)").in("id", ids).eq("approval_status", "approved")
          if (productsError) {
            if (!cancelled) setError("We could not load your wishlist. Please retry.")
          } else if (!cancelled) {
            const byId = new Map((data || []).map(product => [product.id, product]))
            setProducts(ids.map(id => byId.get(id)).filter(Boolean) as unknown as Product[])
          }
        }
      }
      if (!cancelled) setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [])

  async function remove(productId: string) {
    setError("")
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { error: deleteError } = await supabase.from("wishlists").delete().eq("user_id", session.user.id).eq("product_id", productId)
      if (deleteError) { setError("We could not remove that product. Please try again."); return }
    } else {
      try {
        const ids = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]") as unknown[]
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids.filter(id => id !== productId)))
      } catch { setError("Browser storage is unavailable, so this item could not be removed."); return }
    }
    setProducts(current => current.filter(product => product.id !== productId))
  }

  return <main className="min-h-[70vh] bg-[#f8f7f2] px-4 py-8 sm:px-6"><div className="mx-auto max-w-6xl">
    <p className="text-xs font-bold uppercase tracking-widest text-[#725c00]">Saved for later</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-black tracking-tight text-[#1a1c1c]">My wishlist</h1><p className="mt-2 text-sm text-[#4d4632]">Keep track of products you may want to request or buy when checkout opens.</p></div><Link href="/account?tab=wishlist" className="text-sm font-semibold text-[#725c00] underline">Account wishlist</Link></div>
    {error&&<p role="alert" className="mt-5 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {loading ? <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#725c00]"/></div> : products.length===0 ? <section className="mt-8 rounded-lg border border-dashed border-[#d0c6ac] bg-white px-5 py-14 text-center"><Heart className="mx-auto h-8 w-8 text-[#725c00]"/><h2 className="mt-4 text-lg font-bold text-[#1a1c1c]">Your wishlist is empty</h2><p className="mt-2 text-sm text-[#4d4632]">Use the heart on a product to save it here.</p><Link href="/category" className="mt-5 inline-flex items-center gap-2 rounded bg-[#fcd020] px-4 py-2.5 text-sm font-bold text-[#231b00]">Explore products <ArrowRight size={15}/></Link></section> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map(product=><article key={product.id} className="overflow-hidden rounded-lg border border-[#d0c6ac] bg-white"><Link href={`/product/${product.slug}`} className="relative block aspect-[4/3] bg-white">{product.images?.[0]&&<Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-3"/>}</Link><div className="p-4"><Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-10 text-sm font-bold text-[#1a1c1c] hover:underline">{product.name}</Link><p className="mt-2 text-xs text-[#4d4632]">{product.sellers?.business_name||"LoqMart seller"}{product.state_code?` · ${product.state_code}`:""}</p><div className="mt-4 flex gap-2"><button onClick={()=>{addInquiry(product);openInquiry()}} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded bg-[#fcd020] px-2 text-xs font-bold text-[#231b00]"><MessageSquareText size={14}/>Add to inquiry</button><button onClick={()=>void remove(product.id)} aria-label={`Remove ${product.name} from wishlist`} className="min-h-10 rounded border border-[#d0c6ac] px-3 text-[#4d4632] hover:text-red-700"><Trash2 size={15}/></button></div></div></article>)}</div>}
  </div></main>
}
