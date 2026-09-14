import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isDevOtpEnabled, consumeDevOtp, DEV_OTP_PASSWORD } from "@/lib/dev-otp"

// A 6-digit numeric OTP has 1,000,000 combinations — with no limit here an
// attacker could brute-force a known phone number's OTP. Limit both by IP
// (stop mass scanning) and by phone (stop targeting one victim from many IPs).
const VERIFY_LIMIT_PER_IP = 20
const VERIFY_LIMIT_PER_PHONE = 5
const VERIFY_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp || otp.length !== 6) {
      return NextResponse.json({ error: "Phone number and 6-digit OTP required" }, { status: 400 })
    }

    const ip = getClientIp(request)
    if (!(await checkRateLimit(`verify-otp:ip:${ip}`, VERIFY_LIMIT_PER_IP, VERIFY_WINDOW_MS))) {
      return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 })
    }
    if (!(await checkRateLimit(`verify-otp:phone:${phone}`, VERIFY_LIMIT_PER_PHONE, VERIFY_WINDOW_MS))) {
      return NextResponse.json({ error: "Too many attempts for this number. Please request a new OTP." }, { status: 429 })
    }

    const supabase = await createClient()

    let session, user
    if (isDevOtpEnabled()) {
      if (!consumeDevOtp(phone, otp)) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 })
      }
      // Same phone auth, just signed in with the dev-only password set in
      // request-otp instead of an SMS-delivered code — this still produces
      // a real Supabase session with real cookies, exactly like the
      // production verifyOtp path below.
      const { data, error } = await supabase.auth.signInWithPassword({ phone, password: DEV_OTP_PASSWORD })
      if (error || !data.session) {
        console.error("Dev OTP sign-in error:", error)
        if (error?.code === "phone_provider_disabled") {
          return NextResponse.json({
            error: "Phone sign-in is disabled for this Supabase project (Authentication → Providers → Phone). Enable it — no SMS vendor needed for local dev — then try again.",
          }, { status: 500 })
        }
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 })
      }
      session = data.session
      user = data.user
    } else {
      // Verify OTP with Supabase Auth
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms",
      })

      if (error || !data.session) {
        console.error("OTP verification error:", error)
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 })
      }
      session = data.session
      user = data.user
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    // Check if user record exists in our users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!existingUser) {
      // Create new user record
      await supabase.from("users").insert({
        id: user.id,
        email: user.email || "",
        full_name: "New User",
        phone: user.phone,
        role: "buyer",
      })

      // Create LoqCoin balance for new user
      await supabase.from("loqcoin_balances").insert({
        user_id: user.id,
        balance: 0,
        lifetime_earned: 0,
        lifetime_redeemed: 0,
      })
    }

    return NextResponse.json({
      message: "Verified successfully",
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: {
        id: user.id,
        phone: user.phone,
        role: existingUser?.role || "buyer",
      },
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
