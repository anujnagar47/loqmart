"use client"

import { useEffect, useState, useCallback } from "react"
import { Check, AlertCircle } from "lucide-react"

export function Toast({ message, type = "success", onDone }: { message: string; type?: "success" | "error"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, type === "error" ? 4000 : 2600)
    return () => clearTimeout(t)
  }, [onDone, type])

  return (
    <div className="fixed top-5 right-5 z-[100]">
      <div
        className="flex items-center gap-3 text-white text-[13px] font-semibold px-4 py-3 rounded-2xl shadow-2xl max-w-sm"
        style={{
          background: type === "error" ? "#b91c1c" : "#1a1c1c",
          borderLeft: `3px solid ${type === "error" ? "#fecaca" : "#fcd020"}`,
        }}
      >
        {type === "error" ? <AlertCircle size={14} className="shrink-0" /> : <Check size={13} className="text-[#fcd020] shrink-0" />}
        {message}
      </div>
    </div>
  )
}

/**
 * Shared toast state — replaces window.alert() for both validation errors
 * and success confirmations. Render <Toast {...toastProps} /> from the
 * value this returns wherever you call showToast/showError.
 */
export function useToast() {
  const [message, setMessage] = useState("")
  const [type, setType] = useState<"success" | "error">("success")

  const showToast = useCallback((m: string) => { setType("success"); setMessage(m) }, [])
  const showError = useCallback((m: string) => { setType("error"); setMessage(m) }, [])
  const clear = useCallback(() => setMessage(""), [])

  return {
    toastProps: message ? { message, type, onDone: clear } : null,
    showToast,
    showError,
  }
}
