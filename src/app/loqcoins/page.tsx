"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Star, Gift, ShoppingBag, ArrowRight, Clock, TrendingUp, Award, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const earnWays = [
  { icon: ShoppingBag, title: "Shop on LoqMart",   desc: "Earn 1 LoqCoin for every ₹100 spent on any product",              coins: "+1 per ₹100"   },
  { icon: Star,        title: "Write a Review",     desc: "Leave a verified review after delivery and earn coins",            coins: "+5 per review" },
  { icon: Gift,        title: "Refer a Friend",     desc: "When your friend makes their first purchase, you both earn",      coins: "+50 coins"     },
  { icon: Award,       title: "Complete Profile",   desc: "Add your name, state, and profile picture to claim bonus coins", coins: "+10 coins"     },
]

const redeemWays = [
  { title: "₹1 off any order",      coins: "1 LoqCoin = ₹1",    desc: "Apply at checkout. Max 50% of order value."  },
  { title: "Free Express Shipping", coins: "200 LoqCoins",       desc: "Next-day delivery on any order above ₹499." },
  { title: "Premium Membership",    coins: "500 LoqCoins/month", desc: "0% platform fee for buyers for 30 days."    },
]

const TYPE_LABEL: Record<string, string> = {
  earn: "Earned", redeem: "Redeemed", expire: "Expired",
  bonus: "Bonus", referral: "Referral Bonus",
  review_reward: "Review Reward", order_earn: "Order Reward",
}

export default function LoqCoinsPage() {
  const [balance,  setBalance]  = useState<number | null>(null)
  const [lifetime, setLifetime] = useState<number | null>(null)
  const [redeemed, setRedeemed] = useState<number | null>(null)
  const [ledger,   setLedger]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    async function fetchCoins() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }
      setLoggedIn(true)
      const [{ data: bal }, { data: txns }] = await Promise.all([
        supabase.from("loqcoin_balances").select("balance, lifetime_earned, lifetime_redeemed").eq("user_id", session.user.id).single(),
        supabase.from("loqcoin_ledger").select("id, transaction_type, amount, description, created_at, expires_at")
          .eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(20),
      ])
      setBalance(bal?.balance ?? 0)
      setLifetime(bal?.lifetime_earned ?? 0)
      setRedeemed(bal?.lifetime_redeemed ?? 0)
      setLedger(txns || [])
      setLoading(false)
    }
    fetchCoins()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #111827 0%, #3d2f00 100%)" }}>
        <div className="relative max-w-2xl mx-auto">
          <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#FACC15" }}>
            <Star className="w-12 h-12 text-[#111827]" />
          </motion.div>
          <motion.h1 className="text-[44px] font-black text-white tracking-tight mb-3"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            LoqCoins
          </motion.h1>
          <motion.p className="text-white/55 text-[15px] mb-8 leading-relaxed"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            Every rupee you spend on Indian-made products earns you LoqCoins. Spend them on future orders.
          </motion.p>

          {loading ? (
            <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
          ) : loggedIn ? (
            <motion.div className="grid grid-cols-3 gap-4 max-w-lg mx-auto"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              {[
                { label: "Current Balance", value: (balance ?? 0).toLocaleString() },
                { label: "Lifetime Earned", value: (lifetime ?? 0).toLocaleString() },
                { label: "Redeemed",        value: (redeemed ?? 0).toLocaleString() },
              ].map((s, i) => (
                <motion.div key={s.label} className="rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.07 }}>
                  <p className="text-[22px] font-black" style={{ color: "#FACC15" }}>{s.value}</p>
                  <p className="text-white/45 text-[11px] mt-1">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Link href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-black text-[#111827]"
                style={{ background: "#FACC15" }}>
                Sign in to see your balance <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        {/* How to Earn */}
        <section className="mb-14">
          <h2 className="text-[26px] font-extrabold text-[#111827] tracking-tight mb-1">How to Earn LoqCoins</h2>
          <p className="text-[13px] text-[#111827]/45 mb-6">Every interaction on LoqMart earns you coins. Coins expire 1 year from earning date.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {earnWays.map((way, i) => (
              <motion.div key={way.title} className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(17,24,39,0.07)" }}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(17,24,39,0.08)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FACC15" }}>
                    <way.icon size={20} className="text-[#111827]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-[14px] text-[#111827]">{way.title}</h3>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ border: "1px solid rgba(17,24,39,0.15)", color: "#111827" }}>{way.coins}</span>
                    </div>
                    <p className="text-[12px] text-[#111827]/45">{way.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How to Redeem */}
        <section className="mb-14">
          <h2 className="text-[26px] font-extrabold text-[#111827] tracking-tight mb-1">How to Redeem</h2>
          <p className="text-[13px] text-[#111827]/45 mb-6">Apply LoqCoins at checkout. 1 LoqCoin = ₹1 discount.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {redeemWays.map((way, i) => (
              <motion.div key={way.title} className="bg-white rounded-2xl p-5 text-center" style={{ border: "1px solid rgba(17,24,39,0.07)" }}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(17,24,39,0.08)" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FACC15" }}>
                  <Gift size={20} className="text-[#111827]" />
                </div>
                <p className="font-bold text-[14px] text-[#111827] mb-1">{way.title}</p>
                <p className="font-black text-[16px] text-[#111827] mb-2">{way.coins}</p>
                <p className="text-[12px] text-[#111827]/45">{way.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Transaction history */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[26px] font-extrabold text-[#111827] tracking-tight">Transaction History</h2>
            <span className="flex items-center gap-1 text-[11px] text-[#111827]/40">
              <Clock size={12} /> Coins expire after 1 year
            </span>
          </div>

          {!loggedIn ? (
            <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
              <Star size={32} className="text-[#111827]/15 mx-auto mb-3" />
              <p className="font-bold text-[14px] text-[#111827]/40 mb-4">Sign in to see your transaction history</p>
              <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black text-[#111827]"
                style={{ background: "#FACC15" }}>
                Sign In <ArrowRight size={13} />
              </Link>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#111827]/30" /></div>
          ) : ledger.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
              <Star size={32} className="text-[#111827]/15 mx-auto mb-3" />
              <p className="font-bold text-[14px] text-[#111827]/40 mb-1">No transactions yet</p>
              <p className="text-[12px] text-[#111827]/30">Start shopping to earn your first LoqCoins!</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
              {ledger.map((entry, i) => {
                const isEarn = entry.amount > 0
                return (
                  <motion.div key={entry.id} className="flex items-center justify-between p-4"
                    style={{ borderBottom: i < ledger.length - 1 ? "1px solid rgba(17,24,39,0.05)" : "none" }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: isEarn ? "rgba(5,150,105,0.1)" : "rgba(234,88,12,0.1)" }}>
                        {isEarn
                          ? <TrendingUp size={14} className="text-green-600" />
                          : <Gift size={14} className="text-orange-600" />}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#111827]">
                          {entry.description || TYPE_LABEL[entry.transaction_type] || entry.transaction_type}
                        </p>
                        <p className="text-[10.5px] text-[#111827]/35">
                          {new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {entry.expires_at && ` · Expires ${new Date(entry.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                        </p>
                      </div>
                    </div>
                    <span className={`font-black text-[14px] ${isEarn ? "text-green-600" : "text-orange-600"}`}>
                      {isEarn ? "+" : ""}{entry.amount}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-black text-[#111827]"
                style={{ background: "#FACC15" }}>
                Start Earning LoqCoins <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}
