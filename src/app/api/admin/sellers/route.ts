import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const db = auth.db

  let query = db
    .from("sellers")
    .select("id, business_name, owner_name, state, state_code, gstin, swadeshi_rank, approval_status, created_at, user_id")
    .order("created_at", { ascending: false })

  // A sub_admin with a state_scope only ever sees sellers from that state —
  // this used to be a UI-only claim with no enforcement.
  if (auth.role === "sub_admin" && auth.stateScope) {
    query = query.eq("state_code", auth.stateScope)
  }

  const { data, error } = await query

  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ sellers: data || [] })
}
