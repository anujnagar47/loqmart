import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

// POST /api/products/[slug]/reviews — submit a review (authenticated buyers only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    // Use session client only for auth, service client for all DB queries
    const sessionClient = await createClient()
    const supabase = createServiceClient()

    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { rating, title, comment, images } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }
    if (!comment || comment.trim().length < 10) {
      return NextResponse.json({ error: "Review comment must be at least 10 characters" }, { status: 400 })
    }
    if (comment.trim().length > 1000) {
      return NextResponse.json({ error: "Review comment must be under 1000 characters" }, { status: 400 })
    }
    const reviewImages = Array.isArray(images) ? images.filter((u) => typeof u === "string").slice(0, 5) : []

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, seller_id, rating, review_count")
      .eq("slug", slug)
      .eq("approval_status", "approved")
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Prevent self-review by seller
    const { data: seller } = await supabase
      .from("sellers")
      .select("user_id")
      .eq("id", product.seller_id)
      .single()
    if (seller?.user_id === user.id) {
      return NextResponse.json({ error: "Sellers cannot review their own products" }, { status: 403 })
    }

    // One review per user per product
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 })
    }

    // Check if buyer has purchased this product (verified review)
    const { data: orderItem } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, payment_status)")
      .eq("product_id", product.id)
      .eq("orders.user_id", user.id)
      .eq("orders.payment_status", "paid")
      .maybeSingle()
    const isVerified = !!orderItem

    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        product_id: product.id,
        user_id: user.id,
        rating,
        title: title?.trim() || null,
        comment: comment.trim(),
        images: reviewImages,
        is_verified: isVerified,
      })
      .select()
      .single()

    if (reviewError || !review) {
      console.error("Review insert error:", reviewError)
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 })
    }

    // Recalculate product rating
    const newCount = (product.review_count || 0) + 1
    const newRating = ((product.rating || 0) * (product.review_count || 0) + rating) / newCount
    await supabase
      .from("products")
      .update({ rating: Math.round(newRating * 10) / 10, review_count: newCount })
      .eq("id", product.id)

    // Award LoqCoins for review (+25 coins)
    if (isVerified) {
      const { data: balance } = await supabase
        .from("loqcoin_balances")
        .select("balance, lifetime_earned")
        .eq("user_id", user.id)
        .single()
      if (balance) {
        const newBalance = balance.balance + 25
        await supabase.from("loqcoin_balances")
          .update({ balance: newBalance, lifetime_earned: balance.lifetime_earned + 25 })
          .eq("user_id", user.id)
        await supabase.from("loqcoin_ledger").insert({
          user_id: user.id,
          transaction_type: "earn",
          amount: 25,
          balance_after: newBalance,
          source: "review",
          reference_id: review.id,
          reference_type: "review",
          description: "LoqCoins earned for verified product review",
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }

    return NextResponse.json({ success: true, review, coins_earned: isVerified ? 25 : 0 }, { status: 201 })
  } catch (error) {
    console.error("Review API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
