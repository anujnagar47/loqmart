import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { sendSellerApprovalEmail } from "@/lib/email"

export async function POST(req: Request, { params }: { params: Promise<{ sellerId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { sellerId } = await params
  const db = auth.db

  if (auth.role === "sub_admin" && auth.stateScope) {
    const { data: sellerCheck } = await db.from("sellers").select("state_code").eq("id", sellerId).single()
    if (sellerCheck?.state_code !== auth.stateScope) {
      return NextResponse.json({ error: "Forbidden — seller outside your assigned state" }, { status: 403 })
    }
  }

  let body: { rate?: number; gateway_rate?: number; notes?: string } = {}
  try {
    body = await req.json()
  } catch {
    // Body is optional
  }

  const { error } = await db.from("sellers").update({
    approval_status: "approved",
    approved_at: new Date().toISOString(),
    approved_by: auth.userId,
  }).eq("id", sellerId)

  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }

  // Save custom seller commission setting if supplied
  if (body.rate != null) {
    await db.from("commission_settings").upsert({
      scope: "seller",
      seller_id: sellerId,
      rate: Number(body.rate),
      gateway_rate: Number(body.gateway_rate || 2),
      notes: body.notes || "Initial rate set during approval",
      changed_by: auth.userId,
      effective_from: new Date().toISOString(),
    }, { onConflict: "scope,category_id,seller_id" })
  }

  const { data: seller } = await db.from("sellers").select("user_id, business_name, users(email)").eq("id", sellerId).single()
  if (seller?.user_id) {
    await db.from("users").update({ role: "seller" }).eq("id", seller.user_id)
    await db.from("notifications").insert({
      user_id: seller.user_id, type: "seller_approved",
      title: "Your Seller Account is Approved!", message: "You can now list products on LoqMart.",
      data: { seller_id: sellerId },
    })
    const sellerEmail = (seller as unknown as { users: { email: string } | null }).users?.email
    if (sellerEmail) {
      await sendSellerApprovalEmail(sellerEmail, seller.business_name, true)
    }
  }

  void auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "seller.approve",
    target_type: "seller", target_id: sellerId,
    new_value: { approval_status: "approved" },
  })

  return NextResponse.json({ success: true, status: "approved" })
}
