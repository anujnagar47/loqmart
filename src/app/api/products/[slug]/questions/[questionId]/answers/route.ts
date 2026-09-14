import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

// POST /api/products/[slug]/questions/[questionId]/answers — answer a question
// (any authenticated user can answer, matching a community-Q&A pattern; the
// "is_seller" badge is derived server-side from real seller ownership, never
// trusted from the client).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  try {
    const { slug, questionId } = await params
    const sessionClient = await createClient()
    const supabase = createServiceClient()

    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const answer = typeof body.answer === "string" ? body.answer.trim() : ""

    if (answer.length < 2) {
      return NextResponse.json({ error: "Answer is too short" }, { status: 400 })
    }
    if (answer.length > 1000) {
      return NextResponse.json({ error: "Answer must be under 1000 characters" }, { status: 400 })
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, seller_id")
      .eq("slug", slug)
      .eq("approval_status", "approved")
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const { data: question, error: questionError } = await supabase
      .from("product_questions")
      .select("id")
      .eq("id", questionId)
      .eq("product_id", product.id)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const { data: seller } = await supabase
      .from("sellers")
      .select("id")
      .eq("id", product.seller_id)
      .eq("user_id", user.id)
      .maybeSingle()

    const { data: created, error: insertError } = await supabase
      .from("product_answers")
      .insert({ question_id: questionId, user_id: user.id, answer, is_seller: !!seller })
      .select("*, users(full_name)")
      .single()

    if (insertError || !created) {
      console.error("Answer insert error:", insertError)
      return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 })
    }

    return NextResponse.json({ success: true, answer: created }, { status: 201 })
  } catch (error) {
    console.error("Product answers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
