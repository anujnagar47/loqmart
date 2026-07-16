import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function POST(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { productId } = await params

  const { error } = await auth.db.from("products").update({
    approval_status: "approved",
    approved_at: new Date().toISOString(),
    approved_by: auth.userId,
  }).eq("id", productId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: product } = await auth.db.from("products").select("name, seller_id").eq("id", productId).single()
  if (product?.seller_id) {
    const { data: seller } = await auth.db.from("sellers").select("user_id").eq("id", product.seller_id).single()
    if (seller?.user_id) {
      await auth.db.from("notifications").insert({
        user_id: seller.user_id, type: "product_approved",
        title: "Product Approved!", message: `Your product "${product.name}" is now live on LoqMart.`,
        data: { product_id: productId },
      })
    }
  }

  void auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "product.approve",
    target_type: "product", target_id: productId,
    new_value: { approval_status: "approved" },
  })

  return NextResponse.json({ success: true, status: "approved" })
}
