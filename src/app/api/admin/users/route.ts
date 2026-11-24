import { NextRequest, NextResponse } from "next/server"
import { requireFullAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET() {
  const auth = await requireFullAdmin()
  if (!auth.authorized) return auth.response
  const { data, error } = await auth.db
    .from("users")
    .select("id, email, full_name, role, state_scope, created_at")
    .order("created_at", { ascending: false })
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ users: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireFullAdmin()
  if (!auth.authorized) return auth.response

  const { email, password, full_name, role, state_scope } = await req.json()
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "email, password, full_name required" }, { status: 400 })
  }

  // Only a full admin can create a privileged account (admin/sub_admin) or
  // set a state_scope — otherwise a sub_admin could just create a fresh
  // admin account instead of self-promoting through PATCH.
  if (auth.role !== "admin" && ((role && role !== "buyer" && role !== "seller") || state_scope)) {
    return NextResponse.json({ error: "Only admins can create admin/sub_admin accounts or set state scope" }, { status: 403 })
  }

  const db = createServiceClient()

  // Create Supabase auth user (handle_new_user trigger auto-creates public.users)
  const { data: authUser, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: role || "buyer" },
  })

  if (authError) { console.error("Admin API error:", authError); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }

  // Set role + state_scope explicitly (trigger may default to 'buyer')
  const update: Record<string, unknown> = { role: role || "buyer", full_name }
  if (state_scope) update.state_scope = state_scope
  await db.from("users").update(update).eq("id", authUser.user.id)

  return NextResponse.json({ ok: true, userId: authUser.user.id }, { status: 201 })
}
