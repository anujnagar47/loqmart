import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { data, error } = await auth.db
    .from("notifications")
    .select("id, user_id, type, title, message, is_read, created_at, users(email, full_name)")
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const body = await req.json()
  const { target, type, title, message, role } = body

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
  }

  const db = auth.db

  if (target === "all") {
    const { data: users } = await db.from("users").select("id")
    if (!users || users.length === 0) return NextResponse.json({ sent: 0 })
    const rows = users.map(u => ({ user_id: u.id, type: type || "admin_broadcast", title, message, data: { broadcast: true } }))
    const { error } = await db.from("notifications").insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sent: rows.length })
  }

  if (target === "role" && role) {
    const { data: users } = await db.from("users").select("id").eq("role", role)
    if (!users || users.length === 0) return NextResponse.json({ sent: 0 })
    const rows = users.map(u => ({ user_id: u.id, type: type || "admin_broadcast", title, message, data: { broadcast: true, role } }))
    const { error } = await db.from("notifications").insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sent: rows.length })
  }

  if (target === "sellers") {
    const { data: sellers } = await db.from("sellers").select("user_id").eq("approval_status", "approved")
    if (!sellers || sellers.length === 0) return NextResponse.json({ sent: 0 })
    const rows = sellers.map(s => ({ user_id: s.user_id, type: type || "admin_broadcast", title, message, data: { broadcast: true, target: "sellers" } }))
    const { error } = await db.from("notifications").insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sent: rows.length })
  }

  return NextResponse.json({ error: "Invalid target" }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  const { error } = await auth.db.from("notifications").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
