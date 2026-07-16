"use client"

import { BadgeCheck, MapPin, Shield, Truck, Star, Award, Package, CreditCard } from "lucide-react"

const items = [
  { icon: BadgeCheck, text: "GST Verified Sellers" },
  { icon: MapPin,     text: "State-Tagged Products" },
  { icon: CreditCard, text: "Secure Razorpay Payments" },
  { icon: Shield,     text: "Swadeshi Ranked" },
  { icon: Truck,      text: "Pan-India Delivery" },
  { icon: Star,       text: "Buyer Protection" },
  { icon: Award,      text: "100% Made in India" },
  { icon: Package,    text: "Easy Returns" },
]

export function TrustBar() {
  const doubled = [...items, ...items]
  return (
    <div className="bg-[#f3f3f3] border-y border-[#eeeeee] py-3 overflow-hidden">
      <div className="flex items-center gap-0 animate-marquee whitespace-nowrap" style={{ willChange: "transform" }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 mx-8 text-sm font-semibold text-[#1a1c1c]/60 shrink-0">
            <item.icon className="w-3.5 h-3.5 text-[#725c00] shrink-0" />
            {item.text}
            <span className="mx-4 text-[#1a1c1c]/20">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
