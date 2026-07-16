import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const db = auth.db

  const { data, error } = await db
    .from("sellers")
    .select("id, business_name, owner_name, state, state_code, gstin, swadeshi_rank, approval_status, created_at, user_id")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sellers: data || [] })
}
