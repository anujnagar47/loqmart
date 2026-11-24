"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { trackMarketplaceEvent } from "@/lib/analyticsTracker"

export function PageVisitTracker(){
  const pathname=usePathname()
  useEffect(()=>{
    if(!pathname||pathname.startsWith("/admin")||pathname.startsWith("/seller/dashboard"))return
    trackMarketplaceEvent("page_view",{source:pathname})
  },[pathname])
  return null
}
