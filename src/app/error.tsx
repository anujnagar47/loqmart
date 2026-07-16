"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => { console.error("Page error:", error) }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#eeece8" }}>
      <div className="max-w-md w-full text-center">
        <motion.div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(220,38,38,0.08)" }}
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}>
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h1 className="text-[24px] font-extrabold text-[#1a1c1c] tracking-tight mb-3">Something went wrong</h1>
          <p className="text-[13px] text-[#1a1c1c]/50 mb-2 leading-relaxed">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-[#1a1c1c]/30 mb-6">Error ID: {error.digest}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <motion.button onClick={reset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-black text-[#1a1c1c]"
              style={{ background: "#fcd020" }}>
              <RefreshCw size={14} /> Try Again
            </motion.button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link href="/"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold text-[#1a1c1c] transition-colors"
                style={{ border: "1px solid rgba(26,28,28,0.14)", background: "white" }}>
                <Home size={14} /> Back to Home
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
