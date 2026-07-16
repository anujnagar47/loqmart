"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Phone, RefreshCw, Mail, Lock, User as UserIcon, Loader2, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const TABS = ["buyer", "seller"] as const
type Tab = typeof TABS[number]
type AuthMethod = "phone" | "email_login" | "email_register" | "otp"

function Field({ icon: Icon, type, placeholder, value, onChange, onKeyDown }: {
  icon?: any; type: string; placeholder: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1c1c]/30 pointer-events-none" />}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown}
        className="w-full h-12 rounded-xl text-[13px] outline-none transition-all"
        style={{ border: "1px solid rgba(26,28,28,0.14)", background: "white", color: "#1a1c1c", paddingLeft: Icon ? "2.5rem" : "1rem", paddingRight: "1rem" }}
        onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "#fcd020"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(252,208,32,0.12)" }}
        onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,28,28,0.14)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}
      />
    </div>
  )
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <motion.button onClick={onClick} disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.01 }} whileTap={{ scale: disabled ? 1 : 0.98 }}
      className="w-full h-12 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 disabled:opacity-50"
      style={{ background: "#fcd020", color: "#1a1c1c" }}>
      {children}
    </motion.button>
  )
}

function OutlineBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button onClick={onClick}
      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
      className="w-full h-12 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
      style={{ border: "1px solid rgba(26,28,28,0.14)", background: "white", color: "#1a1c1c" }}>
      {children}
    </motion.button>
  )
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full h-11 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 text-[#1a1c1c]/45 hover:text-[#1a1c1c] transition-colors">
      {children}
    </button>
  )
}

