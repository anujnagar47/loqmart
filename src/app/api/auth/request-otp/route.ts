import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// In-process rate limit store (resets on cold start; use Redis in production)
const otpRateLimit = new Map<string, { count: number; resetAt: number }>()
const OTP_LIMIT = 5
const OTP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown"
    const now = Date.now()
    const entry = otpRateLimit.get(ip)
    if (entry) {
      if (now < entry.resetAt) {
        if (entry.count >= OTP_LIMIT) {
          return NextResponse.json({ error: "Too many OTP requests. Please wait a few minutes." }, { status: 429 })
        }
        entry.count++
      } else {
        otpRateLimit.set(ip, { count: 1, resetAt: now + OTP_WINDOW_MS })
      }
    } else {
      otpRateLimit.set(ip, { count: 1, resetAt: now + OTP_WINDOW_MS })
    }

    const { phone } = await request.json()

    if (!phone || !phone.startsWith("+91") || phone.replace(/\D/g, "").length < 12) {
      return NextResponse.json({ error: "Valid Indian mobile number required (+91XXXXXXXXXX)" }, { status: 400 })
    }

    const supabase = await createClient()

    // Use Supabase Auth OTP
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: "sms",
      },
    })

    if (error) {
      console.error("OTP send error:", error)
      
      // Fallback for development if Twilio/SMS is not configured
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV MODE] Simulated OTP sent to ${phone}: 123456`)
        return NextResponse.json({ message: "OTP sent successfully (Development Mode)", phone })
      }
      
      return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ message: "OTP sent successfully", phone })
  } catch (error) {
    console.error("Request OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
