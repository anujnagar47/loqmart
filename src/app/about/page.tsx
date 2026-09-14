import Link from "next/link"
import { Heart, Shield, MapPin, Target, Users, TrendingUp } from "lucide-react"

export const metadata = {
  title: "About LoqMart – India's Swadeshi Marketplace",
  description: "Learn about LoqMart's mission to connect Indian manufacturers, artisans, and MSMEs directly to buyers across India.",
}

const values = [
  {
    icon: Heart,
    title: "Swadeshi First",
    desc: "Every product on LoqMart is made in India, by Indians. We verify every seller's origin before listing.",
  },
  {
    icon: Shield,
    title: "Verified Sellers",
    desc: "GST registration, PAN verification, and bank account checks ensure every seller is legitimate.",
  },
  {
    icon: MapPin,
    title: "State-Origin Transparency",
    desc: "Every product is tagged to its state of manufacture. Buy Banarasi silk from UP. Channapatna toys from Karnataka.",
  },
  {
    icon: TrendingUp,
    title: "MSME Growth",
    desc: "Our commission structure is the lowest in the industry for handmade products - so more money stays with the maker.",
  },
]

const milestones = [
  { year: "2024", event: "LoqMart founded. First 100 sellers onboarded from Rajasthan and UP." },
  { year: "2024", event: "India Map feature launched - first e-commerce platform with state-tagged discovery." },
  { year: "2024", event: "LoqCoins loyalty program introduced." },
  { year: "2025", event: "Craft Chronicles blog launched. Covering heritage crafts from 28 states." },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="relative py-24 px-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #231b00 0%, #3d2f00 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[#fcd020]/70 text-xs font-bold uppercase tracking-[0.3em] block mb-4">Our Story</span>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
            Shop India.<br />Support India.<br />Build India.
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            LoqMart was built with one belief: Indian buyers should be able to discover and buy the best of India&apos;s manufacturing and craftsmanship - state by state, craft by craft, maker by maker.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20 space-y-20">
        {/* Mission */}
        <section className="text-center">
          <Target className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-on-surface mb-4">Our Mission</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-lg leading-relaxed">
            To become the primary discovery platform for verified Indian-made products - connecting <strong className="text-on-surface">1 lakh+ sellers</strong> across all 28 states and 8 union territories to buyers who want to invest in India&apos;s economic future.
          </p>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-3xl font-extrabold text-on-surface text-center mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="flex gap-5 bg-surface-container-lowest rounded-xl p-6">
                <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center shrink-0">
                  <v.icon className="w-6 h-6 text-on-primary-fixed" />
                </div>
                <div>
                  <h3 className="font-extrabold text-on-surface mb-1">{v.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Numbers */}
        <section className="bg-surface-container-lowest rounded-2xl p-10">
          <h2 className="text-3xl font-extrabold text-on-surface text-center mb-10">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "28+", label: "States Covered" },
              { value: "5,000+", label: "Verified Sellers" },
              { value: "50,000+", label: "Products Listed" },
              { value: "10 Lakh+", label: "Orders Delivered" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-black text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-on-surface-variant font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-3xl font-extrabold text-on-surface text-center mb-10">Our Journey</h2>
          <div className="relative border-l-2 border-primary-container ml-4 space-y-8">
            {milestones.map((m, i) => (
              <div key={i} className="relative pl-8">
                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-primary-container rounded-full border-2 border-surface" />
                <span className="text-xs font-black text-primary uppercase tracking-wider block mb-1">{m.year}</span>
                <p className="text-on-surface text-sm leading-relaxed">{m.event}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="text-on-surface-variant mb-4">Ready to support India&apos;s artisans and manufacturers?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="inline-flex items-center justify-center bg-primary-container text-on-primary-fixed font-bold px-8 py-3 rounded-lg hover:brightness-95 transition-all">
              Start Shopping
            </Link>
            <Link href="/seller/register" className="inline-flex items-center justify-center border border-outline-variant text-on-surface font-bold px-8 py-3 rounded-lg hover:bg-surface-container transition-all">
              Sell on LoqMart
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
