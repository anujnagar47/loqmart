import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const url    = new URL(req.url)
  const action = url.searchParams.get("action")
  const limit  = Math.min(Number(url.searchParams.get("limit") || 200), 500)

  let query = auth.db.from("admin_logs")
    .select("*,users!admin_logs_admin_id_fkey(full_name,email)")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (action) query = query.ilike("action", `%${action}%`)

  const { data, error } = await query
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ logs: data || [] })
}
