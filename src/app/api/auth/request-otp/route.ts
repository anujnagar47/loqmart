import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isDevOtpEnabled, issueDevOtp, DEV_OTP_PASSWORD } from "@/lib/dev-otp"

const OTP_LIMIT = 5
const OTP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`request-otp:ip:${ip}`, OTP_LIMIT, OTP_WINDOW_MS))) {
      return NextResponse.json({ error: "Too many OTP requests. Please wait a few minutes." }, { status: 429 })
    }

    const { phone } = await request.json()

    if (!phone || !phone.startsWith("+91") || phone.replace(/\D/g, "").length < 12) {
      return NextResponse.json({ error: "Valid Indian mobile number required (+91XXXXXXXXXX)" }, { status: 400 })
    }

    // Local dev has no SMS provider wired into Supabase Auth, so the real
    // signInWithOtp call below would fail every time. Issue a real,
    // verifiable code ourselves instead — verify-otp still produces a
    // genuine Supabase session for it, just without the SMS hop. Gated to
    // NODE_ENV === "development" so this path can never run in production.
    if (isDevOtpEnabled()) {
      const admin = createServiceClient()
      const { error: createError } = await admin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        password: DEV_OTP_PASSWORD,
      })
      if (createError && !createError.message?.toLowerCase().includes("already")) {
        console.error("Dev OTP: failed to provision user:", createError)
        return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 })
      }
      if (createError) {
        // User already exists — make sure it still has the known dev password.
        const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
        const existing = list?.users.find(u => u.phone === phone.replace(/^\+/, ""))
        if (existing) {
          await admin.auth.admin.updateUserById(existing.id, { password: DEV_OTP_PASSWORD })
        }
      }

      const code = issueDevOtp(phone)
      console.log(`[dev-otp] Code for ${phone}: ${code} (SMS provider not configured — this bypass only runs in development)`)

      return NextResponse.json({ message: "OTP sent successfully", phone, dev_otp: code })
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
      return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ message: "OTP sent successfully", phone })
  } catch (error) {
    console.error("Request OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
