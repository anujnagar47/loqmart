import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function POST(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { productId } = await params
  const body = await req.json().catch(() => ({}))
  const reason = body.reason || "Product did not meet listing requirements"

  const { error } = await auth.db.from("products").update({
    approval_status: "rejected", rejection_reason: reason,
  }).eq("id", productId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: product } = await auth.db.from("products").select("name, seller_id").eq("id", productId).single()
  if (product?.seller_id) {
    const { data: seller } = await auth.db.from("sellers").select("user_id").eq("id", product.seller_id).single()
    if (seller?.user_id) {
      await auth.db.from("notifications").insert({
        user_id: seller.user_id, type: "product_rejected",
        title: "Product Listing Update",
        message: `Your product "${product.name}" was not approved. Reason: ${reason}. Please update and resubmit.`,
        data: { product_id: productId, reason },
      })
    }
  }

  void auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "product.reject",
    target_type: "product", target_id: productId,
    new_value: { approval_status: "rejected", reason },
  })

  return NextResponse.json({ success: true, status: "rejected" })
}
