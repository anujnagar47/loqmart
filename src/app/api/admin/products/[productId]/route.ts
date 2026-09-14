import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { productId } = await params
  const { action } = await req.json()
  const newStatus = action === "approve" ? "approved" : "rejected"
  const { error } = await auth.db.from("products").update({
    approval_status: newStatus,
    approved_at: action === "approve" ? new Date().toISOString() : null,
    approved_by: action === "approve" ? auth.userId : null,
  }).eq("id", productId)
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ success: true, status: newStatus })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { productId } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  for (const f of ["is_featured", "approval_status", "name", "price", "stock", "description"]) {
    if (f in body) allowed[f] = body[f]
  }
  const { error } = await auth.db.from("products").update(allowed).eq("id", productId)
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { productId } = await params
  const { error } = await auth.db.from("products").delete().eq("id", productId)
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
