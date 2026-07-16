"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { BadgeCheck, MapPin, Shield, ArrowRight } from "lucide-react"
import { useRef, useEffect, useState } from "react"

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const duration = 1400
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame((t) => step(t, startTime))
    }
    requestAnimationFrame((t) => step(t, t))
  }, [inView, target])

  return <span ref={ref}>{count.toLocaleString("en-IN")}{suffix}</span>
}

export function Hero() {
  return (
    <section className="relative min-h-[94vh] w-full flex flex-col justify-center px-4 md:px-20 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=1920&h=1080&fit=crop"
          alt="Indian artisan craftsmanship"
          className="w-full h-full object-cover"
        />
        {/* Layered gradient: strong left, fade to transparent right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0f0f]/95 via-[#0e0f0f]/65 to-transparent" />
        {/* Subtle bottom vignette for stats legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f0f]/60 via-transparent to-transparent" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl pt-20">
        <motion.h1
          className="text-white font-extrabold leading-[1.05] mb-5"
          style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)", letterSpacing: "-0.025em" }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
        >
          Shop India.<br />
          Support India.<br />
          <span className="text-[#fcd020]">Build India.</span>
        </motion.h1>

        <motion.p
          className="text-white/60 text-base md:text-lg mb-10 max-w-md leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.25 }}
        >
          GST-verified artisans, sellers, and MSMEs - organised state by state. Every product proudly Made in India.
        </motion.p>

        <motion.div
          className="flex flex-wrap gap-3 mb-12"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.4 }}
        >
          <Link href="/india-map">
            <motion.button
              className="flex items-center gap-2.5 bg-[#fcd020] text-[#1a1c1c] px-7 py-3.5 font-black text-xs uppercase tracking-widest rounded-xl"
              whileHover={{ scale: 1.03, boxShadow: "0 16px 40px rgba(252,208,32,0.4)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <MapPin className="w-4 h-4" /> Choose Your State
            </motion.button>
          </Link>
          <Link href="/category">
            <motion.button
              className="flex items-center gap-2.5 border border-white/25 text-white px-7 py-3.5 font-bold text-xs uppercase tracking-widest rounded-xl hover:border-white/50 hover:bg-white/8 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              Explore Products <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust chips */}
        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          {[
            { icon: BadgeCheck, text: "GST Verified Sellers" },
            { icon: Shield,     text: "Swadeshi Ranked" },
            { icon: MapPin,     text: "State-wise Discovery" },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 border border-white/15 text-white/55 text-[11px] font-semibold px-3 py-1.5 rounded-full">
              <Icon className="w-3 h-3 text-[#fcd020]" /> {text}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Stats strip */}
      <motion.div
        className="relative z-10 mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.55 }}
      >
        {[
          { value: 10000, suffix: "+", label: "Products" },
          { value: 36,    suffix: "",  label: "States" },
          { value: 500,   suffix: "+", label: "Verified Sellers" },
          { value: 12,    suffix: "",  label: "Categories" },
        ].map(({ value, suffix, label }) => (
          <div key={label} className="border border-white/12 rounded-xl px-4 py-3 bg-white/5 backdrop-blur-sm">
            <p className="text-xl font-extrabold text-[#fcd020] leading-tight">
              <Counter target={value} suffix={suffix} />
            </p>
            <p className="text-white/45 text-[11px] font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
