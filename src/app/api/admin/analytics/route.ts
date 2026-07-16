import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const db = auth.db

  const [
    { data: sellers },
    { data: orders },
    { data: products },
    { data: users },
  ] = await Promise.all([
    db.from("sellers").select("id, state, approval_status, created_at"),
    db.from("orders").select("id, total, order_status, payment_status, created_at"),
    db.from("products").select("id, approval_status, mode, category_id, created_at"),
    db.from("users").select("id, role, created_at"),
  ])

  const stateMap: Record<string, number> = {}
  for (const s of sellers || []) {
    if (s.state) stateMap[s.state] = (stateMap[s.state] || 0) + 1
  }
  const stateDist = Object.entries(stateMap)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const orderStatusMap: Record<string, number> = {}
  for (const o of orders || []) {
    const s = o.order_status || "unknown"
    orderStatusMap[s] = (orderStatusMap[s] || 0) + 1
  }

  const now = new Date()
  const monthlyRevenue: { month: string; revenue: number; orders: number }[] = []
  const monthlySignups: { month: string; count: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" })
    const monthStart = d.toISOString()
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const monthOrders = (orders || []).filter(o => o.created_at >= monthStart && o.created_at <= monthEnd)
    monthlyRevenue.push({ month: label, revenue: monthOrders.reduce((s, o) => s + (o.total || 0), 0), orders: monthOrders.length })
    monthlySignups.push({ month: label, count: (users || []).filter(u => u.created_at >= monthStart && u.created_at <= monthEnd).length })
  }

  const handmade   = (products || []).filter(p => p.mode === "handmade").length
  const machineMade = (products || []).filter(p => p.mode === "machine_made").length

  return NextResponse.json({
    stateDist, orderStatusMap, monthlyRevenue, monthlySignups,
    productSplit:  { handmade, machineMade },
    sellerFunnel: {
      approved: (sellers || []).filter(s => s.approval_status === "approved").length,
      pending:  (sellers || []).filter(s => s.approval_status === "pending").length,
      rejected: (sellers || []).filter(s => s.approval_status === "rejected").length,
    },
    totals: {
      sellers:  sellers?.length  ?? 0,
      orders:   orders?.length   ?? 0,
      products: products?.length ?? 0,
      users:    users?.length    ?? 0,
      revenue:  (orders || []).reduce((s, o) => s + (o.total || 0), 0),
    },
  })
}
