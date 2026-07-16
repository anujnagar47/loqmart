import type { Metadata } from "next"
import Link from "next/link"
import { Percent, CreditCard, Calendar, Info } from "lucide-react"
import { createServiceClient } from "@/lib/supabase/admin"

export const metadata: Metadata = {
  title: "Commission Structure | LoqMart Sellers",
  description: "How LoqMart's seller commission and payment gateway fees are calculated, including current global and category rates.",
}

// Re-fetch periodically in case admin updates commission rates.
export const revalidate = 3600

interface CommissionSetting {
  id: string
  scope: string
  rate: number
  gateway_rate: number
  categories?: { name: string } | null
}

async function fetchCommissionSettings(): Promise<CommissionSetting[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("commission_settings")
      .select("id, scope, rate, gateway_rate, categories(name)")
      .is("seller_id", null)
      .order("scope")
    if (error) { console.error("Commission fetch error:", error); return [] }
    return (data as unknown as CommissionSetting[]) || []
  } catch (err) {
    console.error("Commission fetch failed:", err)
    return []
  }
}

export default async function SellerCommissionPage() {
  const settings = await fetchCommissionSettings()
  const global = settings.find(s => s.scope === "global") || { rate: 5, gateway_rate: 2 }
  const categoryOverrides = settings.filter(s => s.scope === "category" && s.categories?.name)

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-container py-16 px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] block mb-3">For Sellers</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Commission Structure</h1>
        <p className="text-on-surface-variant max-w-xl mx-auto">
          A transparent breakdown of what LoqMart deducts from each sale, and when you get paid.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <Percent className="w-8 h-8 text-primary mb-3" />
            <p className="text-3xl font-black text-on-surface mb-1">{Number(global.rate).toFixed(2)}%</p>
            <p className="text-sm text-on-surface-variant">Platform commission (default rate, per order)</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <CreditCard className="w-8 h-8 text-primary mb-3" />
            <p className="text-3xl font-black text-on-surface mb-1">{Number(global.gateway_rate).toFixed(2)}%</p>
            <p className="text-sm text-on-surface-variant">Payment gateway processing fee (Razorpay)</p>
          </div>
        </section>

        {categoryOverrides.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-on-surface mb-4">Category-Specific Rates</h2>
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
              {categoryOverrides.map((c) => (
                <div key={c.id} className="flex justify-between items-center px-6 py-3 border-b border-surface-container last:border-0">
                  <span className="text-sm font-semibold text-on-surface">{c.categories?.name}</span>
                  <span className="text-sm font-black text-primary">{Number(c.rate).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-extrabold text-on-surface mb-4">How It Works</h2>
          <div className="space-y-4">
            {[
              "The commission is calculated on the item price at the time of order, not including shipping.",
              "Handmade categories are generally kept at the lowest rate to protect artisan margins; sellers can request a category-specific rate review from the Seller Dashboard.",
              "Individual sellers may occasionally be assigned a custom rate that overrides the global or category rate, shown directly in their Seller Dashboard.",
              "LoqCoins and promo code discounts are absorbed by LoqMart, not deducted from the seller payout.",
            ].map((line, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-on-surface-variant leading-relaxed">{line}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-6 flex gap-4 items-start">
          <Calendar className="w-6 h-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="font-extrabold text-on-surface mb-1">Settlement Cycle</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Payouts are processed via NEFT/IMPS on a T+7 settlement cycle after order delivery confirmation, net of commission and gateway fees. See your Seller Dashboard for settlement history.
            </p>
          </div>
        </section>

        <div className="text-center pt-4">
          <Link href="/seller/dashboard" className="inline-flex items-center justify-center bg-primary-container text-on-primary-fixed font-bold px-8 py-3 rounded-lg hover:brightness-95 transition-all">
            Go to Seller Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
