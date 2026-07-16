import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

// GET /api/loqcoins/ledger — authenticated user's LoqCoin transaction history
export async function GET(request: Request) {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)

    const { data: ledger, error } = await supabase
      .from("loqcoin_ledger")
      .select("id, transaction_type, amount, balance_after, source, description, created_at, expires_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 })
    }

    const { data: balance } = await supabase
      .from("loqcoin_balances")
      .select("balance, lifetime_earned, lifetime_redeemed")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({ ledger: ledger || [], balance })
  } catch (error) {
    console.error("Ledger API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
