"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import {
  Star, Heart, Share2, Shield, Truck, RotateCcw, ChevronLeft, ChevronRight,
  Minus, Plus, Check, MapPin, BadgeCheck, Search, Loader2, AlertCircle, ImageOff,
  ZoomIn, X, Camera, HelpCircle, MessageSquare
} from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { RecentlyViewedRow } from "@/components/recently-viewed-row"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useCartStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { useWishlist } from "@/hooks/useWishlist"
import { trackRecentlyViewed } from "@/lib/recently-viewed"
import type { Product, ProductVariant, ProductQuestion } from "@/types/database"

const STATE_NAMES: Record<string, string> = {
  RJ:"Rajasthan", UP:"Uttar Pradesh", MH:"Maharashtra", WB:"West Bengal",
  KA:"Karnataka", TN:"Tamil Nadu", OR:"Odisha", AP:"Andhra Pradesh",
  GJ:"Gujarat", JK:"Jammu & Kashmir", KL:"Kerala", BR:"Bihar",
  MP:"Madhya Pradesh", PB:"Punjab", HR:"Haryana", DL:"Delhi",
  GA:"Goa", CT:"Chhattisgarh", JH:"Jharkhand", UA:"Uttarakhand",
  MN:"Manipur", ML:"Meghalaya", MZ:"Mizoram", NL:"Nagaland",
  SK:"Sikkim", TG:"Telangana", TR:"Tripura", AR:"Arunachal Pradesh",
  AS:"Assam", LA:"Ladakh",
}

function Thumbnail({ src }: { src: string }) {
  const [error, setError] = useState(false)
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f0ede8]">
        <ImageOff className="w-4 h-4 text-[#1a1c1c]/20" />
      </div>
    )
  }
  return (
    <div className="relative w-full h-full">
      <Image src={src} alt="" fill sizes="64px" className="object-cover" onError={() => setError(true)} />
    </div>
  )
}

