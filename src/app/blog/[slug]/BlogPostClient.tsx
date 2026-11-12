"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, MapPin, Share2 } from "lucide-react"

export interface BlogPostDetail {
  title: string
  excerpt: string
  image: string
  state: string
  stateCode: string
  category: string
  readTime: string
  date: string
  author: string
  content: string[]
}

export function BlogPostClient({ post }: { post: BlogPostDetail }) {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      {/* Hero image */}
      <div className="relative h-[50vh] min-h-[400px] w-full">
        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-12 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black text-[#111827]"
              style={{ background: "#FACC15" }}>{post.category}</span>
            {post.state && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <MapPin className="w-3 h-3" />{post.state}
              </span>
            )}
          </div>
          <h1 className="text-[28px] md:text-[44px] font-extrabold text-white tracking-tight leading-tight">
            {post.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Meta */}
        <div className="flex items-center justify-between mb-8 pb-8"
          style={{ borderBottom: "1px solid rgba(17,24,39,0.08)" }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[#111827]"
              style={{ background: "#FACC15" }}>
              {post.author[0]}
            </div>
            <div>
              <p className="font-bold text-[#111827] text-[13px]">{post.author}</p>
              <div className="flex items-center gap-2 text-[11px] text-[#111827]/40">
                <Clock className="w-3 h-3" />
                <span>{post.readTime}</span>
                <span>·</span>
                <span>{post.date}</span>
              </div>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigator.share?.({ title: post.title, url: window.location.href })
              .catch(() => navigator.clipboard.writeText(window.location.href))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-[#111827] bg-white"
            style={{ border: "1px solid rgba(17,24,39,0.15)" }}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </motion.button>
        </div>

        {/* Excerpt */}
        <p className="text-[18px] text-[#111827]/60 leading-relaxed mb-8 font-medium italic pl-6"
          style={{ borderLeft: "4px solid #FACC15" }}>
          {post.excerpt}
        </p>

        {/* Body */}
        <div className="space-y-6">
          {post.content.map((para, i) => (
            <motion.p key={i}
              className="text-[15px] text-[#111827] leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              {para}
            </motion.p>
          ))}
        </div>

        {/* CTA to state page */}
        {post.state && post.stateCode && (
          <motion.div className="mt-12 p-6 rounded-2xl" style={{ background: "#FACC15" }}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="font-bold text-[#111827] mb-1 text-[15px]">Explore products from {post.state}</p>
            <p className="text-[13px] text-[#111827]/60 mb-4">
              Shop directly from verified artisans and manufacturers in {post.state}.
            </p>
            <Link href={`/state/${post.stateCode.toLowerCase()}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black text-[#111827] bg-white">
              Browse {post.state} <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </motion.div>
        )}

        {/* Back */}
        <div className="mt-8">
          <Link href="/blog" className="flex items-center gap-2 font-bold hover:underline text-[13px]"
            style={{ color: "#111827" }}>
            <ArrowLeft className="w-4 h-4" /> All Stories
          </Link>
        </div>
      </div>
    </div>
  )
}
