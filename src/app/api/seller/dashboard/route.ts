import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get seller record
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller account not found" }, { status: 404 })
    }

    if (seller.approval_status !== "approved") {
      return NextResponse.json({ error: "Seller account not yet approved", status: seller.approval_status }, { status: 403 })
    }

    // Stats - last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Fetch all orders for accurate stats (no artificial limit)
    const { data: orders } = await supabase
      .from("orders")
      .select("id, total, order_status, payment_status, created_at")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })

    const { data: recentOrders } = await supabase
      .from("orders")
      .select(`
        id, order_number, total, subtotal, shipping_cost, order_status, payment_status, reservation_status, shipping_address, created_at,
        order_items(quantity, price, total, product_id, variant_name, products(name, images))
      `)
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(20)

    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, price, stock, images, mode, rating, review_count, sold_count, approval_status, created_at")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })

    // Use this seller's actual commission override when admins have set one,
    // falling back to the platform-wide global rate, and only defaulting to
    // 10%/2% if no rate has been configured anywhere yet.
    const { data: sellerRate } = await supabase
      .from("commission_settings")
      .select("rate, gateway_rate")
      .eq("seller_id", seller.id)
      .eq("scope", "seller")
      .maybeSingle()
    const { data: globalRate } = sellerRate ? { data: null } : await supabase
      .from("commission_settings")
      .select("rate, gateway_rate")
      .eq("scope", "global")
      .maybeSingle()
    const effectiveRate = sellerRate || globalRate

    const totalOrders = orders?.length || 0
    // Reservations in intent-capture mode are demand signals, not seller earnings.
    const paidOrders = orders?.filter(order => order.payment_status === "paid") || []
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const platformFeeRate = effectiveRate ? Number(effectiveRate.rate) / 100 : 0.10
    const paymentGatewayRate = effectiveRate ? Number(effectiveRate.gateway_rate) / 100 : 0.02
    const grossCommission = totalRevenue * platformFeeRate
    const gatewayFee = totalRevenue * paymentGatewayRate
    const netPayable = totalRevenue - grossCommission - gatewayFee

    // Monthly breakdown
    const last30DaysOrders = paidOrders.filter(o => o.created_at >= thirtyDaysAgo)
    const monthlyRevenue = last30DaysOrders.reduce((sum, o) => sum + (o.total || 0), 0)

    // Active vs pending products
    const activeProducts = products?.filter(p => p.approval_status === "approved") || []
    const pendingProducts = products?.filter(p => p.approval_status === "pending") || []

    return NextResponse.json({
      seller: {
        ...seller,
        total_orders: totalOrders,
        total_earnings: totalRevenue,
      },
      stats: {
        totalRevenue,
        totalOrders,
        monthlyRevenue,
        monthlyOrders: (orders || []).filter(o => o.created_at >= thirtyDaysAgo).length,
        activeProducts: activeProducts.length,
        pendingProducts: pendingProducts.length,
        averageOrderValue: paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0,
        swadeshiRank: seller.swadeshi_rank,
      },
      earnings: {
        grossRevenue: totalRevenue,
        platformCommission: Math.round(grossCommission),
        paymentGatewayFee: Math.round(gatewayFee),
        netPayable: Math.round(netPayable),
        commissionRate: `${platformFeeRate * 100}%`,
        gatewayRate: `${paymentGatewayRate * 100}%`,
      },
      recentOrders: recentOrders || [],
      products: products || [],
    })
  } catch (error) {
    console.error("Seller dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { business_name, owner_name, city, state, phone, description, bank_account_number, bank_ifsc } = body

    const supabase = createServiceClient()

    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id, approval_status")
      .eq("user_id", user.id)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller account not found" }, { status: 404 })
    }

    if (seller.approval_status !== "approved") {
      return NextResponse.json({ error: "Seller account not approved" }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (business_name !== undefined) updates.business_name = business_name
    if (owner_name     !== undefined) updates.owner_name     = owner_name
    if (city           !== undefined) updates.city           = city
    if (state          !== undefined) updates.state          = state
    if (phone          !== undefined) updates.phone          = phone
    if (description    !== undefined) updates.description    = description
    if (bank_account_number !== undefined) updates.bank_account_number = bank_account_number
    if (bank_ifsc      !== undefined) updates.bank_ifsc      = bank_ifsc

    const { error: updateError } = await supabase
      .from("sellers")
      .update(updates)
      .eq("id", seller.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Seller profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
