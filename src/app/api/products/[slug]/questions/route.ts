import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

// POST /api/products/[slug]/questions — ask a question (authenticated buyers only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const sessionClient = await createClient()
    const supabase = createServiceClient()

    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const question = typeof body.question === "string" ? body.question.trim() : ""

    if (question.length < 5) {
      return NextResponse.json({ error: "Question must be at least 5 characters" }, { status: 400 })
    }
    if (question.length > 500) {
      return NextResponse.json({ error: "Question must be under 500 characters" }, { status: 400 })
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .eq("approval_status", "approved")
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const { data: created, error: insertError } = await supabase
      .from("product_questions")
      .insert({ product_id: product.id, user_id: user.id, question })
      .select("*, users(full_name)")
      .single()

    if (insertError || !created) {
      console.error("Question insert error:", insertError)
      return NextResponse.json({ error: "Failed to submit question" }, { status: 500 })
    }

    return NextResponse.json({ success: true, question: { ...created, product_answers: [] } }, { status: 201 })
  } catch (error) {
    console.error("Product questions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
