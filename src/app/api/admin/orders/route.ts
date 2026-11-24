import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

const LIST_FIELDS = "id, order_number, total, payment_status, order_status, reservation_status, created_at, users!orders_user_id_fkey(email,full_name)"
const EXPORT_FIELDS = "id, order_number, total, payment_status, order_status, reservation_status, created_at, shipping_address, users!orders_user_id_fkey(email,full_name), addresses!orders_address_id_fkey(name,phone,address_line1,address_line2,city,state,pincode), order_items(quantity,price,total,variant_name,products(name))"

function csvCell(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""')}"` }

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  if (auth.role === "sub_admin" && !auth.stateScope) return NextResponse.json({ error: "A state scope is required for sub-admin order access." }, { status: 403 })
  const scoped = auth.role === "sub_admin" && auth.stateScope
  const params = request.nextUrl.searchParams

  if (params.get("format") === "csv") {
    const rows: any[] = []
    const pageSize = 1000
    for (let offset = 0; ; offset += pageSize) {
      const sellerJoin = scoped ? "sellers!orders_seller_id_fkey!inner(business_name,state_code)" : "sellers!orders_seller_id_fkey(business_name,state_code)"
      let query = auth.db.from("orders").select(`${EXPORT_FIELDS},${sellerJoin}`).order("created_at", { ascending: false }).range(offset, offset + pageSize - 1)
      if (scoped) query = query.eq("sellers.state_code", auth.stateScope)
      const { data, error } = await query
      if (error) return NextResponse.json({ error: "Could not export orders." }, { status: 500 })
      rows.push(...(data || []))
      if (!data || data.length < pageSize) break
    }
    const header = ["Order ID", "Created At", "Status", "Customer Name", "Phone", "Pincode", "Full Address", "Seller Name", "Product Title", "Variant", "Quantity", "Line Total"]
    const lines = [header.map(csvCell).join(",")]
    for (const order of rows) {
      const shipping = order.shipping_address || {}
      const address = order.addresses || {}
      const fullAddress = [shipping.address_line1 || address.address_line1, shipping.address_line2 || address.address_line2, shipping.city || address.city, shipping.state || address.state, shipping.pincode || address.pincode].filter(Boolean).join(", ")
      const orderLines = order.order_items?.length ? order.order_items : [null]
      for (const item of orderLines) lines.push([
        order.id, order.created_at, order.reservation_status || order.order_status,
        shipping.name || order.users?.full_name || address.name, shipping.phone || address.phone,
        shipping.pincode || address.pincode, fullAddress, order.sellers?.business_name,
        item?.products?.name, item?.variant_name, item?.quantity, item?.total,
      ].map(csvCell).join(","))
    }
    return new NextResponse(lines.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="loqmart-orders-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } })
  }

  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(params.get("limit") || "50", 10) || 50))
  const sellerJoin = scoped ? "sellers!orders_seller_id_fkey!inner(business_name,state_code)" : "sellers!orders_seller_id_fkey(business_name,state_code)"
  let query = auth.db.from("orders").select(`${LIST_FIELDS},${sellerJoin}`, { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * limit, page * limit - 1)
  if (scoped) query = query.eq("sellers.state_code", auth.stateScope)
  const { data, error, count } = await query
  if (error) { console.error("Admin orders API error:", error); return NextResponse.json({ error: "Could not load orders." }, { status: 500 }) }
  return NextResponse.json({ orders: data || [], page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) })
}
