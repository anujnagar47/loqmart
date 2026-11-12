"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ChevronLeft, Check, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"

// ─── Data ─────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: "q1_frequency",
    num: "01",
    text: "How often do you shop online?",
    type: "single" as const,
    options: [
      "Multiple times a week",
      "Once a week",
      "A few times a month",
      "Rarely or never",
    ],
  },
  {
    id: "q2_origin",
    num: "02",
    text: "When shopping on major platforms like Amazon, how easy is it to find products that are genuinely made in India?",
    type: "single" as const,
    options: [
      "Very easy — it's always clear",
      "Somewhat easy — if I search for it",
      "Difficult — the origin is hidden or confusing",
      "I don't check or care about origin",
    ],
  },
  {
    id: "q3_amazon",
    num: "03",
    text: "Which statement best matches your experience with big platforms' pricing versus quality?",
    type: "single" as const,
    options: [
      "Great prices, great quality",
      "Good prices, but quality is hit-or-miss",
      "Increasingly expensive for cheap, imported items",
      "I only buy the cheapest option regardless",
    ],
  },
  {
    id: "q4_choose_local",
    num: "04",
    text: "If a marketplace verified and guaranteed that every product was made by Indian MSMEs or artisans, would you choose it over global platforms?",
    type: "single" as const,
    options: [
      "Yes, without a doubt",
      "No — I'd stick with what I know",
      "Maybe — depends on price and selection",
    ],
  },
  {
    id: "q5_preference",
    num: "05",
    text: "When buying Indian products, what matters more to you?",
    type: "single" as const,
    options: [
      "Handmade artistry — unique, premium, story-driven",
      "Machine-made utility — everyday items at great value",
      "Both matter equally",
      "Neither — lowest price wins",
    ],
  },
  {
    id: "q6_premium",
    num: "06",
    text: "Would you pay 5–15% more for a product if it was verified to come directly from an Indian artisan or MSME?",
    type: "single" as const,
    options: [
      "Yes — the story and provenance matter to me",
      "Maybe — if the quality clearly justifies it",
      "No — price is the deciding factor",
    ],
  },
  {
    id: "q7_categories",
    num: "07",
    text: "Which product categories do you shop online most? Select all that apply.",
    type: "multi" as const,
    options: [
      "Clothing & Textiles",
      "Home Decor",
      "Food & Spices",
      "Beauty & Wellness",
      "Handicrafts & Art",
      "Electronics & Accessories",
      "Fitness & Yoga",
      "Books & Stationery",
    ],
  },
] as const

const TOTAL = QUESTIONS.length

const MILESTONES = [
  { threshold: 10, key: "10_referrals",  label: "50% off first order",         color: "#22c55e" },
  { threshold: 20, key: "20_referrals",  label: "50% off + free delivery",     color: "#3b82f6" },
  { threshold: 40, key: "40_referrals",  label: "First order completely free",  color: "#FACC15" },
]

// ─── Inner page (uses useSearchParams) ────────────────────────

