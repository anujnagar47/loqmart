import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { sendDiscountCodeEmail } from "@/lib/email"

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function randomString(len: number): string {
  let s = ""
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)]
  return s
}

async function uniqueReferralCode(supabase: ReturnType<typeof createServiceClient>): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = "LQ" + randomString(6)
    const { data } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle()
    if (!data) return code
  }
  throw new Error("Could not generate a unique referral code")
}

async function uniqueDiscountCode(
  supabase: ReturnType<typeof createServiceClient>,
  prefix: string
): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = prefix + randomString(8)
    const { data } = await supabase
      .from("survey_discount_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle()
    if (!data) return code
  }
  throw new Error("Could not generate a unique discount code")
}

const MILESTONES = [
  {
    key: "10_referrals",
    threshold: 10,
    prefix: "LQ50-",
    discount_percent: 50,
    free_delivery: false,
    free_order: false,
    description: "50% off your first LoqMart order — 10 referrals milestone",
  },
  {
    key: "20_referrals",
    threshold: 20,
    prefix: "LQ50D-",
    discount_percent: 50,
    free_delivery: true,
    free_order: false,
    description: "50% off + free delivery — 20 referrals milestone",
  },
  {
    key: "40_referrals",
    threshold: 40,
    prefix: "LQFREE-",
    discount_percent: 100,
    free_delivery: true,
    free_order: true,
    description: "First order completely free — 40 referrals milestone",
  },
] as const

