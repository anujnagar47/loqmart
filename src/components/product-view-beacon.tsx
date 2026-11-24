"use client"

import { useEffect } from "react"
import { startProductEngagement,trackMarketplaceEvent } from "@/lib/analyticsTracker"

export function ProductViewBeacon({slug}:{slug:string}){
  useEffect(()=>{
    trackMarketplaceEvent("product_view",{productSlug:slug})
    return startProductEngagement(slug)
  },[slug])
  return null
}
