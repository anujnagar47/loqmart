import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sanitizeInternalPath } from "@/lib/navigation"

// Handles the redirect back from Supabase OAuth (Google, etc). Without this route
// the "code" in the URL is never exchanged for a session, so OAuth login silently fails.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = sanitizeInternalPath(searchParams.get("next")) || "/account"

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=oauth_missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session?.user) {
    return NextResponse.redirect(`${origin}/auth?error=oauth_failed`)
  }

  const user = data.session.user

  const { data: existing } = await supabase.from("users").select("id, role").eq("id", user.id).single()
  if (!existing) {
    const meta = user.user_metadata || {}
    await supabase.from("users").insert({
      id: user.id,
      email: user.email || "",
      full_name: meta.full_name || meta.name || user.email?.split("@")[0] || "LoqMart User",
      role: meta.role === "seller" ? "seller" : "buyer",
    })
    await supabase.from("loqcoin_balances").insert({ user_id: user.id, balance: 0, lifetime_earned: 0, lifetime_redeemed: 0 })
  }

  const role = existing?.role
  const destination = role === "admin" || role === "sub_admin" ? "/admin" : next

  return NextResponse.redirect(`${origin}${destination}`)
}
