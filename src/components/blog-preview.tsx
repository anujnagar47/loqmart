"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Clock, MapPin, BookOpen, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface BlogPreviewPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  featured_image: string | null
  state_code: string | null
  reading_time: string | null
  published_at: string | null
}

export function BlogPreview() {
  const { t } = useLanguage()
  const [posts,   setPosts]   = useState<BlogPreviewPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, featured_image:image_url, state_code, reading_time:read_time, published_at")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(3)
      if (!error) setPosts(data || [])
      setLoading(false)
    }
    fetchPosts()
  }, [])

  return (
    <section className="bg-white px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-6 md:mb-8">
          <div>
            <span className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#111827]">
              <BookOpen className="h-3.5 w-3.5" /> {t("blog.eyebrow")}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">
              {t("blog.titleLine1")} {t("blog.titleLine2")}
            </h2>
            <p className="mt-1 max-w-md text-sm leading-5 text-[#4B5563]">
              {t("blog.subtitle")}
            </p>
          </div>
          <Link href="/blog"
            className="group inline-flex min-h-10 shrink-0 items-center gap-2 text-sm font-semibold text-[#4B5563] transition-colors hover:text-[#111827]">
            {t("blog.allStories")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-[#111827]/30" /></div>
        ) : posts.length === 0 ? (
          <div className="border-y border-[#e8e4da] py-5 text-sm text-[#4B5563]">{t("blog.comingSoon")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <motion.div key={post.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}>
                <Link href={`/blog/${post.slug}`}>
                  <article className="group bg-white rounded-[4px] overflow-hidden hover:shadow-[0_2px_10px_rgba(17,24,39,0.12)] transition-shadow duration-200 border border-[#111827]/10">
                    <div className="relative h-48 overflow-hidden">
                      {post.featured_image ? (
                        <Image src={post.featured_image} alt={post.title} fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FACC15]/30 to-[#FACC15]/10 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-[#FACC15]/40" />
                        </div>
                      )}
                      {post.state_code && (
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 bg-white/90 text-[#111827] text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                            <MapPin className="w-3 h-3" />{post.state_code}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-extrabold text-[#111827] leading-tight mb-2 group-hover:text-[#111827] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-[#111827]/50 line-clamp-2 mb-3">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-[#111827]/40">
                        {post.reading_time && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.reading_time} {t("blog.minRead")}</span>
                        )}
                        {post.published_at && (
                          <span>{new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
