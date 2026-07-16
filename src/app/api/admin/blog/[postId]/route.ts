import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { postId } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  for (const f of ["title", "slug", "excerpt", "content", "is_published", "image_url", "state", "state_code", "category", "read_time", "author"]) {
    if (f in body) allowed[f] = body[f]
  }
  if (body.is_published === true) allowed.published_at = new Date().toISOString()
  const { error } = await auth.db.from("blog_posts").update(allowed).eq("id", postId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { postId } = await params
  const { error } = await auth.db.from("blog_posts").delete().eq("id", postId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
