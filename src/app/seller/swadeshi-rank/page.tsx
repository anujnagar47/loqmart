import type { Metadata } from "next"
import Link from "next/link"
import { Award, Star, Truck, RotateCcw, Calendar, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Swadeshi Rank | LoqMart Sellers",
  description: "How LoqMart's Swadeshi Rank score is calculated - the factors that determine seller ranking and buyer visibility.",
}

const factors = [
  { icon: ShieldCheck, title: "Base Score", points: "50 pts", desc: "Every approved seller starts with a base score of 50 out of 100." },
  { icon: Star, title: "Customer Rating", points: "Up to 20 pts", desc: "Your average product rating across all delivered orders, weighted most heavily in the score." },
  { icon: Truck, title: "On-Time Delivery", points: "Up to 10 pts", desc: "The percentage of orders shipped and delivered within 3 days of the shipped date." },
  { icon: RotateCcw, title: "Low Return/Cancellation Rate", points: "Up to 10 pts", desc: "Fewer cancelled orders relative to total orders improves this component." },
  { icon: Calendar, title: "Years in Business", points: "Up to 10 pts", desc: "1 point for every year registered on LoqMart, capped at 10." },
  { icon: Award, title: "Verification & Compliance", points: "Up to 10 pts", desc: "GSTIN, PAN, bank account verification and approval status each contribute points." },
]

export default function SwadeshiRankPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-container py-16 px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] block mb-3">For Sellers</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Swadeshi Rank</h1>
        <p className="text-on-surface-variant max-w-xl mx-auto">
          A 0-100 score shown on every seller profile, used to surface trustworthy sellers to buyers.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <section className="bg-surface-container-lowest rounded-xl p-6 text-center">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Your Swadeshi Rank is recalculated automatically as your ratings, delivery performance and verification status change. It&rsquo;s visible to buyers on your storefront and product listings, and higher-ranked sellers are favoured in seller spotlights and search ranking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-on-surface mb-5">How the Score Is Built</h2>
          <div className="space-y-4">
            {factors.map((f) => (
              <div key={f.title} className="flex gap-4 bg-surface-container-lowest rounded-xl p-5">
                <div className="w-11 h-11 bg-primary-container rounded-xl flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-on-primary-fixed" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-on-surface">{f.title}</h3>
                    <span className="text-xs font-black text-primary">{f.points}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-6">
          <h2 className="font-extrabold text-on-surface mb-2">Improving Your Rank</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Ship orders promptly, keep return rates low, respond to buyer messages, and complete your GSTIN, PAN and bank verification in the Seller Dashboard. Your current score and its breakdown are shown on your Seller Dashboard overview.
          </p>
        </section>

        <div className="text-center pt-2">
          <Link href="/seller/dashboard" className="inline-flex items-center justify-center bg-primary-container text-on-primary-fixed font-bold px-8 py-3 rounded-lg hover:brightness-95 transition-all">
            View My Score
          </Link>
        </div>
      </div>
    </div>
  )
}
