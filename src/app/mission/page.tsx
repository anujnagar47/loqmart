import Link from "next/link"
import { Target, MapPin, Users, Landmark, Sprout, HeartHandshake } from "lucide-react"

export const metadata = {
  title: "Our Mission | LoqMart",
  description: "LoqMart's mission is to make it effortless to discover and buy authentic Indian-made products, and to put more of every rupee spent into the hands of the people who make them.",
}

const pillars = [
  {
    icon: MapPin,
    title: "Origin You Can Trust",
    desc: "Every listing is tagged to the state it was made in. No guessing whether a product is genuinely Indian-made or an unmarked import.",
  },
  {
    icon: Users,
    title: "Makers Come First",
    desc: "We keep commission rates low, especially for handmade categories, so artisans and small manufacturers keep more of what they earn.",
  },
  {
    icon: Landmark,
    title: "Formal, Verifiable Trade",
    desc: "GST, PAN and bank verification for every seller means transactions are traceable, legitimate, and accountable - good for buyers and for India's formal economy.",
  },
  {
    icon: Sprout,
    title: "Grassroots Reach",
    desc: "From single-artisan workshops to registered MSMEs, LoqMart is built to onboard sellers who have never had an online storefront before.",
  },
]

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="relative py-24 px-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #231b00 0%, #3d2f00 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <Target className="w-10 h-10 text-[#fcd020] mx-auto mb-5" />
          <span className="text-[#fcd020]/70 text-xs font-bold uppercase tracking-[0.3em] block mb-4">Our Mission</span>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Every Rupee Spent Should Build India.
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            LoqMart exists to make it simple to find genuinely Indian-made products, and to route more of what buyers pay straight back to the artisans, MSMEs and manufacturers who make them.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20 space-y-20">
        <section className="text-center">
          <h2 className="text-3xl font-extrabold text-on-surface mb-4">Why LoqMart Exists</h2>
          <p className="text-on-surface-variant max-w-3xl mx-auto text-lg leading-relaxed">
            Most marketplaces optimise for the lowest price, regardless of where a product comes from. LoqMart optimises for provenance: it&rsquo;s a Swadeshi-first marketplace where a buyer can filter by state, verify a seller&rsquo;s GST and MSME status, and know that their purchase supports an Indian workshop or factory - not an anonymous reseller.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-extrabold text-on-surface text-center mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((p) => (
              <div key={p.title} className="flex gap-5 bg-surface-container-lowest rounded-xl p-6">
                <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center shrink-0">
                  <p.icon className="w-6 h-6 text-on-primary-fixed" />
                </div>
                <div>
                  <h3 className="font-extrabold text-on-surface mb-1">{p.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-2xl p-10 text-center">
          <HeartHandshake className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-on-surface mb-4">The Long-Term Goal</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            To be the default place Indians go to buy Indian-made - so that choosing a domestically made product is never the harder, slower, or more expensive option.
          </p>
        </section>

        <section className="text-center">
          <p className="text-on-surface-variant mb-4">Want to be part of it?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/seller/register" className="inline-flex items-center justify-center bg-primary-container text-on-primary-fixed font-bold px-8 py-3 rounded-lg hover:brightness-95 transition-all">
              Sell on LoqMart
            </Link>
            <Link href="/about" className="inline-flex items-center justify-center border border-outline-variant text-on-surface font-bold px-8 py-3 rounded-lg hover:bg-surface-container transition-all">
              Read Our Story
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
