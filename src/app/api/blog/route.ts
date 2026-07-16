import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { mapBlogPostRow } from "@/lib/blog"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const state = searchParams.get("state")
    const limit = parseInt(searchParams.get("limit") || "20")

    const supabase = createServiceClient()

    let query = supabase.from("blog_posts").select("*").eq("is_published", true).order('created_at', { ascending: false }).limit(limit)

    if (category && category !== "All") {
      query = query.ilike("category", category)
    }
    
    if (state) {
      query = query.ilike("state_code", state)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("Supabase blog fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      posts: (posts || []).map(mapBlogPostRow),
      total: posts?.length || 0,
    })
  } catch (error) {
    console.error("Blog API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
