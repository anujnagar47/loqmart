import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function POST(req: Request, { params }: { params: Promise<{ sellerId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { sellerId } = await params
  const db = auth.db

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

  const { data: seller } = await db.from("sellers").select("user_id").eq("id", sellerId).single()
  if (seller?.user_id) {
    await db.from("users").update({ role: "seller" }).eq("id", seller.user_id)
    await db.from("notifications").insert({
      user_id: seller.user_id, type: "seller_approved",
      title: "Your Seller Account is Approved!", message: "You can now list products on LoqMart.",
      data: { seller_id: sellerId },
    })
  }

  void auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "seller.approve",
    target_type: "seller", target_id: sellerId,
    new_value: { approval_status: "approved" },
  })

  return NextResponse.json({ success: true, status: "approved" })
}
