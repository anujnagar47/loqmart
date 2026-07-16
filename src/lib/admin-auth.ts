import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export type AdminAuth =
  | { authorized: true; db: ReturnType<typeof createServiceClient>; userId: string }
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

  return { authorized: true, db, userId: user.id }
}
