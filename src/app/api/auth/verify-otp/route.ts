import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp || otp.length !== 6) {
      return NextResponse.json({ error: "Phone number and 6-digit OTP required" }, { status: 400 })
    }

    const supabase = await createClient()

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

    const { session, user } = data

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
