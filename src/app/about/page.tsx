import Link from "next/link"
import { Heart, Shield, MapPin, Target, Users, TrendingUp } from "lucide-react"

export const metadata = {
  title: "About LoqMart – India's Swadeshi Marketplace",
  description: "Learn how LoqMart helps shoppers discover handmade and machine-made products from across India.",
}

const values = [
  {
    icon: Heart,
    title: "Made across India",
    desc: "Find handmade work and machine-made goods from different parts of the country.",
  },
  {
    icon: Shield,
    title: "Product details in view",
    desc: "Review useful product information before you add an item to your cart.",
  },
  {
    icon: MapPin,
    title: "Browse by location",
    desc: "Explore products by state and discover goods from across the country.",
  },
  {
    icon: TrendingUp,
    title: "Made across India",
    desc: "Discover handmade crafts and machine-made essentials in one convenient place.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="relative py-24 px-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #111827 0%, #3d2f00 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[#FACC15]/70 text-xs font-bold uppercase tracking-[0.3em] block mb-4">Our Story</span>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
            A marketplace for goods made across India
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            LoqMart brings handmade goods and machine-made products together, with simple shopping and state-wise discovery.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20 space-y-20">
        {/* Mission */}
        <section className="text-center">
          <Target className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-on-surface mb-4">Why we built LoqMart</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-lg leading-relaxed">
            Finding the right product should feel straightforward. Browse by category or region, compare clear details, and reserve your order at checkout.
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

        <section className="bg-surface-container-lowest rounded-2xl p-8 md:p-10">
          <h2 className="text-3xl font-extrabold text-on-surface text-center mb-8">How to use LoqMart</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div><p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">01 · Discover</p><h3 className="font-bold text-on-surface mb-2">Start with what you need</h3><p className="text-sm text-on-surface-variant leading-relaxed">Browse by category, compare handmade and machine-made options, or explore by region.</p></div>
            <div><p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">02 · Learn</p><h3 className="font-bold text-on-surface mb-2">Check the product details</h3><p className="text-sm text-on-surface-variant leading-relaxed">Review product information, ratings, price, and availability before adding an item to your cart.</p></div>
            <div><p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">03 · Decide</p><h3 className="font-bold text-on-surface mb-2">Sign in when you are ready</h3><p className="text-sm text-on-surface-variant leading-relaxed">You can browse and build a cart as a guest. Sign in is required when you proceed to checkout.</p></div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="text-on-surface-variant mb-4">Ready to find something useful, thoughtful, or new?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="inline-flex items-center justify-center bg-primary-container text-on-primary-fixed font-bold px-8 py-3 rounded-lg hover:brightness-95 transition-all">
              Start Shopping
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
