import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { data } = await auth.db
    .from("commission_settings")
    .select("*,categories(name),sellers(business_name)")
    .order("scope")
  return NextResponse.json({ settings: data || [] })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const body = await req.json()
  const { scope, category_id, seller_id, rate, gateway_rate, notes } = body
  if (!scope || rate == null) return NextResponse.json({ error: "scope and rate required" }, { status: 400 })
  const { data, error } = await auth.db.from("commission_settings").upsert({
    scope, category_id: category_id || null, seller_id: seller_id || null,
    rate: Number(rate), gateway_rate: Number(gateway_rate || 2),
    notes, changed_by: auth.userId, effective_from: new Date().toISOString(),
  }, { onConflict: "scope,category_id,seller_id" }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  try { await auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "commission.update", target_type: "commission_settings",
    new_value: { scope, rate, gateway_rate },
  }) } catch { /* non-critical audit log */ }
  return NextResponse.json({ setting: data })
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { error } = await auth.db.from("commission_settings").delete().eq("id", id).neq("scope", "global")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
