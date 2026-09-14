"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Clock, MapPin, BookOpen, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export function BlogPreview() {
  const { t } = useLanguage()
  const [posts,   setPosts]   = useState<any[]>([])
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
    <section className="py-10 md:py-20 px-4 md:px-20 bg-[#f8f5f0]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-8 mb-8 md:mb-12">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1a1c1c]/40 block mb-3 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> {t("blog.eyebrow")}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]">
              {t("blog.titleLine1")}<br />{t("blog.titleLine2")}
            </h2>
            <p className="text-[#1a1c1c]/50 mt-2 text-sm max-w-md">
              {t("blog.subtitle")}
            </p>
          </div>
          <Link href="/blog"
            className="text-[#1a1c1c]/50 font-bold text-sm uppercase tracking-widest hover:text-[#1a1c1c] flex items-center gap-2 whitespace-nowrap group transition-colors">
            {t("blog.allStories")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-[#1a1c1c]/30" /></div>
        ) : posts.length === 0 ? (
          <p className="text-center text-[#1a1c1c]/40 py-12 font-medium">{t("blog.comingSoon")}</p>
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
                  <article className="group bg-white rounded-[4px] overflow-hidden hover:shadow-[0_2px_10px_rgba(26,28,28,0.12)] transition-shadow duration-200 border border-[#1a1c1c]/10">
                    <div className="relative h-48 overflow-hidden">
                      {post.featured_image ? (
                        <Image src={post.featured_image} alt={post.title} fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#fcd020]/30 to-[#fcd020]/10 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-[#fcd020]/40" />
                        </div>
                      )}
                      {post.state_code && (
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 bg-white/90 text-[#1a1c1c] text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                            <MapPin className="w-3 h-3" />{post.state_code}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-extrabold text-[#1a1c1c] leading-tight mb-2 group-hover:text-[#725c00] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-[#1a1c1c]/50 line-clamp-2 mb-3">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-[#1a1c1c]/40">
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