// ─── POST: Submit survey ──────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email, name, city_state,
      q1_frequency, q2_origin, q3_amazon,
      q4_choose_local, q5_preference,
      q6_premium, q7_categories,
      referred_by,
    } = body

    if (!email || !name || !city_state || !q1_frequency || !q2_origin || !q3_amazon || !q4_choose_local || !q5_preference) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 })
    }

    const emailLower = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Duplicate check
    const { data: existing } = await supabase
      .from("survey_responses")
      .select("id, referral_code")
      .ilike("email", emailLower)
      .maybeSingle()

    if (existing) {
      const { data: existingDiscounts } = await supabase
        .from("survey_discount_codes")
        .select("*")
        .ilike("email", emailLower)
        .order("created_at", { ascending: true })
      return NextResponse.json({
        already_submitted: true,
        referral_code: existing.referral_code,
        discounts: existingDiscounts || [],
      })
    }

    // Validate referrer
    let referrer: any = null
    const refCodeRaw = typeof referred_by === "string" ? referred_by.trim().toUpperCase() : ""
    if (refCodeRaw) {
      const { data } = await supabase
        .from("survey_responses")
        .select("id, email, referral_count, milestones_reached")
        .eq("referral_code", refCodeRaw)
        .maybeSingle()
      referrer = data
    }

    const referral_code = await uniqueReferralCode(supabase)

    const { data: response, error: insertErr } = await supabase
      .from("survey_responses")
      .insert({
        email: emailLower,
        name: name.trim(),
        city_state: city_state.trim(),
        q1_frequency,
        q2_origin,
        q3_amazon,
        q4_choose_local,
        q5_preference,
        q6_premium: q6_premium || null,
        q7_categories: Array.isArray(q7_categories) ? q7_categories : [],
        referral_code,
        referred_by: referrer ? refCodeRaw : null,
        referral_count: 0,
        milestones_reached: [],
      })
      .select()
      .single()

    if (insertErr) {
      // Unique constraint on lower(email) — concurrent submission with same email
      if (insertErr.code === "23505") {
        const { data: race } = await supabase
          .from("survey_responses").select("id, referral_code").ilike("email", emailLower).maybeSingle()
        if (race) {
          const { data: raceDiscounts } = await supabase
            .from("survey_discount_codes").select("*").ilike("email", emailLower).order("created_at", { ascending: true })
          return NextResponse.json({ already_submitted: true, referral_code: race.referral_code, discounts: raceDiscounts || [] })
        }
      }
      console.error("survey insert:", insertErr)
      return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 })
    }

    // Base 5% code for submitter
    const baseCode = await uniqueDiscountCode(supabase, "LQ5-")
    await supabase.from("survey_discount_codes").insert({
      survey_response_id: response.id,
      email: emailLower,
      code: baseCode,
      description: "5% off your first LoqMart order",
      discount_percent: 5,
      free_delivery: false,
      free_order: false,
      milestone: "submission",
    })
    await sendDiscountCodeEmail(emailLower, baseCode, "5% off your first LoqMart order")

    // Update referrer
    if (referrer) {
      const newCount = (referrer.referral_count || 0) + 1
      const prevMilestones: string[] = referrer.milestones_reached || []
      const newMilestoneRows: any[] = []
      const newMilestoneKeys: string[] = []

      for (const m of MILESTONES) {
        if (newCount >= m.threshold && !prevMilestones.includes(m.key)) {
          const mCode = await uniqueDiscountCode(supabase, m.prefix)
          newMilestoneRows.push({
            survey_response_id: referrer.id,
            email: referrer.email,
            code: mCode,
            description: m.description,
            discount_percent: m.discount_percent,
            free_delivery: m.free_delivery,
            free_order: m.free_order,
            milestone: m.key,
          })
          newMilestoneKeys.push(m.key)
        }
      }

      await supabase
        .from("survey_responses")
        .update({
          referral_count: newCount,
          milestones_reached: [...prevMilestones, ...newMilestoneKeys],
        })
        .eq("id", referrer.id)

      if (newMilestoneRows.length > 0) {
        await supabase.from("survey_discount_codes").insert(newMilestoneRows)
        for (const row of newMilestoneRows) {
          await sendDiscountCodeEmail(row.email, row.code, row.description)
        }
      }
    }

    return NextResponse.json({
      success: true,
      referral_code,
      discount_code: baseCode,
      discount_description: "5% off your first LoqMart order",
    })
  } catch (err: any) {
    console.error("survey POST:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

// ─── GET: Admin — list all responses + aggregated stats ───────

export async function GET(req: NextRequest) {
  try {
    const sessionClient = await createClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = createServiceClient()
    const { data: userRecord } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (userRecord?.role !== "admin" && userRecord?.role !== "sub_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = new URL(req.url)
    const limit  = Math.min(Number(url.searchParams.get("limit")  || "100"), 500)
    const offset = Number(url.searchParams.get("offset") || "0")

    const [{ data: rows, count }, { data: allRows }, { data: discountStats }] = await Promise.all([
      supabase
        .from("survey_responses")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from("survey_responses")
        .select("q1_frequency, q2_origin, q3_amazon, q4_choose_local, q5_preference, q6_premium, referral_count"),
      supabase
        .from("survey_discount_codes")
        .select("milestone, is_used"),
    ])

    const tally = (field: string) => {
      const m: Record<string, number> = {}
      for (const r of allRows || []) {
        const v = (r as any)[field]
        if (v) m[v] = (m[v] || 0) + 1
      }
      return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }))
    }

    const totalReferrals = (allRows || []).reduce((s, r: any) => s + (r.referral_count || 0), 0)
    const codesIssued    = (discountStats || []).length
    const codesUsed      = (discountStats || []).filter((d: any) => d.is_used).length

    return NextResponse.json({
      responses: rows || [],
      total: count || 0,
      stats: {
        q1: tally("q1_frequency"),
        q2: tally("q2_origin"),
        q3: tally("q3_amazon"),
        q4: tally("q4_choose_local"),
        q5: tally("q5_preference"),
        q6: tally("q6_premium"),
        total_referrals: totalReferrals,
        codes_issued: codesIssued,
        codes_used: codesUsed,
      },
    })
  } catch (err: any) {
    console.error("survey GET:", err)
    return NextResponse.json({ error: "Failed to load survey data" }, { status: 500 })
  }
}
