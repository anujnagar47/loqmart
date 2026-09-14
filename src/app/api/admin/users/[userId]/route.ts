import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { userId } = await params
  const body = await req.json()

  // Only a full admin can change role or state_scope — a sub_admin passes
  // requireAdmin() too, and without this check could PATCH its own (or
  // anyone's) role to "admin" through this same endpoint.
  const privilegedFields = ["role", "state_scope"]
  if (auth.role !== "admin" && privilegedFields.some(f => f in body)) {
    return NextResponse.json({ error: "Only admins can change role or state scope" }, { status: 403 })
  }

  const allowed: Record<string, unknown> = {}
  for (const f of ["role", "state_scope", "full_name"]) {
    if (f in body) allowed[f] = body[f]
  }
  const { error } = await auth.db.from("users").update(allowed).eq("id", userId)
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { userId } = await params

  // Protect: cannot delete self or other admins
  if (userId === auth.userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  const { data: target } = await auth.db.from("users").select("role").eq("id", userId).single()
  if (target?.role === "admin") {
    return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 400 })
  }

  // Delete from public.users first (cascade may not be set up)
  const { error: dbError } = await auth.db.from("users").delete().eq("id", userId)
  if (dbError) { console.error("Admin API error:", dbError); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }

  // Remove from auth.users so they can no longer log in
  const { error: authError } = await auth.db.auth.admin.deleteUser(userId)
  if (authError) { console.error("Admin API error:", authError); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }

  return NextResponse.json({ ok: true })
}