function SurveyInner() {
  const searchParams  = useSearchParams()
  const refCode       = (searchParams.get("ref") || "").trim().toUpperCase()

  type Phase = "intro" | "survey" | "contact" | "submitting" | "success"
  const [phase,     setPhase]     = useState<Phase>("intro")
  const [qIndex,    setQIndex]    = useState(0)
  const [direction, setDirection] = useState(1)

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [contact, setContact] = useState({ email: "", name: "", city_state: "" })

  const [result,      setResult]      = useState<{ referral_code: string; discount_code: string } | null>(null)
  const [submitError, setSubmitError] = useState("")
  const [copied,      setCopied]      = useState<"ref" | "disc" | null>(null)

  const currentQ = QUESTIONS[qIndex]

  // ── Handlers ─────────────────────────────────────────────────

  const advance = (idx: number) => {
    setDirection(1)
    if (idx < TOTAL - 1) setQIndex(idx + 1)
    else setPhase("contact")
  }

  const handleSingle = (value: string) => {
    setAnswers(a => ({ ...a, [currentQ.id]: value }))
    setTimeout(() => advance(qIndex), 260)
  }

  const handleMultiToggle = (value: string) => {
    const cur = (answers.q7_categories as string[]) || []
    setAnswers(a => ({
      ...a,
      q7_categories: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value],
    }))
  }

  const handleBack = () => {
    setDirection(-1)
    if (phase === "contact") {
      setPhase("survey")
      setQIndex(TOTAL - 1)
    } else if (qIndex > 0) {
      setQIndex(i => i - 1)
    } else {
      setPhase("intro")
    }
  }

  const handleSubmit = async () => {
    const { email, name, city_state } = contact
    if (!email || !name || !city_state) {
      setSubmitError("Please fill in your email, name, and city/state.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSubmitError("Please enter a valid email address.")
      return
    }

    setSubmitError("")
    setPhase("submitting")

    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...answers,
          email:       email.trim(),
          name:        name.trim(),
          city_state:  city_state.trim(),
          referred_by: refCode || null,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error || "Submission failed. Please try again.")
        setPhase("contact")
        return
      }

      const discount_code = data.discount_code
        || (Array.isArray(data.discounts) && data.discounts[0]?.code)
        || ""
      setResult({ referral_code: data.referral_code, discount_code })
      setPhase("success")
    } catch {
      setSubmitError("Something went wrong. Please try again.")
      setPhase("contact")
    }
  }

  const copy = async (text: string, type: "ref" | "disc") => {
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
    setCopied(type)
    setTimeout(() => setCopied(null), 2200)
  }

  // ── Progress ──────────────────────────────────────────────────

  const progressPct = phase === "survey"
    ? Math.round((qIndex / TOTAL) * 100)
    : phase === "contact" || phase === "submitting"
      ? 100
      : 0

  // ─── INTRO ────────────────────────────────────────────────────

  if (phase === "intro") {
    return (
      <div style={{ background: "#0f1010", minHeight: "100vh" }}>
        {refCode && (
          <div className="fixed top-0 left-0 right-0 z-50 py-2.5 px-4 text-center text-[11.5px] font-black tracking-wide text-[#111827]"
            style={{ background: "#FACC15" }}>
            You were referred by {refCode} — complete the survey to claim your reward
          </div>
        )}

        <div className="max-w-2xl mx-auto px-6" style={{ paddingTop: refCode ? "6rem" : "5rem", paddingBottom: "5rem" }}>

          {/* Stats bar */}
          <motion.div
            className="flex border-b"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.7 }}>
            {[
              { n: "6.3 Cr",  l: "MSMEs in India"         },
              { n: "11 Cr",   l: "Registered artisans"     },
              { n: "~2%",     l: "With an online presence" },
            ].map(({ n, l }, i) => (
              <div key={l} className="flex-1 py-6 pr-6" style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none", paddingLeft: i > 0 ? "1.5rem" : 0 }}>
                <p className="text-[26px] font-black text-white tracking-tight leading-none">{n}</p>
                <p className="text-[10.5px] font-medium mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</p>
              </div>
            ))}
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-[46px] sm:text-[60px] font-black leading-[1.0] tracking-tight mt-12 mb-10"
            style={{ color: "white" }}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}>
            India makes.<br />
            The world buys.<br />
            <span style={{ color: "#FACC15" }}>We&rsquo;re&nbsp;changing&nbsp;that.</span>
          </motion.h1>

          {/* Body copy */}
          <div className="space-y-6 mb-14">
            <motion.p
              className="text-[16px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.55)" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.6 }}>
              LoqMart is a marketplace built exclusively for India&rsquo;s local makers — artisans,
              MSMEs, and manufacturers who create genuine products but rarely reach customers directly.
              Every rupee spent here stays in India and goes to the person who made the product.
            </motion.p>
            <motion.p
              className="text-[14px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.32)" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}>
              To build it right, we need to understand how India actually shops online. Eight questions.
              Sixty seconds. Your answers shape a marketplace that millions of makers are counting on.
              As a thank you, you&rsquo;ll get a discount code for your first order — and a referral link
              that unlocks bigger rewards the more people you bring in.
            </motion.p>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.5 }}>
            <button
              onClick={() => { setDirection(1); setPhase("survey") }}
              className="group flex items-center gap-3 px-8 py-4 rounded-xl font-black text-[14px]"
              style={{ background: "#FACC15", color: "#111827" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = "brightness(0.92)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = ""}>
              Begin Survey
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-150" />
            </button>
            <p className="mt-4 text-[10.5px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              8 questions · 60 seconds · your responses are anonymous and used only to improve LoqMart
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  // ─── SUCCESS ──────────────────────────────────────────────────

  if (phase === "success" && result) {
    const origin  = typeof window !== "undefined" ? window.location.origin : ""
    const refUrl  = `${origin}/survey?ref=${result.referral_code}`

    return (
      <div className="min-h-screen" style={{ background: "#FBF9F5" }}>
        <div className="max-w-xl mx-auto px-6 py-14">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            <div className="mb-10">
              <p className="text-[9.5px] font-black uppercase tracking-widest mb-3"
                style={{ color: "rgba(17,24,39,0.3)" }}>Survey complete</p>
              <h1 className="text-[34px] font-black text-[#111827] tracking-tight leading-tight">
                Your voice is on record.
              </h1>
              <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "rgba(17,24,39,0.5)" }}>
                Thank you for shaping the future of Indian commerce.
              </p>
            </div>

            {/* Discount reward */}
            <div className="bg-white rounded-2xl p-6 mb-3"
              style={{ border: "1px solid rgba(17,24,39,0.07)", boxShadow: "0 2px 12px rgba(17,24,39,0.04)" }}>
              <p className="text-[9.5px] font-black uppercase tracking-widest mb-1"
                style={{ color: "rgba(17,24,39,0.3)" }}>Your reward</p>
              <p className="text-[15px] font-bold text-[#111827] mb-4">5% off your first LoqMart order</p>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: "#FBF9F5" }}>
                <code className="flex-1 text-[18px] font-black tracking-wider text-[#111827]">
                  {result.discount_code}
                </code>
                <button onClick={() => copy(result!.discount_code, "disc")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-colors shrink-0"
                  style={{
                    background: copied === "disc" ? "#FACC15" : "rgba(17,24,39,0.07)",
                    color: "#111827",
                  }}>
                  {copied === "disc" ? <Check size={11} /> : <Copy size={11} />}
                  {copied === "disc" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[10px] mt-2" style={{ color: "rgba(17,24,39,0.3)" }}>
                Use at checkout · Valid for 1 year · First order only
              </p>
            </div>

            {/* Referral section */}
            <div className="bg-white rounded-2xl p-6 mb-4"
              style={{ border: "1px solid rgba(17,24,39,0.07)", boxShadow: "0 2px 12px rgba(17,24,39,0.04)" }}>
              <p className="text-[9.5px] font-black uppercase tracking-widest mb-1"
                style={{ color: "rgba(17,24,39,0.3)" }}>Refer others. Unlock bigger rewards.</p>
              <p className="text-[14px] font-semibold text-[#111827] mb-5">
                Share your link. Every person who fills the survey counts towards your next milestone.
              </p>

              {/* Milestone ladder */}
              <div className="space-y-2 mb-5">
                {MILESTONES.map((m, i) => (
                  <div key={m.key} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(17,24,39,0.035)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black"
                      style={{ background: m.color === "#FACC15" ? "#FACC15" : `${m.color}18`, color: m.color === "#FACC15" ? "#111827" : m.color }}>
                      {m.threshold}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-[#111827]">{m.threshold} referrals</p>
                      <p className="text-[11px]" style={{ color: "rgba(17,24,39,0.45)" }}>{m.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Link copy */}
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: "#FBF9F5" }}>
                <code className="flex-1 text-[11px] font-semibold text-[#111827] break-all">{refUrl}</code>
                <button onClick={() => copy(refUrl, "ref")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-black shrink-0 transition-colors"
                  style={{
                    background: copied === "ref" ? "#FACC15" : "rgba(17,24,39,0.07)",
                    color: "#111827",
                  }}>
                  {copied === "ref" ? <Check size={11} /> : <Copy size={11} />}
                  {copied === "ref" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[10px] mt-2" style={{ color: "rgba(17,24,39,0.28)" }}>
                Your code: <strong className="text-[#111827]">{result.referral_code}</strong>
                {" "}· Milestone codes are delivered to your email automatically
              </p>
            </div>

            <Link href="/"
              className="inline-flex items-center gap-2 text-[13px] font-black"
              style={{ color: "#111827" }}>
              Continue to LoqMart
              <ExternalLink size={12} />
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  // ─── SURVEY + CONTACT ────────────────────────────────────────

  return (
    <div style={{ background: "#0f1010", minHeight: "100vh" }}>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5" style={{ background: "rgba(255,255,255,0.08)" }}>
        <motion.div
          className="h-full"
          style={{ background: "#FACC15" }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Back / counter */}
      {(phase === "survey" && qIndex > 0) || phase === "contact" ? (
        <button onClick={handleBack}
          className="fixed top-5 left-5 z-40 w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}>
          <ChevronLeft size={15} />
        </button>
      ) : null}

      <div className="fixed top-5 right-5 z-40">
        <span className="text-[10px] font-black tabular-nums" style={{ color: "rgba(255,255,255,0.25)" }}>
          {phase === "survey" ? `${qIndex + 1} / ${TOTAL}` : "done"}
        </span>
      </div>

      {/* Content */}
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">

            {/* Questions */}
            {phase === "survey" && (
              <motion.div
                key={`q-${qIndex}`}
                initial={{ opacity: 0, x: direction * 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -50 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}>

                <p className="text-[9.5px] font-black tracking-widest mb-5"
                  style={{ color: "rgba(255,255,255,0.2)" }}>
                  {currentQ.num} of {String(TOTAL).padStart(2, "0")}
                </p>

                <h2 className="text-[26px] sm:text-[32px] font-black text-white leading-tight tracking-tight mb-9">
                  {currentQ.text}
                </h2>

                {currentQ.type === "single" && (
                  <div className="space-y-2.5">
                    {(currentQ.options as readonly string[]).map(opt => {
                      const selected = answers[currentQ.id] === opt
                      return (
                        <button key={opt} onClick={() => handleSingle(opt)}
                          className="w-full text-left px-5 py-4 rounded-xl text-[14px] font-semibold transition-all"
                          style={{
                            background: selected ? "#FACC15" : "rgba(255,255,255,0.06)",
                            color:      selected ? "#111827" : "rgba(255,255,255,0.72)",
                            borderLeft: `3px solid ${selected ? "#FACC15" : "transparent"}`,
                          }}
                          onMouseEnter={e => {
                            if (!selected) {
                              ;(e.currentTarget as HTMLElement).style.background  = "rgba(255,255,255,0.1)"
                              ;(e.currentTarget as HTMLElement).style.borderLeft  = "3px solid rgba(250,204,21,0.5)"
                            }
                          }}
                          onMouseLeave={e => {
                            if (!selected) {
                              ;(e.currentTarget as HTMLElement).style.background  = "rgba(255,255,255,0.06)"
                              ;(e.currentTarget as HTMLElement).style.borderLeft  = "3px solid transparent"
                            }
                          }}>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                )}

                {currentQ.type === "multi" && (
                  <div>
                    <div className="grid grid-cols-2 gap-2.5 mb-7">
                      {(currentQ.options as readonly string[]).map(opt => {
                        const selected = ((answers.q7_categories as string[]) || []).includes(opt)
                        return (
                          <button key={opt} onClick={() => handleMultiToggle(opt)}
                            className="text-left px-4 py-3.5 rounded-xl text-[13px] font-semibold transition-all"
                            style={{
                              background:  selected ? "#FACC15" : "rgba(255,255,255,0.06)",
                              color:       selected ? "#111827" : "rgba(255,255,255,0.68)",
                              borderLeft: `3px solid ${selected ? "#FACC15" : "transparent"}`,
                            }}
                            onMouseEnter={e => {
                              if (!selected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"
                            }}
                            onMouseLeave={e => {
                              if (!selected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"
                            }}>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                    <button onClick={() => advance(qIndex)}
                      className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-[13px]"
                      style={{ background: "#FACC15", color: "#111827" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = "brightness(0.92)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = ""}>
                      Continue
                      <ArrowRight size={14} />
                    </button>
                    <p className="mt-3 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                      Select any that apply, or skip with Continue
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Contact form */}
            {(phase === "contact" || phase === "submitting") && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.22 }}>

                <p className="text-[9.5px] font-black tracking-widest mb-5"
                  style={{ color: "rgba(255,255,255,0.2)" }}>
                  Final step
                </p>

                <h2 className="text-[28px] font-black text-white leading-tight tracking-tight mb-2">
                  Where do we send your discount?
                </h2>
                <p className="text-[13px] mb-9" style={{ color: "rgba(255,255,255,0.32)" }}>
                  Your 5% discount code and referral link will be shown immediately.
                  We don&apos;t send marketing emails.
                </p>

                <div className="space-y-3 mb-7">
                  {[
                    { key: "email",      label: "Email address",   type: "email", placeholder: "you@example.com" },
                    { key: "name",       label: "Your name",       type: "text",  placeholder: "Full name"        },
                    { key: "city_state", label: "City & State",    type: "text",  placeholder: "e.g. Jaipur, Rajasthan" },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[9.5px] font-black uppercase tracking-widest mb-1.5"
                        style={{ color: "rgba(255,255,255,0.3)" }}>
                        {label}
                      </label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={(contact as any)[key]}
                        onChange={e => setContact(c => ({ ...c, [key]: e.target.value }))}
                        disabled={phase === "submitting"}
                        className="w-full px-4 py-3.5 rounded-xl text-[14px] font-medium outline-none transition-all disabled:opacity-50"
                        style={{
                          background:  "rgba(255,255,255,0.07)",
                          border:      "1px solid rgba(255,255,255,0.1)",
                          color:       "white",
                        }}
                        onFocus={e => {
                          e.currentTarget.style.borderColor = "#FACC15"
                          e.currentTarget.style.background  = "rgba(255,255,255,0.1)"
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
                          e.currentTarget.style.background  = "rgba(255,255,255,0.07)"
                        }}
                      />
                    </div>
                  ))}
                </div>

                {submitError && (
                  <p className="mb-5 text-[12px] font-semibold" style={{ color: "#f87171" }}>
                    {submitError}
                  </p>
                )}

                <button
                  onClick={phase === "contact" ? handleSubmit : undefined}
                  disabled={phase === "submitting"}
                  className="flex items-center gap-2 px-7 py-4 rounded-xl font-black text-[14px] disabled:opacity-50 transition-all"
                  style={{ background: "#FACC15", color: "#111827" }}
                  onMouseEnter={e => { if (phase !== "submitting") (e.currentTarget as HTMLElement).style.filter = "brightness(0.92)" }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = ""}>
                  {phase === "submitting" ? "Submitting..." : "Submit Survey"}
                  {phase === "contact" && <ArrowRight size={14} />}
                </button>

                <p className="mt-4 text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                  Your data is used solely to improve LoqMart. We do not sell or share it.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Page export with required Suspense boundary ──────────────

export default function SurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1010" }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#FACC15] border-t-transparent animate-spin" />
      </div>
    }>
      <SurveyInner />
    </Suspense>
  )
}
