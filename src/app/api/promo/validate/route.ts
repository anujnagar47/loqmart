import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Promo code is required." }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data } = await supabase
      .from("survey_discount_codes")
      .select("id, code, description, discount_percent, free_delivery, free_order, is_used, expires_at, milestone")
      .ilike("code", code.trim())
      .maybeSingle()

    if (!data) {
      return NextResponse.json({ error: "Invalid promo code." }, { status: 404 })
    }

    if (data.is_used) {
      return NextResponse.json({ error: "This code has already been used." }, { status: 400 })
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: "This promo code has expired." }, { status: 400 })
    }

    return NextResponse.json({
      valid:            true,
      code:             data.code,
      description:      data.description,
      discount_percent: data.discount_percent,
      free_delivery:    data.free_delivery,
      free_order:       data.free_order,
    })
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
