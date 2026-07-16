import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { sellerId } = await params
  const db = auth.db

  const [{ data: seller }, { data: products }, { data: orders }, { data: commission }] = await Promise.all([
    db.from("sellers").select("*").eq("id", sellerId).single(),
    db.from("products").select("id, name, approval_status, price, stock, sold_count").eq("seller_id", sellerId),
    db.from("orders").select("id, total, payment_status, order_status").eq("seller_id", sellerId),
    db.from("commission_settings").select("*").eq("seller_id", sellerId).eq("scope", "seller").maybeSingle(),
  ])

  const totalRevenue = orders?.filter(o => o.payment_status === "paid").reduce((s, o) => s + (o.total || 0), 0) || 0
  const activeProducts = products?.filter(p => p.approval_status === "approved").length || 0

  return NextResponse.json({
    seller,
    stats: { totalRevenue, totalOrders: orders?.length || 0, activeProducts, totalProducts: products?.length || 0 },
    products: products?.slice(0, 10) || [],
    commission: commission || null
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { sellerId } = await params
  const { action } = await req.json()
  const newStatus = action === "approve" ? "approved" : "rejected"
  const { error } = await auth.db.from("sellers").update({
    approval_status: newStatus,
    approved_at: action === "approve" ? new Date().toISOString() : null,
    approved_by: action === "approve" ? auth.userId : null,
  }).eq("id", sellerId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, status: newStatus })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { sellerId } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  for (const f of ["swadeshi_rank", "approval_status", "rejection_reason"]) {
    if (f in body) allowed[f] = body[f]
  }
  const { error } = await auth.db.from("sellers").update(allowed).eq("id", sellerId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
