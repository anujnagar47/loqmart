import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const sessionClient = await createClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 })

    const { code, order_id } = await req.json()
    if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 })

    const supabase = createServiceClient()

    const { data } = await supabase
      .from("survey_discount_codes")
      .select("id, is_used, expires_at")
      .ilike("code", code.trim())
      .maybeSingle()

    if (!data)          return NextResponse.json({ error: "Invalid code."       }, { status: 404 })
    if (data.is_used)   return NextResponse.json({ error: "Already used."       }, { status: 400 })
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: "Code expired." }, { status: 400 })
    }

    await supabase
      .from("survey_discount_codes")
      .update({
        is_used:          true,
        used_at:          new Date().toISOString(),
        used_by_order_id: order_id || null,
      })
      .eq("id", data.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