const slide = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
  transition: { duration: 0.2, ease: "easeOut" as const },
}

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const next = searchParams.get("next") || searchParams.get("redirect")

  const [tab, setTab]       = useState<Tab>("buyer")
  const [method, setMethod] = useState<AuthMethod>("phone")
  const [phone, setPhone]   = useState("")
  const [email, setEmail]   = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [otp, setOtp]           = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState("")
  const [notice, setNotice]       = useState("")

  const destinationFor = (role?: string) => {
    if (role === "admin" || role === "sub_admin") return "/admin"
    if (next) return next
    return tab === "seller" ? "/seller/dashboard" : "/account"
  }

  async function ensurePublicUser(userId: string, userEmail: string, name: string, role: "buyer" | "seller") {
    const { data: existing } = await supabase.from("users").select("id").eq("id", userId).single()
    if (!existing) {
      await supabase.from("users").insert({ id: userId, email: userEmail, full_name: name || userEmail.split("@")[0], role })
      await supabase.from("loqcoin_balances").insert({ user_id: userId, balance: 0, lifetime_earned: 0, lifetime_redeemed: 0 })
    }
  }

  const handleSendOTP = async () => {
    setError("")
    if (phone.replace(/\D/g, "").length !== 10) { setError("Please enter a valid 10-digit mobile number."); return }
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${phone.replace(/\D/g, "")}` }),
      })
      if (!res.ok) throw new Error()
      setMethod("otp")
    } catch { setError("Could not send OTP. Please try again.") }
    finally { setIsLoading(false) }
  }

  const handleVerifyOTP = async () => {
    setError("")
    const code = otp.join("")
    if (code.length !== 6) { setError("Please enter the complete 6-digit OTP."); return }
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${phone.replace(/\D/g, "")}`, otp: code }),
      })
      if (!res.ok) throw new Error()
      router.push(destinationFor())
      router.refresh()
    } catch { setError("Invalid OTP. Please try again.") }
    finally { setIsLoading(false) }
  }

  const handleEmailLogin = async () => {
    setError("")
    if (!email || !password) { setError("Please enter both email and password."); return }
    setIsLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      if (data.session && data.user) {
        await ensurePublicUser(data.user.id, data.user.email!, fullName || email.split("@")[0], tab === "seller" ? "seller" : "buyer")
        const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).single()
        router.push(destinationFor(profile?.role))
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message?.includes("Invalid") ? "Incorrect email or password." : (err.message || "Sign in failed."))
    } finally { setIsLoading(false) }
  }

  const handleEmailRegister = async () => {
    setError("")
    if (!email || !password || !fullName) { setError("Please fill in all fields."); return }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    setIsLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, role: tab === "seller" ? "seller" : "buyer" } },
      })
      if (signUpError) throw signUpError
      if (data.user?.identities?.length === 0) {
        setError("An account with this email already exists. Please sign in.")
        setMethod("email_login"); return
      }
      if (data.user) {
        if (data.session) {
          await ensurePublicUser(data.user.id, email, fullName, tab === "seller" ? "seller" : "buyer")
          router.push(destinationFor())
          router.refresh()
        } else {
          // Supabase project requires email confirmation before a session is issued —
          // redirecting now would just bounce the user straight back to /auth.
          setNotice("Account created. Check your email to confirm before signing in.")
          setMethod("email_login")
        }
      }
    } catch (err: any) { setError(err.message || "Registration failed. Please try again.") }
    finally { setIsLoading(false) }
  }

  const handleGoogleLogin = async () => {
    setError(""); setIsLoading(true)
    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin)
      callbackUrl.searchParams.set("next", destinationFor())
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl.toString(), queryParams: { access_type: "offline", prompt: "consent" } },
      })
      if (oauthError) throw oauthError
    } catch { setError("Google sign-in failed. Please try email login."); setIsLoading(false) }
  }

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]; next[index] = value; setOtp(next)
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus()
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f5f0" }}>
      {/* Left brand panel */}
      <motion.div className="hidden lg:flex flex-col justify-between w-1/2 p-16" style={{ background: "#fcd020" }}
        initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#1a1c1c] uppercase">LoqMart</Link>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/45 mb-4">Made in India, for India</p>
          <motion.h2 className="text-[48px] font-extrabold text-[#1a1c1c] tracking-tight leading-tight mb-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
            India's Own<br /><span className="opacity-35">Marketplace.</span>
          </motion.h2>
          <p className="text-[#1a1c1c]/55 text-[15px] max-w-sm leading-relaxed">
            GST-verified sellers. State-tagged products. Swadeshi Ranked. Supporting artisans across all 36 states.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={15} className="text-[#1a1c1c]/35" />
          <span className="text-[#1a1c1c]/45 text-[12px] font-medium">Bank-grade encryption · No spam</span>
        </div>
      </motion.div>

      {/* Right form panel */}
      <motion.div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }}>
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden text-2xl font-black tracking-tighter text-[#1a1c1c] uppercase block mb-8">LoqMart</Link>

          <div className="mb-6">
            <AnimatePresence mode="wait">
              <motion.h1 key={method} className="text-[28px] font-extrabold text-[#1a1c1c] tracking-tight leading-tight mb-1"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                {method === "email_register" ? "Create account" : method === "otp" ? "Enter OTP" : "Welcome back"}
              </motion.h1>
            </AnimatePresence>
            <p className="text-[12px] text-[#1a1c1c]/45">
              {method === "otp"
                ? `OTP sent to +91 ${phone}. Valid for 10 minutes.`
                : "Choose how you'd like to continue."}
            </p>
          </div>

          {/* Buyer / Seller toggle */}
          <div className="flex rounded-xl p-1 mb-6 relative" style={{ background: "rgba(26,28,28,0.06)" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} className="flex-1 py-2.5 text-[12px] font-black uppercase tracking-wider rounded-lg z-10 relative transition-colors"
                style={{ color: tab === t ? "#1a1c1c" : "rgba(26,28,28,0.45)" }}>
                {tab === t && (
                  <motion.span layoutId="auth-tab-bg" className="absolute inset-0 rounded-lg"
                    style={{ background: "#fcd020", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <span className="relative">{t === "buyer" ? "I'm a Buyer" : "I'm a Seller"}</span>
              </button>
            ))}
          </div>

          {/* Form panels */}
          <AnimatePresence mode="wait">
            {/* Phone OTP */}
            {method === "phone" && (
              <motion.div key="phone" {...slide}>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/50 mb-2">Mobile Number</label>
                <div className="flex gap-2 mb-1">
                  <div className="flex items-center justify-center rounded-xl px-3 text-[13px] font-bold text-[#1a1c1c] shrink-0"
                    style={{ background: "rgba(26,28,28,0.06)", border: "1px solid rgba(26,28,28,0.12)", minWidth: "3.5rem" }}>
                    +91
                  </div>
                  <input type="tel" placeholder="98765 43210" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                    className="flex-1 h-12 px-4 rounded-xl text-[13px] outline-none transition-all"
                    style={{ border: "1px solid rgba(26,28,28,0.14)", background: "white", color: "#1a1c1c" }}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "#fcd020"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(252,208,32,0.12)" }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,28,28,0.14)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}
                  />
                </div>
                <AnimatePresence>
                  {error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="text-[12px] text-red-600 font-medium mb-2">{error}</motion.p>}
                </AnimatePresence>
                <div className="space-y-2 mt-3">
                  <PrimaryBtn onClick={handleSendOTP} disabled={isLoading}>
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isLoading ? "Sending" : "Get OTP"}
                  </PrimaryBtn>
                </div>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: "rgba(26,28,28,0.1)" }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/35" style={{ background: "#f8f5f0" }}>
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <OutlineBtn onClick={handleGoogleLogin}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </OutlineBtn>
                  <GhostBtn onClick={() => { setError(""); setMethod("email_login") }}>
                    <Mail size={14} /> Continue with Email
                  </GhostBtn>
                </div>
              </motion.div>
            )}

            {/* Email Login */}
            {method === "email_login" && (
              <motion.div key="email_login" {...slide}>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/50 mb-1.5">Email</label>
                    <Field icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/50 mb-1.5">Password</label>
                    <Field icon={Lock} type="password" placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleEmailLogin()} />
                  </div>
                  <AnimatePresence>
                    {notice && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="text-[12px] text-green-700 font-medium">{notice}</motion.p>}
                    {error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="text-[12px] text-red-600 font-medium">{error}</motion.p>}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <PrimaryBtn onClick={handleEmailLogin} disabled={isLoading}>
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isLoading ? "Signing in" : "Sign In"}
                  </PrimaryBtn>
                  <OutlineBtn onClick={() => { setError(""); setMethod("email_register") }}>Create an Account</OutlineBtn>
                  <GhostBtn onClick={() => { setError(""); setMethod("phone") }}>
                    <Phone size={13} /> Phone Login
                  </GhostBtn>
                </div>
              </motion.div>
            )}

            {/* Email Register */}
            {method === "email_register" && (
              <motion.div key="email_register" {...slide}>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/50 mb-1.5">Full Name</label>
                    <Field icon={UserIcon} type="text" placeholder="Arjun Kumar" value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/50 mb-1.5">Email</label>
                    <Field icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/50 mb-1.5">Password</label>
                    <Field icon={Lock} type="password" placeholder="Min. 6 characters" value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleEmailRegister()} />
                  </div>
                  <AnimatePresence>
                    {error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="text-[12px] text-red-600 font-medium">{error}</motion.p>}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <PrimaryBtn onClick={handleEmailRegister} disabled={isLoading}>
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isLoading ? "Creating account" : "Sign Up"}
                  </PrimaryBtn>
                  <GhostBtn onClick={() => { setError(""); setMethod("email_login") }}>
                    Already have an account? Sign In
                  </GhostBtn>
                </div>
              </motion.div>
            )}

            {/* OTP Entry */}
            {method === "otp" && (
              <motion.div key="otp" {...slide}>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/50 mb-4">6-Digit OTP</label>
                <div className="flex gap-2 justify-between mb-1">
                  {otp.map((digit, i) => (
                    <motion.input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="w-12 h-14 text-center text-2xl font-black rounded-xl outline-none transition-all"
                      style={{ border: "2px solid rgba(26,28,28,0.14)", background: "white", color: "#1a1c1c" }}
                      onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "#fcd020"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(252,208,32,0.15)" }}
                      onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = digit ? "#1a1c1c" : "rgba(26,28,28,0.14)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}
                    />
                  ))}
                </div>
                <AnimatePresence>
                  {error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="text-[12px] text-red-600 font-medium mb-2">{error}</motion.p>}
                </AnimatePresence>
                <div className="space-y-3 mt-4">
                  <PrimaryBtn onClick={handleVerifyOTP} disabled={isLoading}>
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isLoading ? "Verifying" : "Verify & Continue"}
                  </PrimaryBtn>
                  <button onClick={() => { setMethod("phone"); setOtp(["","","","","",""]); setError("") }}
                    className="flex items-center gap-2 mx-auto text-[12px] font-medium text-[#1a1c1c]/40 hover:text-[#1a1c1c] transition-colors">
                    <RefreshCw size={12} /> Resend OTP or change number
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {tab === "seller" && method !== "otp" && (
            <motion.div className="mt-6 p-4 rounded-xl"
              style={{ background: "rgba(252,208,32,0.12)", border: "1px solid rgba(252,208,32,0.3)" }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <p className="text-[12px] text-[#1a1c1c]/60">
                New seller?{" "}
                <Link href="/seller/register" className="text-[#1a1c1c] font-black hover:underline">
                  Register your business
                </Link>
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#f8f5f0" }} />}>
      <AuthPageContent />
    </Suspense>
  )
}
