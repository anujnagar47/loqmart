"use client"

import { useEffect } from "react"
import { Check } from "lucide-react"
import { useInquiryStore } from "@/lib/store"
import { InquiryPanel } from "@/components/inquiry/InquiryPanel"

export function InquiryOverlay() {
  const toast = useInquiryStore(s => s.toast)
  const dismiss = useInquiryStore(s => s.dismissToast)
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(dismiss, 2600)
    return () => window.clearTimeout(timer)
  }, [toast, dismiss])
  return <>
    <InquiryPanel />
    {toast && <div role="status" className="fixed bottom-20 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-md bg-[#1a1c1c] px-4 py-3 text-sm font-medium text-white shadow-lg"><Check size={16} className="text-[#fcd020]" />{toast}</div>}
  </>
}
