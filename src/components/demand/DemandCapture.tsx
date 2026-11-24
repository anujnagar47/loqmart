"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, BellRing, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { INDIA_STATE_DATA } from "@/lib/indiaStateData"

const WELCOME_KEY = "loqmart_welcomed_v1"
const EXAMPLES = ["Banarasi Saree...", "Jodhpuri Solid Wood Table...", "Handcrafted Leather Shoes...", "Cotton Shirt or Kurta...", "Brass Home Decor..."]
const QUICK_PICKS = ["Sarees & Handlooms", "Solid Wood Furniture", "Footwear", "Apparel", "Home Decor"]

function IndiaGatheringMark() {
  return <svg viewBox="0 0 340 190" role="img" aria-label="Craft traditions from across India coming together" className="mx-auto h-32 w-full max-w-[330px]">
    <defs>
      <linearGradient id="india-warm" x1="0" x2="1"><stop stopColor="#725c00"/><stop offset="1" stopColor="#d7a900"/></linearGradient>
      <clipPath id="india-shape"><path d="M144 14 165 19 174 31 192 35 202 48 223 54 231 67 224 81 233 91 222 103 218 120 203 129 195 145 183 150 180 166 170 179 161 169 156 151 145 140 139 122 124 111 119 95 105 84 110 70 100 58 112 49 122 33 137 28Z"/></clipPath>
    </defs>
    <g fill="none" stroke="#d0c6ac" strokeWidth="1.5" strokeDasharray="4 6">
      <motion.path d="M17 46 C65 42 91 57 136 72" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:.8,delay:.15}}/><motion.path d="M28 142 C73 132 106 116 137 100" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:.8,delay:.3}}/><motion.path d="M324 38 C274 45 239 61 205 77" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:.8,delay:.2}}/><motion.path d="M316 145 C266 136 234 119 207 103" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:.8,delay:.35}}/>
    </g>
    <motion.g fill="#c89c08" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.35,delay:1.1}}>
      <circle cx="19" cy="45" r="5"/><circle cx="29" cy="142" r="5"/><circle cx="322" cy="39" r="5"/><circle cx="315" cy="145" r="5"/>
    </motion.g>
    <motion.g clipPath="url(#india-shape)" initial={{opacity:.35,scale:.94}} animate={{opacity:1,scale:1}} transition={{duration:.65,delay:.8}} style={{transformOrigin:"170px 95px"}}>
      <rect x="94" y="8" width="150" height="178" fill="url(#india-warm)"/>
      <path d="M103 62h138M102 91h138M110 120h115M130 148h62" stroke="#fff8db" strokeOpacity=".75" strokeWidth="2"/>
      <path d="M135 15v166M164 13v167M194 28v128" stroke="#fff8db" strokeOpacity=".35" strokeWidth="1.5"/>
    </motion.g>
    {[
      {x:82,y:54,dx:16,delay:.1},{x:88,y:124,dx:12,delay:.2},{x:241,y:55,dx:-16,delay:.15},{x:235,y:124,dx:-12,delay:.25},
    ].map((hand,index)=><motion.g key={index} initial={{x:hand.dx,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:.55,delay:hand.delay,ease:"easeOut"}} fill="none" stroke="#725c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={`M${hand.x} ${hand.y} l${index<2?9:-9} 0 l${index<2?5: -5} 4 l${index<2?7:-7} 0`}/><path d={`M${hand.x+3} ${hand.y+6} q6 6 12 0`}/></motion.g>)}
    <path d="M144 14 165 19 174 31 192 35 202 48 223 54 231 67 224 81 233 91 222 103 218 120 203 129 195 145 183 150 180 166 170 179 161 169 156 151 145 140 139 122 124 111 119 95 105 84 110 70 100 58 112 49 122 33 137 28Z" fill="none" stroke="#725c00" strokeWidth="2"/>
  </svg>
}

export function DemandCapture({ showWelcome = false }: { showWelcome?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const states = useMemo(() => INDIA_STATE_DATA, [])
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"welcome" | "unavailable" | "submitted">("welcome")
  const [query, setQuery] = useState("")
  const [stateCode, setStateCode] = useState("")
  const [pincode, setPincode] = useState("")
  const [contact, setContact] = useState("")
  const [contactConsent, setContactConsent] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderText, setPlaceholderText] = useState("")
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [source, setSource] = useState<"welcome"|"search"|"footer">("welcome")

  const close = useCallback(() => {
    setOpen(false)
    if (pathname === "/") {
      try { localStorage.setItem(WELCOME_KEY, "1") } catch { /* optional browser storage */ }
    }
  }, [pathname])

  useEffect(() => {
    if (showWelcome) {
      try { if (!localStorage.getItem(WELCOME_KEY)) setOpen(true) } catch { setOpen(true) }
    }
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string; source?: "welcome"|"search"|"footer" }>).detail
      setQuery(detail?.query || "")
      setSource(detail?.source || (detail?.query ? "search" : "welcome"))
      setStep("welcome")
      setMessage("")
      setOpen(true)
    }
    window.addEventListener("loqmart:open-welcome", onOpen)
    window.addEventListener("loqmart:request-demand", onOpen)
    return () => {
      window.removeEventListener("loqmart:open-welcome", onOpen)
      window.removeEventListener("loqmart:request-demand", onOpen)
    }
  }, [showWelcome])

  useEffect(() => {
    const phrase = EXAMPLES[placeholderIndex]
    const wait = placeholderText.length >= phrase.length ? 1150 : placeholderText.length === 0 ? 350 : 62
    const timer = window.setTimeout(() => {
      if (placeholderText.length >= phrase.length) {
        setPlaceholderIndex(index => (index + 1) % EXAMPLES.length)
        setPlaceholderText("")
      } else setPlaceholderText(phrase.slice(0, placeholderText.length + 1))
    }, wait)
    return () => window.clearTimeout(timer)
  }, [placeholderIndex, placeholderText])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("loqmart-delivery-location") || "{}")
      if (saved.stateCode && !stateCode) setStateCode(saved.stateCode)
      if (saved.pincode && !pincode) setPincode(saved.pincode)
    } catch { /* optional browser storage */ }
  }, [pincode, stateCode])

  const saveLocation = () => {
    const selected = states.find(s => s.id === stateCode)
    try {
      localStorage.setItem("loqmart-delivery-location", JSON.stringify({
        state: selected?.name || "India", stateCode: selected?.id || null,
        pincode: /^\d{6}$/.test(pincode) ? pincode : null,
      }))
    } catch { /* optional browser storage */ }
    window.dispatchEvent(new CustomEvent("loqmart:location-updated", { detail: { stateCode, pincode } }))
  }

  async function explore(event: FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || checking) return
    try { localStorage.setItem(WELCOME_KEY, "1") } catch { /* optional browser storage */ }
    saveLocation()
    setChecking(true)
    setMessage("")
    try {
      const response = await fetch(`/api/catalog-search?q=${encodeURIComponent(trimmed)}&limit=1`)
      const result = await response.json()
      if (response.ok && result.total > 0) {
        setMessage(`Wonderful! We have authentic ${trimmed} collections ready for you.`)
        window.setTimeout(() => router.push(`/catalog?q=${encodeURIComponent(trimmed)}`), 800)
      } else {
        setStep("unavailable")
      }
    } catch {
      setStep("unavailable")
    } finally { setChecking(false) }
  }

  async function requestItem() {
    if (!query.trim() || saving || (contact && !contactConsent)) return
    setSaving(true)
    saveLocation()
    try {
      const response = await fetch("/api/demand-requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), stateCode: stateCode || null, contact: contact.trim() || null, source }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "We could not record your request just now.")
      setStep("submitted")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not record your request just now.")
    } finally { setSaving(false) }
  }

  return <>
    <AnimatePresence>
      {open && <motion.div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#171717]/55 p-3 backdrop-blur-sm sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.section role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="relative my-auto w-full max-w-2xl rounded-xl border border-[#d0c6ac] bg-[#fffdf8] shadow-2xl" initial={{ opacity: 0, y: 20, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: .22 }}>
          <button type="button" onClick={close} aria-label="Close welcome" className="absolute right-3 top-3 z-10 rounded-md p-2 text-[#4d4632] hover:bg-[#f3f3f3]"><X size={18}/></button>
          <div className="px-5 pb-5 pt-7 sm:px-9 sm:pt-8">
            {step === "welcome" && <>
              <div className="text-center"><IndiaGatheringMark/><p className="mt-1 text-[10px] font-bold uppercase tracking-[.2em] text-[#725c00]">Handmade traditions. Modern makers.</p><h2 id="welcome-title" className="mt-2 text-2xl font-black tracking-tight text-[#231b00] sm:text-3xl">Namaste! Welcome to LoqMart</h2><p className="mt-1 text-sm text-[#4d4632]">India’s craft and heritage marketplace</p></div>
              <form onSubmit={explore} className="mt-6 space-y-5">
                <div><label htmlFor="welcome-state" className="mb-2 block text-xs font-bold text-[#231b00]">Where are you joining us from?</label><div className="grid gap-2 sm:grid-cols-[1fr_150px]"><select id="welcome-state" value={stateCode} onChange={e=>setStateCode(e.target.value)} className="h-10 rounded-md border border-[#d0c6ac] bg-white px-3 text-sm text-[#1a1c1c]"><option value="">Choose a state or union territory</option>{states.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><input aria-label="Optional pincode" inputMode="numeric" maxLength={6} value={pincode} onChange={e=>setPincode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="Pincode (optional)" className="h-10 rounded-md border border-[#d0c6ac] bg-white px-3 text-sm"/></div></div>
                <div><label htmlFor="welcome-interest" className="mb-2 block text-xs font-bold text-[#231b00]">What would you like to explore first?</label><div className="relative"><input id="welcome-interest" value={query} onChange={e=>setQuery(e.target.value)} placeholder="" className="h-11 w-full rounded-md border border-[#d0c6ac] bg-white px-3 text-sm outline-none focus:border-[#725c00] focus:ring-2 focus:ring-[#fcd020]/50"/>{!query&&<span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#4d4632]/55">(e.g., {placeholderText}<span className="ml-0.5 animate-pulse">|</span>)</span>}</div><div className="mt-2 flex flex-wrap gap-2">{QUICK_PICKS.map(item=><button key={item} type="button" onClick={()=>setQuery(item)} className="rounded-full border border-[#d0c6ac] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#4d4632] hover:border-[#725c00] hover:bg-[#fff8db]">{item}</button>)}</div></div>
                {message&&<p role="status" className="rounded-md bg-[#f8f1d9] px-3 py-2 text-sm font-semibold text-[#725c00]">{message}</p>}
                <div className="flex flex-col-reverse justify-between gap-2 sm:flex-row sm:items-center"><button type="button" onClick={close} className="rounded-md px-4 py-2.5 text-xs font-semibold text-[#4d4632] hover:bg-[#f3f3f3]">Skip to Storefront</button><button disabled={!query.trim()||checking} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#fcd020] px-5 py-2.5 text-sm font-black text-[#231b00] disabled:cursor-not-allowed disabled:opacity-60">{checking?"Checking catalog…":"Explore Now"}<ArrowRight size={16}/></button></div>
              </form>
            </>}
            {step === "unavailable" && <div className="py-8"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#725c00]">Demand captured</p><h2 id="welcome-title" className="mt-2 text-2xl font-black text-[#231b00]">Thank you for sharing!</h2><p className="mt-3 text-sm leading-6 text-[#4d4632]">We’re actively onboarding trusted artisans and sellers for <strong>{query}</strong> soon. Until then, explore our curated platform across India.</p><div className="mt-5 space-y-3"><label className="block text-xs font-semibold text-[#231b00]">Email or WhatsApp for a launch alert <span className="font-normal text-[#4d4632]">(optional)</span><input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Email address or phone number" className="mt-1.5 h-10 w-full rounded-md border border-[#d0c6ac] bg-white px-3 text-sm"/></label>{contact&&<label className="flex items-start gap-2 text-xs leading-5 text-[#4d4632]"><input type="checkbox" checked={contactConsent} onChange={e=>setContactConsent(e.target.checked)} className="mt-1 accent-[#725c00]"/>I agree to receive one launch update about this request using the contact I provided.</label>}{message&&<p role="alert" className="text-xs text-red-700">{message}</p>}<div className="flex flex-col gap-2 sm:flex-row"><button type="button" disabled={saving||!!contact&&!contactConsent} onClick={requestItem} className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[#fcd020] px-4 py-3 text-sm font-black text-[#231b00] disabled:opacity-60"><BellRing size={15}/>{saving?"Saving request…":"Request This Category & Notify Me"}</button><button type="button" onClick={close} className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d0c6ac] bg-white px-4 py-3 text-sm font-bold text-[#4d4632]">Explore Our Platform <ArrowRight size={15}/></button></div></div></div>}
            {step === "submitted" && <div className="py-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fcd020]/35 text-[#725c00]"><BellRing size={22}/></div><h2 id="welcome-title" className="mt-4 text-2xl font-black text-[#231b00]">Your request is on our radar</h2><p className="mt-2 text-sm text-[#4d4632]">We’ll use your interest in {query} to guide upcoming seller onboarding.</p><button type="button" onClick={close} className="mt-6 rounded-md bg-[#fcd020] px-5 py-2.5 text-sm font-bold text-[#231b00]">Explore Our Platform</button></div>}
          </div>
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  </>
}

export function DemandCaptureStrip() {
  return <section className="mx-auto my-8 max-w-7xl px-4 sm:px-6"><div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-[#d0c6ac] bg-[#fffdf8] px-4 py-4 sm:flex-row sm:items-center sm:px-6"><div><p className="text-sm font-bold text-[#231b00]">Looking for a specific shoe, saree, shirt, or furniture piece?</p><p className="mt-1 text-xs text-[#4d4632]">Tell us what you would like LoqMart to onboard next.</p></div><button type="button" onClick={()=>window.dispatchEvent(new CustomEvent("loqmart:request-demand",{detail:{source:"footer"}}))} className="shrink-0 rounded-md bg-[#fcd020] px-4 py-2.5 text-xs font-black text-[#231b00]">Request an item</button></div></section>
}
