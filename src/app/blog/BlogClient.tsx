"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Clock } from "lucide-react"

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  image: string
  state: string
  stateCode: string
  category: string
  readTime: string
  date: string
  author: string
}

const categories = ["All", "Crafts", "Textiles", "Heritage", "Art", "Food", "Wellness"]

export function BlogClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [blogPosts]      = useState<BlogPost[]>(initialPosts)
  const [activeCategory, setActiveCategory] = useState("All")

  const filtered = activeCategory === "All" ? blogPosts : blogPosts.filter(p => p.category === activeCategory)
  const featured = filtered[0]
  const rest     = filtered.slice(1)

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      {/* Header */}
      <div className="py-16 px-6 bg-white" style={{ borderBottom: "1px solid rgba(17,24,39,0.07)" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] block mb-4" style={{ color: "#111827" }}>
              LoqMart Stories
            </span>
            <h1 className="text-[48px] font-extrabold text-[#111827] tracking-tight mb-4">
              The Craft Chronicles
            </h1>
            <p className="text-[#111827]/55 text-[16px] max-w-2xl leading-relaxed">
              Meet India's regions through their landscapes, craft traditions and local makers. Start with the first four state stories, with more to follow.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-10">
          {categories.map((cat) => (
            <motion.button key={cat} onClick={() => setActiveCategory(cat)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all"
              style={{
                background: activeCategory === cat ? "#FACC15" : "white",
                color:      activeCategory === cat ? "#111827" : "rgba(17,24,39,0.5)",
                border:     activeCategory === cat ? "1px solid #FACC15" : "1px solid rgba(17,24,39,0.12)",
              }}>
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Featured post */}
        {featured && (
          <motion.div className="mb-14"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Link href={`/blog/${featured.slug}`}>
              <motion.div whileHover={{ boxShadow: "0 12px 40px rgba(17,24,39,0.12)" }}
                className="group grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden bg-white"
                style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                <div className="relative h-64 lg:h-auto overflow-hidden">
                  {featured.image ? <img src={featured.image} alt={featured.title} onError={event => { event.currentTarget.style.display = "none" }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="flex h-full flex-col justify-end bg-gradient-to-br from-[#725c00] via-[#a87900] to-[#fcd020] p-6 text-white"><span className="text-xs font-bold uppercase tracking-widest">{featured.state} · Regional story</span><span className="mt-2 text-lg font-bold">Illustration coming soon</span></div>}
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black text-[#111827]"
                      style={{ background: "#FACC15" }}>Featured</span>
                  </div>
                </div>
                <div className="p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#111827]"
                      style={{ border: "1px solid rgba(17,24,39,0.2)" }}>
                      <MapPin className="w-3 h-3" />{featured.state}
                    </span>
                    <span className="text-[11px] text-[#111827]/40">{featured.category}</span>
                  </div>
                  <h2 className="text-[22px] font-extrabold text-[#111827] tracking-tight leading-tight mb-4 group-hover:text-[#111827] transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-[#111827]/55 text-[13px] leading-relaxed mb-6">{featured.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-bold text-[#111827]">{featured.author}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#111827]/40 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{featured.readTime}</span>
                        <span>·</span>
                        <span>{featured.date}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform"
                      style={{ background: "#FACC15" }}>
                      <ArrowRight className="w-5 h-5 text-[#111827]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-[18px] font-bold text-[#111827]/40">No stories yet</p>
            <p className="text-[13px] text-[#111827]/30 mt-2">Check back soon.</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rest.map((post, i) => (
            <motion.div key={post.slug}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>
              <Link href={`/blog/${post.slug}`}>
                <motion.article whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}
                  className="group bg-white rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                  <div className="relative h-48 overflow-hidden">
                    {post.image ? <img src={post.image} alt={post.title} onError={event => { event.currentTarget.style.display = "none" }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="flex h-full flex-col justify-end bg-gradient-to-br from-[#725c00] via-[#a87900] to-[#fcd020] p-5 text-white"><span className="text-xs font-bold uppercase tracking-widest">{post.state} · Regional story</span><span className="mt-2 text-base font-bold">Illustration coming soon</span></div>}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-[#111827]"
                        style={{ border: "1px solid rgba(17,24,39,0.12)" }}>
                        <MapPin className="w-3 h-3" />{post.state}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#111827" }}>
                      {post.category}
                    </span>
                    <h2 className="font-extrabold text-[#111827] tracking-tight leading-tight mb-3 mt-2 group-hover:text-[#111827] transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-[13px] text-[#111827]/55 leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-[11px] text-[#111827]/40">
                      <span className="font-medium">{post.author}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </div>
                    </div>
                  </div>
                </motion.article>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