export function ProductPageClient() {
  const params     = useParams()
  const slug       = params?.slug as string
  const { addItem } = useCartStore()
  const { toggleWishlist } = useWishlist()

  const [product,        setProduct]        = useState<Product | null>(null)
  const [reviews,        setReviews]        = useState<any[]>([])
  const [relatedProds,   setRelatedProds]   = useState<Product[]>([])
  const [sameStateProds, setSameStateProds] = useState<Product[]>([])
  const [seller,         setSeller]         = useState<any>(null)
  const [loading,        setLoading]        = useState(true)
  const [notFound,       setNotFound]       = useState(false)

  const [selectedImage, setSelectedImage] = useState(0)
  const [mainImageError, setMainImageError] = useState(false)
  const [zoomOpen,      setZoomOpen]      = useState(false)
  const [quantity,      setQuantity]      = useState(1)
  const [isAdding,      setIsAdding]      = useState(false)
  const [isWishlisted,  setIsWishlisted]  = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [pincode,        setPincode]        = useState("")
  const [deliveryInfo,   setDeliveryInfo]   = useState<string | null>(null)
  const [deliveryChecking, setDeliveryChecking] = useState(false)

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  // Review form state
  const [reviewRating,  setReviewRating]  = useState(0)
  const [reviewTitle,   setReviewTitle]   = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [reviewImages,  setReviewImages]  = useState<string[]>([])
  const [uploadingReviewImages, setUploadingReviewImages] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewMsg,     setReviewMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Q&A state
  const [questions, setQuestions] = useState<ProductQuestion[]>([])
  const [questionText, setQuestionText] = useState("")
  const [questionSubmitting, setQuestionSubmitting] = useState(false)
  const [questionMsg, setQuestionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [answerSubmittingId, setAnswerSubmittingId] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    if (!slug) return
    async function load() {
      // Use API route (service client) to bypass RLS for product fetch
      const apiRes = await fetch(`/api/products/${slug}`)
      if (!apiRes.ok) { setNotFound(true); setLoading(false); return }
      const apiData = await apiRes.json()
      const prod = apiData.product
      if (!prod) { setNotFound(true); setLoading(false); return }
      setProduct(prod)
      trackRecentlyViewed(prod.id)
      // Seller is nested inside product from the API join
      if (prod.sellers) setSeller(prod.sellers)
      setRelatedProds(apiData.relatedProducts || [])
      setSameStateProds(apiData.sameStateProducts || [])
      setReviews(apiData.reviews || [])
      setQuestions(apiData.questions || [])

      const prodVariants: ProductVariant[] = apiData.variants || []
      setVariants(prodVariants)
      if (prodVariants.length > 0) {
        const defaultVariant = prodVariants.find(v => v.is_default) || prodVariants[0]
        setSelectedVariantId(defaultVariant.id)
      }

      // Check wishlist status using auth-aware client
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: wl } = await supabase
          .from("wishlists")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("product_id", prod.id)
          .maybeSingle()
        if (wl) setIsWishlisted(true)
      }
      setLoading(false)
    }
    load()
  }, [slug])

  useEffect(() => { setMainImageError(false) }, [selectedImage])

  async function checkDelivery() {
    if (pincode.length !== 6 || !product) return
    setDeliveryChecking(true)
    setDeliveryInfo(null)
    try {
      const res = await fetch(`/api/logistics/serviceability?product_id=${product.id}&pincode=${pincode}`)
      const data = await res.json()
      if (data.configured === false) {
        setDeliveryInfo(`Delivered across India — typically 5–7 business days. We'll confirm the exact date at checkout.`)
      } else if (data.serviceable === false) {
        setDeliveryInfo(`Sorry, this seller doesn't currently deliver to ${pincode}.`)
      } else if (data.estimatedDays) {
        setDeliveryInfo(`Estimated delivery in ${data.estimatedDays}–${data.estimatedDays + 2} business days to ${pincode}`)
      } else {
        setDeliveryInfo(`Delivery available to ${pincode}. Exact timing confirmed at checkout.`)
      }
    } catch {
      setDeliveryInfo(`Could not check delivery right now. Please try again.`)
    } finally {
      setDeliveryChecking(false)
    }
  }

  function handleAddToCart() {
    if (!product) return
    setIsAdding(true)
    addItem(product, quantity, selectedVariant)
    setTimeout(() => setIsAdding(false), 1500)
  }

  function handleBuyNow() {
    if (!product) return
    addItem(product, quantity, selectedVariant)
    router.push("/checkout")
  }

  async function handleToggleWishlist() {
    if (!product) return
    setWishlistLoading(true)
    const result = await toggleWishlist(product.id, isWishlisted)
    if (result !== null) setIsWishlisted(result)
    setWishlistLoading(false)
  }

  async function handleReviewImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    if (reviewImages.length + files.length > 5) { setReviewMsg({ type: "error", text: "Maximum 5 photos allowed." }); return }
    setUploadingReviewImages(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setReviewMsg({ type: "error", text: "Please sign in to upload photos." })
      setUploadingReviewImages(false)
      return
    }
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      if (file.size > 8 * 1024 * 1024) continue
      const ext = file.name.split(".").pop()
      const path = `${session.user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from("review-images").upload(path, file, { cacheControl: "3600", upsert: false })
      if (error) continue
      const { data: { publicUrl } } = supabase.storage.from("review-images").getPublicUrl(path)
      uploaded.push(publicUrl)
    }
    setReviewImages(prev => [...prev, ...uploaded])
    setUploadingReviewImages(false)
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!product || reviewRating === 0) { setReviewMsg({ type: "error", text: "Please select a star rating." }); return }
    if (reviewComment.trim().length < 10) { setReviewMsg({ type: "error", text: "Comment must be at least 10 characters." }); return }
    setReviewSubmitting(true)
    setReviewMsg(null)
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, title: reviewTitle, comment: reviewComment, images: reviewImages }),
      })
      const data = await res.json()
      if (!res.ok) { setReviewMsg({ type: "error", text: data.error || "Failed to submit review." }); return }
      setReviewMsg({ type: "success", text: data.coins_earned > 0 ? `Review submitted! You earned ${data.coins_earned} LoqCoins.` : "Review submitted successfully!" })
      setReviews(prev => [{ ...data.review, users: { full_name: "You" } }, ...prev])
      setReviewRating(0); setReviewTitle(""); setReviewComment(""); setReviewImages([])
    } catch {
      setReviewMsg({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function handleAskQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (questionText.trim().length < 5) { setQuestionMsg({ type: "error", text: "Question must be at least 5 characters." }); return }
    setQuestionSubmitting(true)
    setQuestionMsg(null)
    try {
      const res = await fetch(`/api/products/${slug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setQuestionMsg({ type: "error", text: data.error || "Failed to submit question." }); return }
      setQuestions(prev => [data.question, ...prev])
      setQuestionText("")
      setQuestionMsg({ type: "success", text: "Question posted!" })
    } catch {
      setQuestionMsg({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setQuestionSubmitting(false)
    }
  }

  async function handleAnswerQuestion(questionId: string) {
    const answer = (answerDrafts[questionId] || "").trim()
    if (answer.length < 2) return
    setAnswerSubmittingId(questionId)
    try {
      const res = await fetch(`/api/products/${slug}/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      })
      const data = await res.json()
      if (res.ok) {
        setQuestions(prev => prev.map(q => q.id === questionId
          ? { ...q, product_answers: [...(q.product_answers || []), data.answer] }
          : q))
        setAnswerDrafts(prev => ({ ...prev, [questionId]: "" }))
      }
    } finally {
      setAnswerSubmittingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1c1c]/40" />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-[#1a1c1c]/20 mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-[#1a1c1c] mb-2">Product not found</h1>
          <p className="text-[#1a1c1c]/50 mb-6">This product may have been removed or the link is incorrect.</p>
          <Link href="/category" className="inline-flex items-center px-5 py-2.5 bg-[#fcd020] text-[#1a1c1c] font-bold rounded-lg">
            Browse Catalogue
          </Link>
        </div>
      </div>
    )
  }

  const selectedVariant = variants.find(v => v.id === selectedVariantId) || null
  const effectivePrice = selectedVariant?.price ?? product.price
  const effectiveMrp   = selectedVariant ? (selectedVariant.mrp ?? null) : product.mrp
  const effectiveStock = variants.length > 0 ? (selectedVariant?.stock ?? 0) : product.stock

  const discount   = effectiveMrp ? Math.round((1 - effectivePrice / effectiveMrp) * 100) : 0
  const coinEarn   = Math.floor(effectivePrice / 100)
  const stateName  = product.state_code ? STATE_NAMES[product.state_code] || product.state_code : null
  const images     = product.images?.length ? product.images : []
  const sellerInit = seller?.business_name ? seller.business_name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase() : "?"

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Sticky mobile Add to Cart bar — sits above global bottom nav */}
      {effectiveStock > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-40 lg:hidden px-4 pb-2 pt-2"
          style={{ background: "rgba(248,245,240,0.97)", borderTop: "1px solid rgba(26,28,28,0.08)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#1a1c1c]/40 leading-none mb-0.5">Price</p>
              <p className="text-[18px] font-black text-[#1a1c1c] leading-none">{formatCurrency(effectivePrice)}</p>
            </div>
            <button onClick={handleAddToCart} disabled={isAdding}
              className="flex items-center justify-center gap-1.5 h-11 px-5 rounded-[4px] text-[13px] font-black text-[#1a1c1c] disabled:opacity-60"
              style={{ background: "#fcd020", minWidth: "120px" }}>
              {isAdding ? <><Check className="w-4 h-4" /> Added!</> : "Add to Cart"}
            </button>
            <button onClick={handleBuyNow} disabled={effectiveStock === 0}
              className="flex items-center justify-center h-11 px-5 rounded-[4px] text-[13px] font-black text-white disabled:opacity-50"
              style={{ background: "#1a1c1c", minWidth: "90px" }}>
              Buy Now
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 lg:pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-[#1a1c1c]/50 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-1">
          <Link href="/" className="hover:text-[#1a1c1c] shrink-0">Home</Link>
          <span className="shrink-0">/</span>
          <Link href="/category" className="hover:text-[#1a1c1c] shrink-0">Products</Link>
          <span className="shrink-0">/</span>
          <span className="text-[#1a1c1c] font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 mb-12 sm:mb-16">
          {/* Image gallery */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative aspect-[3/4] sm:aspect-[3/4] bg-white rounded-[4px] overflow-hidden border border-[#1a1c1c]/8">
              {images.length > 0 && !mainImageError ? (
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  className="absolute inset-0 w-full h-full cursor-zoom-in"
                  aria-label="Zoom image"
                >
                  <Image
                    key={images[selectedImage]}
                    src={images[selectedImage]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    className="object-cover"
                    onError={() => setMainImageError(true)}
                  />
                </button>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#f0ede8]">
                  <ImageOff className="w-8 h-8 text-[#1a1c1c]/20" />
                  <span className="text-[#1a1c1c]/30 text-xs font-medium">{images.length > 0 ? "Image unavailable" : "No image"}</span>
                </div>
              )}
              {images.length > 0 && !mainImageError && (
                <div className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow pointer-events-none">
                  <ZoomIn className="w-4 h-4 text-[#1a1c1c]" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage(p => (p - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedImage(p => (p + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-[#fcd020] text-[#1a1c1c] px-3 py-1 text-xs font-black rounded-full">
                  {discount}% OFF
                </div>
              )}
            </div>

            {/* Fullscreen zoom lightbox */}
            {zoomOpen && images.length > 0 && (
              <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setZoomOpen(false)}>
                <button onClick={() => setZoomOpen(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                  <X className="w-5 h-5" />
                </button>
                <div className="relative w-full h-full max-w-4xl max-h-[85vh]" onClick={e => e.stopPropagation()}>
                  <Image src={images[selectedImage]} alt={product.name} fill sizes="100vw" className="object-contain" />
                </div>
                {images.length > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setSelectedImage(p => (p - 1 + images.length) % images.length) }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setSelectedImage(p => (p + 1) % images.length) }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            )}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-[4px] overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === i ? "border-[#1a1c1c]" : "border-transparent opacity-60"
                    }`}>
                    <Thumbnail src={img} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                  product.mode === "handmade" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                }`}>
                  {product.mode === "handmade" ? "Handmade" : "Machine-Made"}
                </span>
                {effectiveStock > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-green-100 text-green-800">In Stock</span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700">Out of Stock</span>
                )}
                {stateName && (
                  <Link href={`/state/${product.state_code?.toLowerCase()}`}>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#1a1c1c]/20 hover:bg-[#f8f5f0] cursor-pointer">
                      <MapPin className="w-3 h-3" />{stateName}
                    </span>
                  </Link>
                )}
                {effectiveStock > 0 && effectiveStock <= 10 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700">
                    Only {effectiveStock} left
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold text-[#1a1c1c] tracking-tight mb-4 leading-tight">{product.name}</h1>

              {product.rating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-[#fcd020] text-[#fcd020]" : "fill-[#1a1c1c]/15 text-[#1a1c1c]/15"}`} />
                    ))}
                  </div>
                  <span className="font-bold text-[#1a1c1c] text-sm">{product.rating.toFixed(1)}</span>
                  <span className="text-[#1a1c1c]/40 text-sm">({product.review_count} reviews)</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
              <span className="text-[28px] sm:text-4xl font-extrabold text-[#1a1c1c]">{formatCurrency(effectivePrice)}</span>
              {effectiveMrp && effectiveMrp > effectivePrice && (
                <>
                  <span className="text-xl text-[#1a1c1c]/40 line-through">{formatCurrency(effectiveMrp)}</span>
                  <span className="text-green-700 font-bold text-sm">Save {formatCurrency(effectiveMrp - effectivePrice)}</span>
                </>
              )}
            </div>

            {/* Variant selector */}
            {variants.length > 0 && (
              <div>
                <span className="text-sm font-medium text-[#1a1c1c]/60 block mb-2">
                  Option: <span className="font-bold text-[#1a1c1c]">{selectedVariant?.name}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setSelectedVariantId(v.id); setQuantity(1) }}
                      disabled={v.stock === 0}
                      className={`px-4 py-2 rounded-[4px] text-sm font-bold border-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        selectedVariantId === v.id
                          ? "border-[#1a1c1c] bg-[#1a1c1c] text-white"
                          : "border-[#1a1c1c]/15 bg-white text-[#1a1c1c] hover:border-[#1a1c1c]/40"
                      }`}
                    >
                      {v.name}{v.stock === 0 && " (Out of stock)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-[#fcd020]/15 rounded-[4px] border border-[#fcd020]/30">
              <div className="w-9 h-9 bg-[#fcd020] rounded-full flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-[#1a1c1c]" />
              </div>
              <div>
                <p className="font-bold text-[#1a1c1c] text-sm">Earn {coinEarn} LoqCoins on this purchase</p>
                <p className="text-xs text-[#1a1c1c]/60">1 LoqCoin = ₹0.25 off future orders</p>
              </div>
            </div>

            <p className="text-[#1a1c1c]/70 leading-relaxed">{product.description}</p>

            {effectiveStock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#1a1c1c]/60">Qty:</span>
                <div className="flex items-center border border-[#1a1c1c]/20 rounded-[4px] bg-white">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-[#f8f5f0] rounded-l-xl transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-bold text-[#1a1c1c]">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(effectiveStock, q + 1))} className="px-3 py-2 hover:bg-[#f8f5f0] rounded-r-xl transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-[#1a1c1c]/40">{effectiveStock} available</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button" size="xl" className="flex-1"
                onClick={handleAddToCart} disabled={isAdding || effectiveStock === 0}>
                {isAdding ? <><Check className="w-5 h-5" />Added!</> : "Add to Cart"}
              </Button>
              <Button
                type="button" variant="secondary" size="xl" className="flex-1"
                onClick={handleBuyNow} disabled={effectiveStock === 0}>
                Buy Now
              </Button>
              <button
                className="w-12 h-12 flex items-center justify-center rounded-[4px] transition-colors"
                style={{
                  border:      isWishlisted ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(26,28,28,0.2)",
                  background:  isWishlisted ? "rgba(254,242,242,1)" : "white",
                }}
                onClick={handleToggleWishlist} disabled={wishlistLoading}>
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-[#1a1c1c]"}`} />
              </button>
              <button
                className="w-12 h-12 flex items-center justify-center rounded-[4px] bg-white"
                style={{ border: "1px solid rgba(26,28,28,0.2)" }}
                onClick={() => navigator.share?.({ title: product.name, url: window.location.href })
                  .catch(() => navigator.clipboard.writeText(window.location.href))}>
                <Share2 className="w-5 h-5 text-[#1a1c1c]" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 py-4 border-t border-[#1a1c1c]/8">
              {[
                { icon: Truck,    title: "Free Shipping",    desc: "Orders above ₹999" },
                { icon: RotateCcw, title: "Easy Returns",   desc: "7-day return policy" },
                { icon: Shield,   title: "Quality Assured", desc: "Swadeshi Verified" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center text-center gap-1.5">
                  <Icon className="w-5 h-5 text-[#1a1c1c]/50" />
                  <p className="text-xs font-bold text-[#1a1c1c]">{title}</p>
                  <p className="text-[10px] text-[#1a1c1c]/50">{desc}</p>
                </div>
              ))}
            </div>

            {/* Delivery check */}
            <div className="border border-[#1a1c1c]/15 rounded-[4px] p-4 bg-white">
              <p className="text-sm font-bold text-[#1a1c1c] mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Check delivery to your pincode
              </p>
              <div className="flex gap-2">
                <input
                  placeholder="6-digit pincode" value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && checkDelivery()}
                  className="flex-1 h-10 px-3 rounded-[4px] text-[13px] outline-none"
                  style={{ border: "1px solid rgba(26,28,28,0.2)", background: "#f8f5f0" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#fcd020"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(252,208,32,0.1)" }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(26,28,28,0.2)"; e.currentTarget.style.boxShadow = "none" }}
                />
                <button onClick={checkDelivery} disabled={pincode.length !== 6 || deliveryChecking}
                  className="h-10 px-3 rounded-[4px] flex items-center justify-center transition-opacity"
                  style={{ background: "#f8f5f0", border: "1px solid rgba(26,28,28,0.2)", opacity: (pincode.length !== 6 || deliveryChecking) ? 0.5 : 1 }}>
                  {deliveryChecking ? <Loader2 className="w-4 h-4 text-[#1a1c1c] animate-spin" /> : <Search className="w-4 h-4 text-[#1a1c1c]" />}
                </button>
              </div>
              {deliveryInfo ? (
                <p className="text-xs text-green-700 font-medium mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3" /> {deliveryInfo}
                </p>
              ) : (
                <p className="text-xs text-[#1a1c1c]/40 mt-2">Free shipping on orders above ₹999. Standard 5–7 day delivery.</p>
              )}
            </div>

            {/* Seller info */}
            {seller && (
              <div className="bg-white border border-[#1a1c1c]/8 p-4 rounded-[4px]">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#fcd020] rounded-full flex items-center justify-center shrink-0">
                    <span className="font-black text-[#1a1c1c] text-sm">{sellerInit}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1a1c1c]">{seller.business_name}</p>
                    <div className="flex items-center gap-3 text-xs text-[#1a1c1c]/50 mt-0.5">
                      {seller.gstin && (
                        <span className="flex items-center gap-1 text-green-700 font-semibold">
                          <BadgeCheck className="w-3.5 h-3.5" /> GST Verified
                        </span>
                      )}
                      {seller.swadeshi_rank > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#fcd020] text-[#fcd020]" />
                          Rank {seller.swadeshi_rank}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link href={`/seller/${product.seller_id}`} className="text-sm text-[#1a1c1c]/50 hover:text-[#1a1c1c] mt-3 block font-semibold">
                  Visit Seller Store →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Specs + Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2 space-y-8">
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="bg-white rounded-[4px] border border-[#1a1c1c]/8 p-6">
                <h2 className="text-xl font-extrabold text-[#1a1c1c] mb-5">Specifications</h2>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2.5 border-b border-[#1a1c1c]/5 last:border-0">
                      <span className="text-[#1a1c1c]/50 text-sm">{key}</span>
                      <span className="font-semibold text-[#1a1c1c] text-sm">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[4px] border border-[#1a1c1c]/8 p-6">
              <h2 className="text-xl font-extrabold text-[#1a1c1c] mb-5">
                Customer Reviews {reviews.length > 0 && <span className="text-[#1a1c1c]/40 font-normal text-base">({reviews.length})</span>}
              </h2>
              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star className="w-10 h-10 text-[#1a1c1c]/15 mx-auto mb-3" />
                  <p className="text-[#1a1c1c]/40 font-medium">No reviews yet - be the first!</p>
                </div>
              ) : (
                <div className="space-y-6 mb-8">
                  {reviews.map((review) => {
                    const name = review.users?.full_name || "Verified Buyer"
                    const initial = name.charAt(0).toUpperCase()
                    return (
                      <div key={review.id} className="pb-6 border-b border-[#1a1c1c]/5 last:border-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 bg-[#fcd020]/30 rounded-full flex items-center justify-center font-bold text-sm text-[#1a1c1c]">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#1a1c1c]">{name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-[#fcd020] text-[#fcd020]" : "fill-[#1a1c1c]/10 text-[#1a1c1c]/10"}`} />
                                ))}
                              </div>
                              <span className="text-xs text-[#1a1c1c]/40">
                                {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.title && <h3 className="font-bold text-sm text-[#1a1c1c] mb-1">{review.title}</h3>}
                        <p className="text-sm text-[#1a1c1c]/60 leading-relaxed">{review.comment}</p>
                        {review.images?.length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                            {review.images.map((src: string, i: number) => (
                              <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                                className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-[#1a1c1c]/8">
                                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Write a Review form */}
              <div className="border-t border-[#1a1c1c]/8 pt-6">
                <h3 className="font-extrabold text-[#1a1c1c] mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1a1c1c]/60 uppercase tracking-wider mb-2">Your Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setReviewRating(star)}
                          className="p-1 transition-transform hover:scale-110">
                          <Star className={`w-7 h-7 ${star <= reviewRating ? "fill-[#fcd020] text-[#fcd020]" : "text-[#1a1c1c]/20"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1a1c1c]/60 uppercase tracking-wider mb-1.5">Title (optional)</label>
                    <input
                      placeholder="Summarize your experience" value={reviewTitle}
                      onChange={e => setReviewTitle(e.target.value)} maxLength={100}
                      className="w-full h-10 px-3 rounded-[4px] text-[13px] outline-none"
                      style={{ border: "1px solid rgba(26,28,28,0.15)", background: "#f8f5f0" }}
                      onFocus={e => { e.currentTarget.style.borderColor = "#fcd020"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(252,208,32,0.1)" }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(26,28,28,0.15)"; e.currentTarget.style.boxShadow = "none" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1a1c1c]/60 uppercase tracking-wider mb-1.5">Your Review</label>
                    <textarea
                      placeholder="Share your experience with this product (min 10 characters)"
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      maxLength={1000}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-[#1a1c1c]/15 bg-[#f8f5f0] text-sm focus:outline-none focus:border-[#fcd020] transition-colors resize-none"
                    />
                    <p className="text-xs text-[#1a1c1c]/30 mt-1 text-right">{reviewComment.length}/1000</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1a1c1c]/60 uppercase tracking-wider mb-1.5">Photos (optional)</label>
                    <div className="flex flex-wrap gap-2">
                      {reviewImages.map((src, i) => (
                        <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#1a1c1c]/10">
                          <Image src={src} alt="" fill sizes="56px" className="object-cover" />
                          <button type="button" onClick={() => setReviewImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </div>
                      ))}
                      {reviewImages.length < 5 && (
                        <label className="w-14 h-14 rounded-lg border-2 border-dashed border-[#1a1c1c]/20 flex items-center justify-center cursor-pointer hover:border-[#fcd020] transition-colors">
                          {uploadingReviewImages ? <Loader2 className="w-4 h-4 animate-spin text-[#1a1c1c]/40" /> : <Camera className="w-4 h-4 text-[#1a1c1c]/40" />}
                          <input type="file" accept="image/*" multiple hidden
                            onChange={e => handleReviewImageUpload(e.target.files)} disabled={uploadingReviewImages} />
                        </label>
                      )}
                    </div>
                  </div>
                  {reviewMsg && (
                    <div className={`p-3 rounded-lg text-sm font-medium ${reviewMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {reviewMsg.text}
                    </div>
                  )}
                  <button type="submit" disabled={reviewSubmitting || reviewRating === 0}
                    className="flex items-center gap-2 h-10 px-5 rounded-[4px] text-[13px] font-black text-[#1a1c1c] transition-opacity"
                    style={{ background: "#fcd020", opacity: (reviewSubmitting || reviewRating === 0) ? 0.5 : 1 }}>
                    {reviewSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit Review"}
                  </button>
                </form>
              </div>
            </div>

            {/* Questions & Answers */}
            <div className="bg-white rounded-[4px] border border-[#1a1c1c]/8 p-6">
              <h2 className="text-xl font-extrabold text-[#1a1c1c] mb-5 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#1a1c1c]/40" />
                Questions & Answers {questions.length > 0 && <span className="text-[#1a1c1c]/40 font-normal text-base">({questions.length})</span>}
              </h2>

              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-[#1a1c1c]/15 mx-auto mb-3" />
                  <p className="text-[#1a1c1c]/40 font-medium text-sm">No questions yet — ask the first one.</p>
                </div>
              ) : (
                <div className="space-y-5 mb-6">
                  {questions.map((q) => (
                    <div key={q.id} className="pb-5 border-b border-[#1a1c1c]/5 last:border-0">
                      <p className="text-sm font-bold text-[#1a1c1c] mb-1">Q: {q.question}</p>
                      <p className="text-xs text-[#1a1c1c]/35 mb-2">
                        {q.users?.full_name || "Buyer"} · {new Date(q.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>

                      {(q.product_answers?.length || 0) > 0 && (
                        <div className="space-y-2 pl-4 border-l-2 border-[#fcd020]/40 mb-2">
                          {q.product_answers!.map((a) => (
                            <div key={a.id}>
                              <p className="text-sm text-[#1a1c1c]/70">
                                <span className="font-bold text-[#1a1c1c]">A:</span> {a.answer}
                              </p>
                              <p className="text-xs text-[#1a1c1c]/35 mt-0.5">
                                {a.is_seller && <span className="text-green-700 font-semibold">Seller</span>}
                                {a.is_seller && " · "}
                                {a.users?.full_name || "Buyer"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <input
                          value={answerDrafts[q.id] || ""}
                          onChange={e => setAnswerDrafts(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Write an answer…"
                          className="flex-1 h-9 px-3 rounded-lg text-[12px] outline-none"
                          style={{ border: "1px solid rgba(26,28,28,0.12)", background: "#f8f5f0" }}
                        />
                        <button
                          onClick={() => handleAnswerQuestion(q.id)}
                          disabled={answerSubmittingId === q.id || !(answerDrafts[q.id] || "").trim()}
                          className="h-9 px-3 rounded-lg text-[11px] font-black text-[#1a1c1c] disabled:opacity-40"
                          style={{ background: "#fcd020" }}>
                          {answerSubmittingId === q.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Answer"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAskQuestion} className="border-t border-[#1a1c1c]/8 pt-5 flex items-start gap-2">
                <input
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="Ask a question about this product…"
                  maxLength={500}
                  className="flex-1 h-10 px-3 rounded-[4px] text-[13px] outline-none"
                  style={{ border: "1px solid rgba(26,28,28,0.15)", background: "#f8f5f0" }}
                />
                <button type="submit" disabled={questionSubmitting || questionText.trim().length < 5}
                  className="h-10 px-5 rounded-[4px] text-[13px] font-black text-[#1a1c1c] disabled:opacity-50 shrink-0"
                  style={{ background: "#fcd020" }}>
                  {questionSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
                </button>
              </form>
              {questionMsg && (
                <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${questionMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {questionMsg.text}
                </div>
              )}
            </div>
          </div>

          <div>
            {product.tags?.length > 0 && (
              <div className="bg-white rounded-[4px] border border-[#1a1c1c]/8 p-5 sticky top-24 lg:top-28">
                <h3 className="font-bold text-[#1a1c1c] mb-3 text-sm uppercase tracking-wider">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-[#f8f5f0] text-[#1a1c1c]/70 text-xs font-semibold rounded-full border border-[#1a1c1c]/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {relatedProds.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-[#1a1c1c]">You May Also Like</h2>
              <Link href="/category" className="text-sm font-bold text-[#1a1c1c]/50 hover:text-[#1a1c1c]">View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {relatedProds.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* More from same state */}
        {stateName && sameStateProds.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-[#1a1c1c] flex items-center gap-2">
                <MapPin className="w-5 h-5" /> More from {stateName}
              </h2>
              <Link href={`/state/${product.state_code}`} className="text-sm font-bold text-[#1a1c1c]/50 hover:text-[#1a1c1c]">
                All from {product.state_code} →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {sameStateProds.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <RecentlyViewedRow excludeId={product.id} />
    </div>
  )
}
