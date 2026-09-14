import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { categoryId } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  for (const f of ["name", "slug", "description", "image_url", "icon", "mode", "sort_order", "is_active"]) {
    if (f in body) allowed[f] = body[f]
  }
  const { error } = await auth.db.from("categories").update(allowed).eq("id", categoryId)
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { categoryId } = await params
  const { error } = await auth.db.from("categories").delete().eq("id", categoryId)
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
