"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useState } from "react"

export function EditorialSection() {
  const { t } = useLanguage()
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <section className="py-14 md:py-32 px-4 md:px-20 bg-[#111827] overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-16">
        <motion.div
          className="md:col-span-7 relative aspect-[16/9]"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-[#FACC15]/20 to-transparent rounded-[4px] blur-xl" />
          {!imageFailed ? <Image
            fill
            sizes="(max-width: 768px) 100vw, 58vw"
            className="object-cover rounded-[4px] relative z-10"
            src="/images/banners/artisan-workshop-editorial.jpg"
            alt="Artisan workshop"
            unoptimized
            onError={() => setImageFailed(true)}
          /> : <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#4d4632] to-[#1a1c1c]" role="img" aria-label="Artisan workshop image pending" />}
        </motion.div>
        <motion.div 
          className="md:col-span-5"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="text-xs font-medium text-[#FACC15] uppercase tracking-[0.2em] block mb-6">{t("editorial.eyebrow")}</span>
          <h2 className="text-5xl font-extrabold tracking-tighter mb-8 leading-tight text-white">{t("editorial.title")}</h2>
          <p className="text-white/70 body-lg mb-10 leading-relaxed">
            {t("editorial.body")}
          </p>
          <Link href="/about">
            <motion.button
              className="text-white font-bold text-sm uppercase tracking-widest border-b-4 border-[#FACC15] pb-1 hover:border-white transition-all"
              whileHover={{ x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {t("editorial.cta")}
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
