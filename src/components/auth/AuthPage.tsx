"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, User as UserIcon, Loader2, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { sanitizeInternalPath } from "@/lib/navigation"

type AuthMethod = "email_login" | "email_register"

function Field({ icon: Icon, type, placeholder, value, onChange, onKeyDown }: {
  icon?: any; type: string; placeholder: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111827]/30 pointer-events-none" />}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown}
        className="w-full h-12 rounded-xl text-[13px] outline-none transition-all"
        style={{ border: "1px solid rgba(17,24,39,0.14)", background: "white", color: "#111827", paddingLeft: Icon ? "2.5rem" : "1rem", paddingRight: "1rem" }}
        onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "#FACC15"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(250,204,21,0.12)" }}
        onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(17,24,39,0.14)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}
      />
    </div>
  )
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <motion.button onClick={onClick} disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.01 }} whileTap={{ scale: disabled ? 1 : 0.98 }}
      className="w-full h-12 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 disabled:opacity-50"
      style={{ background: "#FACC15", color: "#111827" }}>
      {children}
    </motion.button>
  )
}

function OutlineBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button onClick={onClick}
      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
      className="w-full h-12 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
      style={{ border: "1px solid rgba(17,24,39,0.14)", background: "white", color: "#111827" }}>
      {children}
    </motion.button>
  )
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full h-11 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 text-[#111827]/45 hover:text-[#111827] transition-colors">
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

function AuthPageContent({ role }: { role: "buyer" | "seller" }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const next = sanitizeInternalPath(searchParams.get("next") || searchParams.get("redirect"))

  const [method, setMethod] = useState<AuthMethod>("email_login")
  const [email, setEmail]   = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState("")
  const [notice, setNotice]       = useState("")

  const destinationFor = (userRole?: string) => {
    if (userRole === "admin" || userRole === "sub_admin") return "/admin"
    if (userRole === "seller" || role === "seller") return "/seller"
    if (role === "buyer" && (userRole ?? "buyer") === "buyer") return "/priority-invite"
    if (next) return next
    return "/account"
  }

  async function ensurePublicUser(userId: string, userEmail: string, name: string, role: "buyer" | "seller") {
    const { data: existing } = await supabase.from("users").select("id").eq("id", userId).single()
    if (!existing) {
      await supabase.from("users").insert({ id: userId, email: userEmail, full_name: name || userEmail.split("@")[0], role })
      await supabase.from("loqcoin_balances").insert({ user_id: userId, balance: 0, lifetime_earned: 0, lifetime_redeemed: 0 })
    }
  }

  const handleEmailLogin = async () => {
    setError("")
    if (!email || !password) { setError("Please enter both email and password."); return }
    setIsLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      if (data.session && data.user) {
        await ensurePublicUser(data.user.id, data.user.email!, fullName || email.split("@")[0], role)
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
        options: { data: { full_name: fullName, role } },
      })
      if (signUpError) throw signUpError
      if (data.user?.identities?.length === 0) {
        setError("An account with this email already exists. Please sign in.")
        setMethod("email_login"); return
      }
      if (data.user) {
        if (data.session) {
          await ensurePublicUser(data.user.id, email, fullName, role)
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

  return (
    <div className="min-h-screen flex" style={{ background: "#ffffff" }}>
      {/* Left brand panel */}
      <motion.div className="hidden lg:flex flex-col justify-between w-1/2 p-16" style={{ background: "#FACC15" }}
        initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#111827] uppercase">LoqMart</Link>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#111827]/45 mb-4">Made in India, for India</p>
          <motion.h2 className="text-[48px] font-extrabold text-[#111827] tracking-tight leading-tight mb-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
            India&apos;s Own<br /><span className="opacity-35">Marketplace.</span>
          </motion.h2>
          <p className="text-[#111827]/55 text-[15px] max-w-sm leading-relaxed">
            GST-verified sellers. State-tagged products. Swadeshi Ranked. Supporting artisans across all 36 states.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={15} className="text-[#111827]/35" />
          <span className="text-[#111827]/45 text-[12px] font-medium">Bank-grade encryption · No spam</span>
        </div>
      </motion.div>

      {/* Right form panel */}
      <motion.div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }}>
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden text-2xl font-black tracking-tighter text-[#111827] uppercase block mb-8">LoqMart</Link>

          <div className="mb-6">
            <AnimatePresence mode="wait">
              <motion.h1 key={method} className="text-[28px] font-extrabold text-[#111827] tracking-tight leading-tight mb-1"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                {method === "email_register" ? (role === "seller" ? "Create seller account" : "Create account") : (role === "seller" ? "Seller sign in" : "Welcome back")}
              </motion.h1>
            </AnimatePresence>
            <p className="text-[12px] text-[#111827]/45">
              {role === "seller" ? "Sign in to manage your LoqMart seller account." : "Sign in or create an account to continue."}
            </p>
          </div>

          {/* Form panels */}
          <AnimatePresence mode="wait">
            {/* Email Login */}
            {method === "email_login" && (
              <motion.div key="email_login" {...slide}>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#111827]/50 mb-1.5">Email</label>
                    <Field icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#111827]/50 mb-1.5">Password</label>
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
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: "rgba(17,24,39,0.1)" }} /></div>
                    <div className="relative flex justify-center"><span className="px-3 text-[10px] font-black uppercase tracking-widest text-[#111827]/35" style={{ background: "#ffffff" }}>Or</span></div>
                  </div>
                  <OutlineBtn onClick={handleGoogleLogin}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </OutlineBtn>
                </div>
              </motion.div>
            )}

            {/* Email Register */}
            {method === "email_register" && (
              <motion.div key="email_register" {...slide}>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#111827]/50 mb-1.5">Full Name</label>
                    <Field icon={UserIcon} type="text" placeholder="Arjun Kumar" value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#111827]/50 mb-1.5">Email</label>
                    <Field icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#111827]/50 mb-1.5">Password</label>
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

          </AnimatePresence>

          {role === "seller" && (
            <motion.div className="mt-6 p-4 rounded-xl"
              style={{ background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.3)" }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <p className="text-[12px] text-[#111827]/60">
                {next === "/seller/register"
                  ? "Sign in above and we'll take you straight to your seller application."
                  : <>New to selling on LoqMart?{" "}
                      <Link href="/seller/register" className="text-[#111827] font-black hover:underline">
                        Register your business
                      </Link>
                    </>}
              </p>
            </motion.div>
          )}
          {role === "seller" && <p className="mt-6 text-center text-[12px] text-[#111827]/50">
            Shopping on LoqMart?{" "}
            <Link href="/login" className="font-bold text-[#111827] hover:underline">Go to Buyer Login</Link>
          </p>}
        </div>
      </motion.div>
    </div>
  )
}

export function AuthPage({ role = "buyer" }: { role?: "buyer" | "seller" }) {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#ffffff" }} />}>
      <AuthPageContent role={role} />
    </Suspense>
  )
}

