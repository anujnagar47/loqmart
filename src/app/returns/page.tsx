import Link from "next/link"
import { RotateCcw, AlertCircle, CheckCircle, XCircle } from "lucide-react"

export const metadata = {
  title: "Return & Refund Policy | LoqMart",
  description: "LoqMart 7-day return policy, refund timelines, and non-returnable items.",
}

const returnable = [
  "Wrong item delivered",
  "Damaged or defective product",
  "Item not as described",
  "Missing parts or accessories",
  "Quality issue verified by LoqMart",
]

const notReturnable = [
  "Used, washed, or worn items",
  "Custom/personalized handmade orders",
  "Food, consumables, and perishables",
  "Inner garments and underclothing",
  "Fragile items damaged due to improper use",
  "Items without original packaging",
]

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-container py-16 px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] block mb-3">Policies</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Return & Refund Policy</h1>
        <p className="text-on-surface-variant max-w-lg mx-auto">
          We want you to love what you bought. If something&apos;s wrong, we&apos;re here to fix it.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Return window */}
        <section>
          <div className="bg-primary-container rounded-xl p-6 text-on-primary-fixed">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <RotateCcw className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold mb-1">7-Day Return Window</h2>
                <p className="text-on-primary-fixed/80">
                  Raise a return request within 7 days of delivery. No questions asked for damaged/wrong items.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How to return */}
        <section>
          <h2 className="text-2xl font-extrabold text-on-surface mb-4">How to Initiate a Return</h2>
          <div className="space-y-3">
            {[
              "Go to My Account → My Orders → Select Order",
              "Click \"Return/Refund\" on the eligible item",
              "Select reason and upload photos of the issue",
              "Our team reviews within 24 hours",
              "If approved, courier picks up within 2–3 days",
              "Refund issued within 5–7 business days after pickup",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-surface-container-lowest rounded-lg p-4">
                <span className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center text-on-primary-fixed text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-on-surface">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Returnable vs not */}
        <section>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-extrabold text-on-surface text-lg">Eligible for Return</h3>
              </div>
              <div className="space-y-2">
                {returnable.map((item) => (
                  <div key={item} className="flex items-center gap-2 bg-green-50 rounded-lg px-4 py-2">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <p className="text-sm text-green-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-extrabold text-on-surface text-lg">Not Eligible for Return</h3>
              </div>
              <div className="space-y-2">
                {notReturnable.map((item) => (
                  <div key={item} className="flex items-center gap-2 bg-red-50 rounded-lg px-4 py-2">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Refund timelines */}
        <section>
          <h2 className="text-2xl font-extrabold text-on-surface mb-4">Refund Timelines</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">Payment Mode</th>
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">Refund Method</th>
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { mode: "UPI / Net Banking", method: "Original source", timeline: "3–5 business days" },
                  { mode: "Credit / Debit Card", method: "Original card", timeline: "5–7 business days" },
                  { mode: "LoqCoins (partial)", method: "LoqCoin wallet", timeline: "Instant after approval" },
                ].map((row) => (
                  <tr key={row.mode} className="border-b border-surface-container hover:bg-surface-container-low">
                    <td className="py-3 px-4 font-medium text-on-surface">{row.mode}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{row.method}</td>
                    <td className="py-3 px-4 font-semibold text-green-700">{row.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            LoqMart acts as a marketplace platform. For handmade products, seller-specific return conditions may apply. Always check the product listing for any special return terms.
          </p>
        </div>

        <div className="text-center">
          <Link href="/contact" className="text-primary font-bold hover:underline">Need help with a return? Contact Us →</Link>
        </div>
      </div>
    </div>
  )
}
