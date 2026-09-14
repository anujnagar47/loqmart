"use client"

import Link from "next/link"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { BadgeCheck, MapPin, Shield, ArrowRight } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import { useLanguage } from "@/lib/i18n/LanguageContext"

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

interface HeroStats {
  products: number
  sellers: number
  categories: number
  states: number
}

export function Hero({ stats }: { stats: HeroStats }) {
  const { t } = useLanguage()
  return (
    <section className="relative w-full flex flex-col justify-center px-4 md:px-20 pt-24 pb-10 md:pt-28 md:pb-14 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=1920&h=1080&fit=crop"
          alt="Indian artisan craftsmanship"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Layered gradient: strong left, fade to transparent right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0f0f]/95 via-[#0e0f0f]/65 to-transparent" />
        {/* Subtle bottom vignette for stats legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f0f]/60 via-transparent to-transparent" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl">
        <motion.h1
          className="text-white font-extrabold leading-[1.05] mb-4"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", letterSpacing: "-0.025em" }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {t("hero.title1")}{" "}
          <span className="text-[#fcd020]">{t("hero.title2")}</span>
        </motion.h1>

        <motion.p
          className="text-white/60 text-sm md:text-base mb-6 max-w-md leading-relaxed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          className="flex flex-wrap gap-3 mb-7"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/india-map">
            <motion.button
              className="flex items-center gap-2.5 bg-[#fcd020] text-[#1a1c1c] px-6 py-3 font-black text-xs uppercase tracking-widest rounded-[4px]"
              whileHover={{ scale: 1.03, boxShadow: "0 16px 40px rgba(252,208,32,0.4)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <MapPin className="w-4 h-4" /> {t("hero.chooseState")}
            </motion.button>
          </Link>
          <Link href="/category">
            <motion.button
              className="flex items-center gap-2.5 border border-white/25 text-white px-6 py-3 font-bold text-xs uppercase tracking-widest rounded-[4px] hover:border-white/50 hover:bg-white/8 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {t("hero.exploreProducts")} <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust chips */}
        <motion.div
          className="flex flex-wrap gap-2 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { icon: BadgeCheck, text: t("hero.chipGst") },
            { icon: Shield,     text: t("hero.chipSwadeshi") },
            { icon: MapPin,     text: t("hero.chipStateWise") },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 border border-white/15 text-white/55 text-[11px] font-semibold px-3 py-1.5 rounded-full">
              <Icon className="w-3 h-3 text-[#fcd020]" /> {text}
            </span>
          ))}
        </motion.div>

        {/* Stats strip */}
        <motion.div
          className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {[
            { value: stats.products,   suffix: "+", label: t("hero.statProducts") },
            { value: stats.states,     suffix: "",  label: t("hero.statStates") },
            { value: stats.sellers,    suffix: "+", label: t("hero.statSellers") },
            { value: stats.categories, suffix: "",  label: t("hero.statCategories") },
          ].map(({ value, suffix, label }) => (
            <div key={label} className="border border-white/12 rounded-[4px] px-3 py-2.5 bg-white/5 backdrop-blur-sm">
              <p className="text-lg font-extrabold text-[#fcd020] leading-tight">
                <Counter target={value} suffix={suffix} />
              </p>
              <p className="text-white/45 text-[10.5px] font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
