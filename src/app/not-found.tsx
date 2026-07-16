"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Search, Home, MapPin } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#eeece8" }}>
      <div className="max-w-lg w-full text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}>
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-8"
            style={{ background: "#fcd020" }}>
            <Search className="w-14 h-14 text-[#1a1c1c]" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1c1c]/35 mb-3">404 Not Found</p>
          <h1 className="text-[32px] font-extrabold text-[#1a1c1c] tracking-tight mb-3">
            This page isn't on the map.
          </h1>
          <p className="text-[14px] text-[#1a1c1c]/50 leading-relaxed mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved. Try exploring India's best handmade products instead.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link href="/"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-black text-[#1a1c1c]"
                style={{ background: "#fcd020" }}>
                <Home size={15} /> Back to Home
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link href="/india-map"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold text-[#1a1c1c] transition-colors"
                style={{ border: "1px solid rgba(26,28,28,0.14)", background: "white" }}>
                <MapPin size={15} /> Explore India Map
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
