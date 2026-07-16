import Link from "next/link"
import { Search, ShoppingCart, MapPin, CreditCard, PackageCheck, Coins } from "lucide-react"

export const metadata = {
  title: "How to Buy | LoqMart",
  description: "A step-by-step guide to finding, buying and tracking products on LoqMart, India's Swadeshi marketplace.",
}

const steps = [
  {
    icon: Search,
    title: "1. Find a Product",
    desc: "Browse Handmade or Machine-Made collections, filter by state or price, or search directly. Every listing shows the seller's state of origin and Swadeshi Rank.",
  },
  {
    icon: ShoppingCart,
    title: "2. Add to Cart",
    desc: "Add items from one or more sellers to your cart. You can adjust quantities and review pricing before checkout.",
  },
  {
    icon: MapPin,
    title: "3. Add a Delivery Address",
    desc: "Save a delivery address from your Account page, or add one during checkout. You can store multiple addresses and set a default.",
  },
  {
    icon: CreditCard,
    title: "4. Pay Securely",
    desc: "Checkout is powered by Razorpay, supporting UPI, cards, netbanking, IMPS and NEFT. You can also redeem LoqCoins or a promo code at checkout.",
  },
  {
    icon: PackageCheck,
    title: "5. Track Your Order",
    desc: "Track order status - confirmed, processing, shipped, delivered - from the Orders tab in your Account page.",
  },
  {
    icon: Coins,
    title: "6. Earn LoqCoins",
    desc: "Earn LoqCoins on eligible purchases and redeem them against future orders. See the LoqCoins Program page for details.",
  },
]

export default function HowToBuyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-container py-16 px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] block mb-3">Buyer Guide</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">How to Buy on LoqMart</h1>
        <p className="text-on-surface-variant max-w-xl mx-auto">
          Six steps from discovery to delivery.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-6">
        {steps.map((s) => (
          <div key={s.title} className="flex gap-5 bg-surface-container-lowest rounded-xl p-6">
            <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center shrink-0">
              <s.icon className="w-6 h-6 text-on-primary-fixed" />
            </div>
            <div>
              <h2 className="font-extrabold text-on-surface mb-1">{s.title}</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}

        <div className="text-center pt-6">
          <Link href="/category" className="inline-flex items-center justify-center bg-primary-container text-on-primary-fixed font-bold px-8 py-3 rounded-lg hover:brightness-95 transition-all">
            Start Browsing
          </Link>
        </div>
      </div>
    </div>
  )
}
