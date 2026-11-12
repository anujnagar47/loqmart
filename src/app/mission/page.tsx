import Link from "next/link"
import { Target, MapPin, Users, Landmark, Sprout, HeartHandshake } from "lucide-react"

export const metadata = {
  title: "Why LoqMart | A marketplace for Indian sellers",
  description: "See how LoqMart helps shoppers discover products, learn about sellers, and browse by location.",
}

const pillars = [
  {
    icon: MapPin,
    title: "Discover by location",
    desc: "Browse sellers and products by state, then check each listing for its product and seller details.",
  },
  {
    icon: Users,
    title: "A shopfront for independent sellers",
    desc: "Artisans, small businesses, and manufacturers can present their products to shoppers looking for goods from across India.",
  },
  {
    icon: Landmark,
    title: "Useful details before checkout",
    desc: "Product listings show key information such as price, ratings, availability, and seller details so shoppers can make an informed choice.",
  },
  {
    icon: Sprout,
    title: "Two ways to shop",
    desc: "Explore handmade goods or machine-made products, with category and location filters to narrow your search.",
  },
]

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="relative py-24 px-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #111827 0%, #3d2f00 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <Target className="w-10 h-10 text-[#FACC15] mx-auto mb-5" />
          <span className="text-[#FACC15]/70 text-xs font-bold uppercase tracking-[0.3em] block mb-4">Our Mission</span>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            More ways to discover products from India
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            We bring shoppers and sellers together around products made and sold across India. Our focus is simple: clear product information, useful discovery, and a straightforward path from browsing to checkout.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20 space-y-20">
        <section className="text-center">
          <h2 className="text-3xl font-extrabold text-on-surface mb-4">A clearer way to explore</h2>
          <p className="text-on-surface-variant max-w-3xl mx-auto text-lg leading-relaxed">
            Shopping is easier when the details are close at hand. LoqMart lets you browse products, compare options, and open seller profiles to learn more about the shop behind a listing. You can explore freely, add items to your cart, and sign in only when you are ready to check out.
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
          <h2 className="text-3xl font-extrabold text-on-surface mb-4">A marketplace that keeps improving</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            We are building the tools that make discovery, seller information, and order management easier for both sides of the marketplace.
          </p>
        </section>

        <section className="text-center">
          <p className="text-on-surface-variant mb-4">Browse the marketplace or set up a seller account</p>
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
