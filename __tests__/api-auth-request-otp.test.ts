import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "../src/app/api/auth/request-otp/route"

const signInWithOtp = vi.fn().mockResolvedValue({ error: null })

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithOtp },
  })),
}))

function makeRequest(body: unknown, ip = "203.0.113.1") {
  return new Request("http://localhost/api/auth/request-otp", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  })
}

describe("POST /api/auth/request-otp", () => {
  beforeEach(() => {
    signInWithOtp.mockClear()
  })

  it("returns 400 if phone is missing or invalid", async () => {
    const res = await POST(makeRequest({}, "203.0.113.10"))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/valid indian mobile number/i)
  })

  it("returns 200 and sends an OTP for a valid phone number", async () => {
    const res = await POST(makeRequest({ phone: "+919876543210" }, "203.0.113.11"))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.phone).toBe("+919876543210")
    expect(signInWithOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      options: { channel: "sms" },
    })
  })

  it("rate-limits after 5 requests from the same IP within the window", async () => {
    const ip = "203.0.113.99"
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest({ phone: "+919876543210" }, ip))
      expect(res.status).toBe(200)
    }
    const blocked = await POST(makeRequest({ phone: "+919876543210" }, ip))
    expect(blocked.status).toBe(429)
  })
})
