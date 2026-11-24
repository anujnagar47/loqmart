import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIp, isDistributedRateLimitConfigured } from "@/lib/rate-limit"

const STATE_CODES: Record<string, string> = {
  "rajasthan": "RJ", "uttar pradesh": "UP", "maharashtra": "MH", "west bengal": "WB",
  "karnataka": "KA", "tamil nadu": "TN", "odisha": "OR", "andhra pradesh": "AP",
  "gujarat": "GJ", "jammu & kashmir": "JK", "kerala": "KL", "bihar": "BR",
  "punjab": "PB", "haryana": "HR", "delhi": "DL", "assam": "AS",
  "madhya pradesh": "MP", "goa": "GA", "telangana": "TG", "odisha (orissa)": "OR",
  "pondicherry": "PY", "puducherry": "PY", "chandigarh": "CH", "himachal pradesh": "HP",
  "uttarakhand": "UK", "jharkhand": "JH", "chhattisgarh": "CG", "tripura": "TR",
  "meghalaya": "ML", "manipur": "MN", "nagaland": "NL", "arunachal pradesh": "AR",
  "mizoram": "MZ", "sikkim": "SK"
}

export async function GET() {
  const sessionClient = await createClient()
  const { data: { user }, error: authError } = await sessionClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }
  if (process.env.NODE_ENV === "production" && !isDistributedRateLimitConfigured()) return NextResponse.json({ error: "Address service requires shared rate-limit configuration." }, { status: 503 })

  const { data, error } = await sessionClient
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })

  if (error) {
    console.error("Addresses fetch error:", error)
    return NextResponse.json({ addresses: [] })
  }

  return NextResponse.json({ addresses: data || [] })
}

export async function POST(req: NextRequest) {
  const sessionClient = await createClient()
  const { data: { user }, error: authError } = await sessionClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const ip = getClientIp(req)
  const withinLimit = await Promise.all([
    checkRateLimit(`address:user:${user.id}`, 10, 60 * 60 * 1000),
    checkRateLimit(`address:network:${ip}`, 40, 60 * 60 * 1000),
  ])
  if (withinLimit.some(allowed => !allowed)) return NextResponse.json({ error: "Too many address attempts. Please try again later." }, { status: 429 })

  let body: Record<string, any>
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid address request." }, { status: 400 }) }
  const { name, phone, address_line1, address_line2, city, state, state_code, pincode, is_default } = body

  if (!name || !phone || !address_line1 || !city || !state || !pincode) {
    return NextResponse.json({ error: "Missing required address fields" }, { status: 400 })
  }
  let normalizedPhone = String(phone).trim().replace(/\D/g, "")
  if (normalizedPhone.length === 12 && normalizedPhone.startsWith("91")) normalizedPhone = normalizedPhone.slice(2)
  if (!/^[6-9]\d{9}$/.test(normalizedPhone)) return NextResponse.json({ error: "phone: Enter a valid 10-digit Indian mobile number." }, { status: 400 })
  const normalizedPincode = String(pincode).trim()
  if (!/^\d{6}$/.test(normalizedPincode)) return NextResponse.json({ error: "pincode: Enter a valid 6-digit Indian pincode." }, { status: 400 })

  let db
  try {
    db = createServiceClient()
  } catch (err) {
    console.warn("createServiceClient failed, falling back to sessionClient:", err)
    db = sessionClient
  }

  // Ensure public.users row exists (trigger may not have fired for this auth user)
  const { data: existingUser } = await db.from("users").select("id").eq("id", user.id).maybeSingle()
  if (!existingUser) {
    try {
      await db.from("users").insert({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        role: "buyer",
        email_verified: !!user.email_confirmed_at,
      })
    } catch (err) {
      console.error("Failed to insert user profile:", err)
    }

    try {
      await db.from("loqcoin_balances").insert({ user_id: user.id, balance: 0, lifetime_earned: 0, lifetime_redeemed: 0 })
    } catch (err) {
      console.error("Failed to insert wallet balance:", err)
    }
  }

  const cleanStateCode = (state_code || "").trim().toUpperCase()
  const cleanState = (state || "").trim()
  const resolvedStateCode = (cleanStateCode || STATE_CODES[cleanState.toLowerCase()] || cleanState.slice(0, 2).toUpperCase() || "IN").slice(0, 5)

  const { data, error } = await db
    .from("addresses")
    .insert({
      user_id: user.id,
      name: String(name).trim(), phone: normalizedPhone,
      address_line1, address_line2: address_line2 || null,
      city, state, state_code: resolvedStateCode,
      pincode: normalizedPincode,
      is_default: is_default || false,
    })
    .select()
    .single()

  if (error) {
    console.error("Address insert error:", error)
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 })
  }

  return NextResponse.json({ address: data })
}

export async function DELETE(req: NextRequest) {
  const sessionClient = await createClient()
  const { data: { user }, error: authError } = await sessionClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Address ID required" }, { status: 400 })

  const { error } = await sessionClient.from("addresses").delete().eq("id", id).eq("user_id", user.id)

  if (error) return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
