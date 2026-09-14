// Local-development OTP bypass. Supabase phone auth requires a real SMS
// provider (Twilio, MessageBird, ...) configured in the project's Auth
// settings — without one, signInWithOtp/verifyOtp fail in every environment,
// local included. This lets phone sign-in work end-to-end on a machine with
// no SMS provider wired up, without faking success: verify-otp still ends
// in a real Supabase session (via signInWithPassword against a dev-only
// password set server-side), it just skips the SMS hop to get the code.
//
// Hard-gated to NODE_ENV === "development" — never active in production,
// regardless of what a request claims.

interface Entry { code: string; expiresAt: number }

const store = new Map<string, Entry>()
const TTL_MS = 5 * 60 * 1000

// Fixed, server-only password used to authenticate the dev-mode user via
// signInWithPassword. Never sent to any client; only ever compared/set
// through the service-role admin client.
export const DEV_OTP_PASSWORD = process.env.DEV_OTP_PASSWORD || "loqmart-local-dev-otp-bypass-9f2c"

export function isDevOtpEnabled(): boolean {
  return process.env.NODE_ENV === "development"
}

export function issueDevOtp(phone: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  store.set(phone, { code, expiresAt: Date.now() + TTL_MS })
  return code
}

export function consumeDevOtp(phone: string, code: string): boolean {
  const entry = store.get(phone)
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(phone)
    return false
  }
  const ok = entry.code === code
  if (ok) store.delete(phone)
  return ok
}
