import { NextResponse } from "next/server"
import { requireFullAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireFullAdmin()
  if (!auth.authorized) return auth.response
  const db = auth.db

  const [
    { data: sellers },
    { data: products },
    { data: orders },
    { data: users },
    { data: pendingSellers },
    { data: pendingProducts },
    { data: recentOrders },
  ] = await Promise.all([
    db.from("sellers").select("id, approval_status"),
    db.from("products").select("id, approval_status"),
    db.from("orders").select("id, total, order_status"),
    db.from("users").select("id"),
    db.from("sellers").select("id, business_name, owner_name, state, approval_status, created_at").eq("approval_status", "pending").order("created_at", { ascending: false }).limit(10),
    db.from("products").select("id, name, price, state_code, mode, approval_status, seller_id").eq("approval_status", "pending").order("created_at", { ascending: false }).limit(10),
    db.from("orders").select("id, order_number, total, payment_status, order_status, created_at").order("created_at", { ascending: false }).limit(20),
  ])

  return NextResponse.json({
    stats: {
      totalSellers:         sellers?.filter(s => s.approval_status === "approved").length ?? 0,
      pendingSellersCount:  sellers?.filter(s => s.approval_status === "pending").length  ?? 0,
      totalProducts:        products?.filter(p => p.approval_status === "approved").length ?? 0,
      pendingProductsCount: products?.filter(p => p.approval_status === "pending").length  ?? 0,
      totalOrders:          orders?.length ?? 0,
      totalRevenue:         orders?.reduce((s, o) => s + (o.total || 0), 0) ?? 0,
      totalUsers:           users?.length ?? 0,
    },
    pendingSellers:  pendingSellers  || [],
    pendingProducts: pendingProducts || [],
    recentOrders:    recentOrders    || [],
  })
}
