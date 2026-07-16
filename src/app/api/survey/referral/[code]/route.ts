import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

const MILESTONES = [
  { key: "10_referrals", threshold: 10, label: "50% off your first order"         },
  { key: "20_referrals", threshold: 20, label: "50% off + free delivery"           },
  { key: "40_referrals", threshold: 40, label: "First order completely free"       },
]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: rawCode } = await params
    const code = rawCode.toUpperCase()
    const supabase = createServiceClient()

    const { data: survey } = await supabase
      .from("survey_responses")
      .select("id, referral_code, name, referral_count, milestones_reached, created_at")
      .eq("referral_code", code)
      .maybeSingle()

    if (!survey) {
      return NextResponse.json({ error: "Referral code not found" }, { status: 404 })
    }

    const { data: discounts } = await supabase
      .from("survey_discount_codes")
      .select("*")
      .eq("survey_response_id", survey.id)
      .order("created_at", { ascending: true })

    const reached: string[] = survey.milestones_reached || []
    const nextMilestone = MILESTONES.find(m => !reached.includes(m.key)) || null

    return NextResponse.json({
      referral_count:     survey.referral_count || 0,
      milestones_reached: reached,
      discounts:          discounts || [],
      next_milestone:     nextMilestone,
      member_since:       survey.created_at,
    })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
