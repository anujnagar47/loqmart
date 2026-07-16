import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { data, error } = await auth.db
    .from("blog_posts")
    .select("id, title, slug, excerpt, is_published, state, state_code, category, author, read_time, image_url, view_count, published_at, created_at")
    .order("created_at", { ascending: false })
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ posts: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ posts: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const body = await req.json()
  const { title, slug, excerpt, content, image_url, state, state_code, category, read_time, author } = body

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 })

  const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now()

  const { data, error } = await auth.db
    .from("blog_posts")
    .insert({
      title, slug: finalSlug,
      excerpt: excerpt || title,
      content: content || "",
      image_url: image_url || "",
      state: state || null,
      state_code: state_code || null,
      category: category || "general",
      read_time: read_time || "5 min",
      author: author || "LoqMart Editorial",
      is_published: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data }, { status: 201 })
}
