import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export type AdminAuth =
  | { authorized: true; db: ReturnType<typeof createServiceClient>; userId: string; role: "admin" | "sub_admin"; stateScope: string | null }
  | { authorized: false; response: NextResponse }

export async function requireAdmin(): Promise<AdminAuth> {
  const supabase = await createClient()
  // Use getUser() (server-validated) instead of getSession() (client cookie, spoofable)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  // Use service client to bypass RLS for the role check itself
  const db = createServiceClient()
  const { data: userRecord } = await db
    .from("users")
    .select("role, state_scope")
    .eq("id", user.id)
    .single()

  if (userRecord?.role !== "admin" && userRecord?.role !== "sub_admin") {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { authorized: true, db, userId: user.id, role: userRecord.role, stateScope: userRecord.state_scope ?? null }
}

/** Restrict platform-wide data and controls to full administrators. */
export async function requireFullAdmin(): Promise<AdminAuth> {
  const auth = await requireAdmin()
  if (!auth.authorized || auth.role === "admin") return auth
  return {
    authorized: false,
    response: NextResponse.json({ error: "Full administrator access required" }, { status: 403 }),
  }
}
