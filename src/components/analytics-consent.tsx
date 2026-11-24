"use client"

import { useEffect, useState } from "react"
import { trackMarketplaceEvent } from "@/lib/analyticsTracker"

const KEY = "loqmart-analytics-consent"

export function AnalyticsConsent() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setVisible(!localStorage.getItem(KEY)) }, [])
  if (!visible) return null
  const save = (value: "accepted" | "declined") => { localStorage.setItem(KEY, value); document.cookie=`loqmart_analytics_consent=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==="https:"?"; Secure":""}`; setVisible(false); if(value==="accepted")trackMarketplaceEvent("page_view",{source:window.location.pathname}) }
  return <aside className="fixed bottom-4 left-4 z-[100] max-w-lg rounded border border-[#d0c6ac] bg-white p-4 shadow-xl" aria-label="Analytics preference">
    <p className="text-sm font-bold text-[#1a1c1c]">Help improve LoqMart</p>
    <p className="mt-1 text-xs leading-5 text-[#4d4632]">Optional first-party analytics records product and search interactions and guest cart intent. Admins can review marketplace trends and session activity. Your account cart and wishlist remain available only to you and authorized marketplace administrators.</p>
    <div className="mt-3 flex gap-2"><button onClick={() => save("accepted")} className="rounded bg-[#725c00] px-3 py-2 text-xs font-bold text-white">Allow analytics</button><button onClick={() => save("declined")} className="rounded border border-[#d0c6ac] px-3 py-2 text-xs font-semibold text-[#1a1c1c]">Decline</button></div>
  </aside>
}
