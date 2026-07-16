import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const db = auth.db

  const [
    { data: globalCommission },
    { data: sellers },
    { data: products },
    { data: orders },
    { data: users },
    { data: categories },
  ] = await Promise.all([
    db.from("commission_settings").select("*").eq("scope", "global").single(),
    db.from("sellers").select("id, approval_status"),
    db.from("products").select("id, approval_status, mode"),
    db.from("orders").select("id, total, payment_status"),
    db.from("users").select("id, role, created_at").order("created_at", { ascending: false }).limit(1),
    db.from("categories").select("id"),
  ])

  const totalGmv = (orders || [])
    .filter((o: any) => o.payment_status === "paid")
    .reduce((s: number, o: any) => s + Number(o.total), 0)

  return NextResponse.json({
    commission: globalCommission || { rate: 5, gateway_rate: 2 },
    stats: {
      sellers:    (sellers || []).length,
      approved:   (sellers || []).filter((s: any) => s.approval_status === "approved").length,
      products:   (products || []).length,
      handmade:   (products || []).filter((p: any) => p.mode === "handmade").length,
      orders:     (orders || []).length,
      revenue:    totalGmv,
      users:      (users || []).length,
      categories: (categories || []).length,
    },
  })
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const body = await req.json()
  const { global_rate, gateway_rate } = body

  if (global_rate != null) {
    const rate    = Math.min(Math.max(Number(global_rate), 0), 50)
    const gRate   = gateway_rate != null ? Math.min(Math.max(Number(gateway_rate), 0), 10) : undefined
    const update: Record<string, unknown> = { rate, effective_from: new Date().toISOString(), changed_by: auth.userId }
    if (gRate != null) update.gateway_rate = gRate

    const { error } = await auth.db
      .from("commission_settings")
      .update(update)
      .eq("scope", "global")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try { await auth.db.from("admin_logs").insert({
      admin_id: auth.userId, action: "commission.update",
      target_type: "commission_settings",
      new_value: { scope: "global", rate, gateway_rate: gRate },
    }) } catch { /* non-critical audit log */ }
  }

  return NextResponse.json({ ok: true })
}
