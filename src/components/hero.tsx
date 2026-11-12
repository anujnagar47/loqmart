"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export interface HeroStateSlide {
  stateCode: string
  stateName: string
  image: string
}

const DEFAULT_SLIDE = {
  image: "https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=1920&h=1080&fit=crop",
  stateCode: "",
  stateName: "",
}

export function Hero({ stateSlides = [] }: { stateSlides?: HeroStateSlide[] }) {
  const { t } = useLanguage()
  const slides = [DEFAULT_SLIDE, ...stateSlides]
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const move = (direction: -1 | 1) => {
    setActiveIndex((index) => (index + direction + slides.length) % slides.length)
  }

  const currentSlide = slides[activeIndex]
  const stateHref = currentSlide.stateCode
    ? `/state/${currentSlide.stateCode.toLowerCase()}`
    : "/india-map"

  return (
    <section className="bg-white px-4 pb-5 pt-4 sm:px-6 lg:pt-5" aria-roledescription="carousel" aria-label="Explore products from India">
      <div className="relative mx-auto flex min-h-[300px] max-w-7xl items-center overflow-hidden rounded-lg bg-[#111827] sm:min-h-[340px] lg:min-h-[390px]">
        <div
          className="absolute inset-0 flex transition-transform duration-700 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          aria-live="polite"
        >
          {slides.map((slide, index) => (
            <div key={`${slide.stateCode || "india"}-${index}`} className="relative h-full min-h-[300px] min-w-full sm:min-h-[340px] lg:min-h-[390px]">
              <Image
                src={slide.image}
                alt={slide.stateName ? `Products and crafts from ${slide.stateName}` : "Handwoven Indian textiles"}
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 1280px"
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#171b16]/90 via-[#171b16]/70 to-[#171b16]/10" />

        <div className="relative z-10 max-w-[600px] px-6 py-10 sm:px-10 lg:px-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#ffe17b]">
            {currentSlide.stateName
              ? `Discover products from ${currentSlide.stateName}`
              : "Handmade and machine-made goods from India"}
          </p>
          <h1 className="mb-4 text-[clamp(2rem,4.4vw,3.5rem)] font-extrabold leading-[1.06] tracking-tight text-white">
            <span className="block">{t("hero.title1")}</span>
            <span className="block text-[#FACC15]">{t("hero.title2")}</span>
          </h1>
          <p className="mb-6 max-w-[440px] text-sm leading-6 text-white/85 sm:text-base">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/category"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#FACC15] px-5 text-sm font-medium text-[#111827] transition-colors duration-150 hover:bg-[#CA8A04] hover:text-[#111827]"
            >
              {t("hero.exploreProducts")}
            </Link>
            <Link
              href={stateHref}
              className="inline-flex min-h-11 items-center justify-center rounded-[4px] border border-white/70 bg-[#111827]/20 px-5 text-sm font-semibold text-white transition-colors hover:border-[#FACC15] hover:bg-[#FACC15] hover:text-[#111827]"
            >
              {currentSlide.stateName ? `Shop ${currentSlide.stateName}` : t("hero.chooseState")}
            </Link>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous featured state"
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/35 text-white transition-colors hover:bg-[#FACC15] hover:text-[#111827] sm:left-5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next featured state"
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/35 text-white transition-colors hover:bg-[#FACC15] hover:text-[#111827] sm:right-5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 right-5 z-20 flex items-center gap-2 sm:bottom-5 sm:right-8" aria-label="Choose featured slide">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.stateCode || "india"}-dot`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show ${slide.stateName || "India"}`}
                  aria-current={activeIndex === index ? "true" : undefined}
                  className={`h-2.5 rounded-full border border-white/80 transition-all ${activeIndex === index ? "w-7 bg-[#FACC15]" : "w-2.5 bg-white/70 hover:bg-[#FACC15]"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
