"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { CRAFT_CATEGORIES, categoryHref } from "@/lib/craft-taxonomy"

export function CategoryGrid() {
  const { t } = useLanguage()
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string; slug: string; image_url: string | null }>>([])

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/categories", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Categories unavailable")
        return response.json()
      })
      .then((data) => {
        setAvailableCategories((data.categories || []) as Array<{ id: string; name: string; slug: string; image_url: string | null }>)
      })
      .catch(() => {})

    return () => controller.abort()
  }, [])

  return (
    <section className="bg-white px-4 py-7 sm:px-6 md:py-9">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#111827]">
              {t("categoryGrid.eyebrow")}
            </p>
            <h2 className="text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">
              {t("categoryGrid.titleLine1")}{" "}{t("categoryGrid.titleLine2")}
            </h2>
          </div>
          <Link
            href="/category"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 text-sm font-semibold text-[#4B5563] transition-colors hover:text-[#111827]"
          >
            {t("common.viewAll")}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8">
          {CRAFT_CATEGORIES.map((category) => {
            const match = availableCategories.find((item) => category.aliases.some((alias) =>
              item.slug.toLowerCase().includes(alias) || item.name.toLowerCase().includes(alias)
            ))
            const image_url = match?.image_url || category.image
            const href = categoryHref(category, availableCategories)
            return (
              <Link
                key={category.slug}
                href={href}
                className="group flex min-w-0 flex-col items-center gap-2 rounded-md text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EAB308]"
              >
                <span className="relative mx-auto aspect-square w-full max-w-[76px] overflow-hidden rounded-full border border-[#e8e4da] bg-white transition-all duration-200 group-hover:border-[#EAB308] group-hover:shadow-[0_0_0_3px_rgba(250,204,21,0.24)] sm:max-w-[112px]">
                  <Image
                    src={image_url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 28vw, 92px"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </span>
                <span className="line-clamp-3 min-h-11 text-[11px] font-semibold leading-4 text-[#111827] transition-colors group-hover:text-[#111827]">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
