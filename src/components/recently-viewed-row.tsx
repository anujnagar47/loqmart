"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getRecentlyViewedIds } from "@/lib/recently-viewed"
import { HomeProductRow } from "@/components/home-product-row"
import type { Product } from "@/types/database"

export function RecentlyViewedRow({ excludeId }: { excludeId?: string }) {
  const [ids] = useState<string[]>(() => getRecentlyViewedIds(excludeId))
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (ids.length === 0) return

    const controller = new AbortController()
    const supabase = createClient()

    supabase
      .from("products")
      .select("*, sellers(id, business_name, swadeshi_rank, state_code)")
      .eq("approval_status", "approved")
      .in("id", ids)
      .then(({ data }) => {
        if (controller.signal.aborted || !data) return
        const byId = new Map(data.map((p) => [p.id, p as unknown as Product]))
        const ordered = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p))
        setProducts(ordered)
      })

    return () => controller.abort()
  }, [ids])

  if (products.length === 0) return null

  return (
    <HomeProductRow
      eyebrow="Your History"
      title="Recently Viewed"
      href="/category"
      hrefLabel="Browse More"
      products={products}
      tone="dark"
    />
  )
}
