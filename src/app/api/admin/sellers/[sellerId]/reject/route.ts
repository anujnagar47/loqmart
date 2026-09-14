import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { sendSellerApprovalEmail } from "@/lib/email"

export async function POST(req: Request, { params }: { params: Promise<{ sellerId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { sellerId } = await params

  if (auth.role === "sub_admin" && auth.stateScope) {
    const { data: sellerCheck } = await auth.db.from("sellers").select("state_code").eq("id", sellerId).single()
    if (sellerCheck?.state_code !== auth.stateScope) {
      return NextResponse.json({ error: "Forbidden — seller outside your assigned state" }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => ({}))
  const reason = body.reason || "Application did not meet requirements"

  const { error } = await auth.db.from("sellers").update({
    approval_status: "rejected", rejection_reason: reason,
  }).eq("id", sellerId)
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }

  const { data: seller } = await auth.db.from("sellers").select("user_id, business_name, users(email)").eq("id", sellerId).single()
  if (seller?.user_id) {
    await auth.db.from("notifications").insert({
      user_id: seller.user_id, type: "seller_rejected",
      title: "Seller Application Update",
      message: `Your application for ${seller.business_name} was not approved. Reason: ${reason}.`,
      data: { seller_id: sellerId, reason },
    })
    const sellerEmail = (seller as unknown as { users: { email: string } | null }).users?.email
    if (sellerEmail) {
      await sendSellerApprovalEmail(sellerEmail, seller.business_name, false, reason)
    }
  }

  void auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "seller.reject",
    target_type: "seller", target_id: sellerId,
    new_value: { approval_status: "rejected", reason },
  })

  return NextResponse.json({ success: true, status: "rejected" })
}
