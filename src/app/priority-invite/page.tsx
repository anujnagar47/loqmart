"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Loader2, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const REGIONS = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu", "Delhi", "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry", "Other"]

export default function PriorityInvitePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [region, setRegion] = useState("")
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      setName(user.user_metadata?.full_name || user.user_metadata?.name || "")
      setEmail(user.email || "")
      setRegion(user.user_metadata?.priority_invite?.region || "")
      setSaved(Boolean(user.user_metadata?.priority_invite?.region))
      setLoading(false)
    }
    void load()
  }, [router])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!region) { setError("Choose your state or region to join the priority list."); return }
    setSaving(true); setError("")
    const supabase = createClient()
    const { error: saveError } = await supabase.auth.updateUser({ data: {
      full_name: name.trim(),
      priority_invite: { name: name.trim(), email, region, joined_at: new Date().toISOString() },
    } })
    if (saveError) setError("We couldn’t save your invitation details. Please try again.")
    else setSaved(true)
    setSaving(false)
  }

  const signOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/")
    router.refresh()
  }

  return <main className="min-h-screen bg-white px-4 py-16 text-[#111827]">
    <section className="mx-auto max-w-xl border border-[#E5E7EB] bg-white p-7 shadow-sm sm:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#fcd020] text-[#231b00]"><Check size={21} /></div>
        <button type="button" onClick={signOut} disabled={signingOut} className="inline-flex h-10 items-center gap-2 border border-[#d0c6ac] px-3 text-sm font-medium text-[#111827] hover:bg-[#f3f3f3] disabled:opacity-60">
          {signingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}{signingOut ? "Signing out" : "Sign out"}
        </button>
      </div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#725c00]">LoqMart early access</p>
      <h1 className="text-3xl font-bold tracking-tight">A first look is on its way</h1>
      <p className="mt-4 text-sm leading-6 text-[#4d4632]">{saved ? "We are curating India’s authentic heritage craft clusters. You are on the priority list and will receive exclusive first access when our storefront goes live." : "Your sign-in is complete. Share your region to join the priority list for launch updates."}</p>
      {loading ? <div className="mt-8 flex h-28 items-center justify-center text-sm text-[#4d4632]"><Loader2 size={16} className="mr-2 animate-spin" />Loading your invitation details</div> : !saved ? <form onSubmit={save} className="mt-8 space-y-4">
        <label className="block text-sm font-medium">Your name<input value={name} onChange={e => setName(e.target.value)} required className="mt-1.5 h-11 w-full border border-[#d0c6ac] px-3 text-sm outline-none focus:border-[#725c00]" /></label>
        <label className="block text-sm font-medium">Email<input value={email} readOnly className="mt-1.5 h-11 w-full border border-[#d0c6ac] bg-[#f3f3f3] px-3 text-sm" /></label>
        <label className="block text-sm font-medium">State or region<select value={region} onChange={e => setRegion(e.target.value)} required className="mt-1.5 h-11 w-full border border-[#d0c6ac] bg-white px-3 text-sm outline-none focus:border-[#725c00]"><option value="">Choose your region</option>{REGIONS.map(item => <option key={item}>{item}</option>)}</select></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={saving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#fcd020] px-4 text-sm font-semibold text-[#231b00] transition-colors hover:bg-[#eab308] disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? "Saving your details" : "Join the priority list"}</button>
      </form> : <div className="mt-8 border border-[#d0c6ac] bg-[#f3f3f3] p-4 text-sm"><p className="font-semibold">You’re on the priority list</p><p className="mt-1 text-[#4d4632]">We’ll send launch updates to {email}{region ? ` and keep you posted about ${region}` : ""}.</p></div>}
      <p className="mt-8 text-sm text-[#4d4632]">Interested in selling? <Link className="font-semibold text-[#725c00] underline underline-offset-4" href="/seller/register">Start seller verification</Link></p>
    </section>
  </main>
}
