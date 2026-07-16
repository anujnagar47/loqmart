"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, MapPin, Share2, BookOpen } from "lucide-react"

const blogData: Record<string, {
  title: string
  excerpt: string
  image: string
  state: string
  stateCode: string
  category: string
  readTime: string
  date: string
  author: string
  authorTitle: string
  content: string[]
}> = {
  "craft-of-banarasi-silk": {
    title: "The 500-Year Legacy of Banarasi Silk Weaving",
    excerpt: "In the narrow lanes of Varanasi, master weavers carry forward a tradition older than the Mughal Empire.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&h=600&fit=crop",
    state: "Uttar Pradesh", stateCode: "UP", category: "Crafts",
    readTime: "8 min read", date: "June 10, 2024",
    author: "Meera Iyer", authorTitle: "Craft Journalist",
    content: [
      "In the narrow lanes of Varanasi, time moves differently. The morning mist still carries the sound of wooden pit looms - rhythmic, ancient, unchanged for half a millennium. Ustad Hamid Ansari, 68, has been weaving since he was seven years old. His father taught him, as his grandfather taught his father.",
      "The Banarasi silk saree is not merely clothing. It is a text - a conversation between designer, weaver, and silk - that takes anywhere from 15 days to six months to complete. The most elaborate sarees, featuring pure gold zari, take a family of four weavers working eight hours a day for six months to finish a single piece.",
      "The zari work that defines Banarasi silk originally came from Persia, brought to India by artisans in the court of Akbar. Over centuries, Varanasi's weavers absorbed the Persian floral motifs - the buta, the jaal, the meenakari - and transformed them into something distinctly Indian. Today, a GI (Geographical Indication) tag protects the name 'Banarasi silk', ensuring that only sarees woven in the Varanasi district can legally carry the name.",
      "The biggest threat to Banarasi silk is not time or taste - it is power loom imitations. Machine-made sarees that mimic the look of handwoven Banarasi at 10% of the price flood markets from Surat to Mumbai. For buyers who cannot tell the difference by touch, price becomes the deciding factor.",
      "LoqMart's verification process requires every Banarasi seller to submit their GSTIN, loom registration certificate, and pass a physical product audit. The Swadeshi Rank system further rewards sellers with high review scores, on-time delivery, and documented years in business. It is not a perfect system, but it is a beginning.",
      "Ustad Ansari's youngest son, Arshad, has started selling on LoqMart. Last month, he received an order from a customer in Bangalore who had discovered Banarasi silk through the state feed. 'When someone chooses to pay the real price for the real thing,' Arshad says, 'it means they understand what they are buying. That understanding is everything.'",
    ],
  },
  "blue-pottery-jaipur": {
    title: "Blue Pottery: How Jaipur's Persian Secret Became a GI Tag",
    excerpt: "Brought by Mughal artisans, refined by Rajput kings, and now protected by a Geographical Indication tag.",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&h=600&fit=crop",
    state: "Rajasthan", stateCode: "RJ", category: "Heritage",
    readTime: "6 min read", date: "May 28, 2024",
    author: "Arjun Sharma", authorTitle: "Heritage Writer",
    content: [
      "Blue pottery is perhaps the only craft in Jaipur that contains no clay from Rajasthan. The raw material - a mixture of quartz stone powder, powdered glass, Multani mitti, borax, and gum - was a trade secret brought by Central Asian craftsmen who followed the Mughal court into Rajputana.",
      "The defining characteristic is the cobalt blue - derived from cobalt oxide imported from Persia - applied over a white semi-transparent glaze. Traditionally, the motifs were limited to floral patterns: the lotus, the chrysanthemum, hunting scenes drawn from Persian miniature paintings.",
      "Ram Gopal Sharma, one of the craft's master practitioners, learned blue pottery at age nine in a workshop in Jaipur's Old City. Today he runs a workshop with twelve artisans and has received the National Award for Craftsmanship from the Government of India. He showed us, step by step, how a single tile is made: mixing, molding, drying, painting, glazing, and firing at exactly 850 degrees Celsius.",
      "The GI tag came in 2016, but enforcement remains weak. Mass-produced pieces from Khurja and China appear in Jaipur's tourist markets under the label 'Jaipur Blue Pottery'. The tell: true Blue Pottery is hand-painted and no two pieces are identical. The glaze is never perfectly smooth. The imperfection is the proof.",
    ],
  },
}

export default function BlogPostPage() {
  const params = useParams()
  const slug   = params.slug as string
  const post   = blogData[slug]

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f5f0" }}>
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-[#1a1c1c]/15" />
          <h1 className="text-[22px] font-bold text-[#1a1c1c] mb-2">Story not found</h1>
          <Link href="/blog" className="font-bold hover:underline" style={{ color: "#725c00" }}>
            Back to all stories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8f5f0" }}>
      {/* Hero image */}
      <div className="relative h-[50vh] min-h-[400px] w-full">
        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-12 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black text-[#231b00]"
              style={{ background: "#fcd020" }}>{post.category}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <MapPin className="w-3 h-3" />{post.state}
            </span>
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
          style={{ borderBottom: "1px solid rgba(26,28,28,0.08)" }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[#1a1c1c]"
              style={{ background: "#fcd020" }}>
              {post.author[0]}
            </div>
            <div>
              <p className="font-bold text-[#1a1c1c] text-[13px]">{post.author}</p>
              <div className="flex items-center gap-2 text-[11px] text-[#1a1c1c]/40">
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-[#1a1c1c] bg-white"
            style={{ border: "1px solid rgba(26,28,28,0.15)" }}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </motion.button>
        </div>

        {/* Excerpt */}
        <p className="text-[18px] text-[#1a1c1c]/60 leading-relaxed mb-8 font-medium italic pl-6"
          style={{ borderLeft: "4px solid #fcd020" }}>
          {post.excerpt}
        </p>

        {/* Body */}
        <div className="space-y-6">
          {post.content.map((para, i) => (
            <motion.p key={i}
              className="text-[15px] text-[#1a1c1c] leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              {para}
            </motion.p>
          ))}
        </div>

        {/* CTA to state page */}
        <motion.div className="mt-12 p-6 rounded-2xl" style={{ background: "#fcd020" }}
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="font-bold text-[#1a1c1c] mb-1 text-[15px]">Explore products from {post.state}</p>
          <p className="text-[13px] text-[#1a1c1c]/60 mb-4">
            Shop directly from verified artisans and manufacturers in {post.state}.
          </p>
          <Link href={`/state/${post.stateCode.toLowerCase()}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black text-[#1a1c1c] bg-white">
            Browse {post.state} <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </motion.div>

        {/* Back */}
        <div className="mt-8">
          <Link href="/blog" className="flex items-center gap-2 font-bold hover:underline text-[13px]"
            style={{ color: "#725c00" }}>
            <ArrowLeft className="w-4 h-4" /> All Stories
          </Link>
        </div>
      </div>
    </div>
  )
}
