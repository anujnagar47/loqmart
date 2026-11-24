import { NextResponse } from "next/server"
import { requireFullAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireFullAdmin()
  if (!auth.authorized) return auth.response
  const db = auth.db

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [
    { data: orders },
    { data: settlements },
    { data: sellerRevenue },
    { data: prevMonthOrders },
  ] = await Promise.all([
    db.from("orders").select("id,total,payment_status,order_status,created_at,seller_id").order("created_at", { ascending: false }),
    db.from("settlements").select("*,sellers(business_name,state)").order("created_at", { ascending: false }).limit(200),
    db.from("orders")
      .select("seller_id,total,payment_status,sellers(business_name,state)")
      .eq("payment_status", "paid"),
    db.from("orders")
      .select("total,payment_status,created_at")
      .gte("created_at", lastMonthStart)
      .lt("created_at", thisMonthStart),
  ])

  const paid = (orders || []).filter((o: any) => o.payment_status === "paid")
  const totalGmv     = paid.reduce((s: number, o: any) => s + Number(o.total), 0)
  const platformFeeRate = 0.05
  const gatewayFeeRate  = 0.02
  const platformFees = totalGmv * platformFeeRate
  const gatewayFees  = totalGmv * gatewayFeeRate

  const thisMonthOrders = (orders || []).filter((o: any) => o.created_at >= thisMonthStart)
  const thisMonthGmv = thisMonthOrders.filter((o: any) => o.payment_status === "paid").reduce((s: number, o: any) => s + Number(o.total), 0)
  const lastMonthGmv = (prevMonthOrders || []).filter((o: any) => o.payment_status === "paid").reduce((s: number, o: any) => s + Number(o.total), 0)

  const sellerMap: Record<string, { business_name: string; state: string; gmv: number; fee: number; net: number }> = {}
  for (const o of sellerRevenue || []) {
    const sid   = o.seller_id
    const biz   = (o.sellers as any)?.business_name || "Unknown"
    const state = (o.sellers as any)?.state || "-"
    if (!sellerMap[sid]) sellerMap[sid] = { business_name: biz, state, gmv: 0, fee: 0, net: 0 }
    sellerMap[sid].gmv += Number(o.total)
    sellerMap[sid].fee += Number(o.total) * (platformFeeRate + gatewayFeeRate)
    sellerMap[sid].net += Number(o.total) * (1 - platformFeeRate - gatewayFeeRate)
  }
  const sellerBreakdown = Object.entries(sellerMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.gmv - a.gmv)

  return NextResponse.json({
    summary: { totalGmv, platformFees, gatewayFees, netRevenue: totalGmv - platformFees - gatewayFees, thisMonthGmv, lastMonthGmv },
    settlements: settlements || [],
    sellerBreakdown,
  })
}
