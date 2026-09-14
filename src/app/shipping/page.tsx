import { Truck, Package, RotateCcw, Clock, MapPin, Shield, Phone } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Shipping & Delivery Policy | LoqMart",
  description: "LoqMart shipping timelines, free shipping threshold, state coverage, and tracking details.",
}

const deliveryTiers = [
  { zone: "Metro Cities", cities: "Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata", days: "3–5 business days" },
  { zone: "Tier 1 Cities", cities: "Jaipur, Ahmedabad, Pune, Surat, Lucknow, Kanpur", days: "4–6 business days" },
  { zone: "Tier 2 & Tier 3", cities: "All other cities and towns", days: "6–10 business days" },
  { zone: "Remote Areas", cities: "Northeast, Ladakh, Andaman, remote pincodes", days: "10–15 business days" },
]

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-container py-16 px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] block mb-3">Policies</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Shipping & Delivery Policy</h1>
        <p className="text-on-surface-variant max-w-lg mx-auto">
          All products on LoqMart are shipped directly from verified Indian sellers. Timelines may vary by seller location.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Free shipping */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-on-primary-fixed" />
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface">Free Shipping</h2>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <p className="text-on-surface leading-relaxed mb-4">
              <strong>Orders above ₹999</strong> qualify for free standard shipping across India. Orders below ₹999 incur a flat ₹49 shipping fee.
            </p>
            <p className="text-sm text-on-surface-variant">
              Shipping charges are calculated per seller. If your cart contains products from multiple sellers, shipping may be charged per seller.
            </p>
          </div>
        </section>

        {/* Delivery timelines */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-on-primary-fixed" />
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface">Delivery Timelines</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="py-3 px-4 text-left font-bold text-on-surface-variant uppercase text-xs tracking-wider">Zone</th>
                  <th className="py-3 px-4 text-left font-bold text-on-surface-variant uppercase text-xs tracking-wider">Cities Covered</th>
                  <th className="py-3 px-4 text-left font-bold text-on-surface-variant uppercase text-xs tracking-wider">Est. Delivery</th>
                </tr>
              </thead>
              <tbody>
                {deliveryTiers.map((tier) => (
                  <tr key={tier.zone} className="border-b border-surface-container hover:bg-surface-container-low">
                    <td className="py-3 px-4 font-bold text-on-surface">{tier.zone}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{tier.cities}</td>
                    <td className="py-3 px-4 font-semibold text-primary">{tier.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-on-surface-variant mt-4">
            Timelines are from the date of order dispatch, not order placement. Handmade items may require 1–3 extra business days for preparation.
          </p>
        </section>

        {/* Tracking */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-on-primary-fixed" />
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface">Order Tracking</h2>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 space-y-4">
            <p className="text-on-surface">Once your order ships, you will receive:</p>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-primary-container rounded-full flex items-center justify-center text-on-primary-fixed text-xs font-bold">1</span>
                An SMS and email with your tracking number and courier partner
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-primary-container rounded-full flex items-center justify-center text-on-primary-fixed text-xs font-bold">2</span>
                A direct tracking link in your LoqMart account under &quot;My Orders&quot;
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-primary-container rounded-full flex items-center justify-center text-on-primary-fixed text-xs font-bold">3</span>
                A delivery notification with LoqCoins credit confirmation
              </li>
            </ul>
          </div>
        </section>

        {/* Policy notes */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-on-primary-fixed" />
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface">Important Notes</h2>
          </div>
          <div className="space-y-3">
            {[
              "Delivery timelines are estimates and not guaranteed. Delays due to natural events, strikes, or courier issues are not the responsibility of LoqMart.",
              "LoqMart works with reputed courier partners including Delhivery, BlueDart, and India Post for remote areas.",
              "For handmade-to-order products, seller preparation time (1–5 days) is additional to the delivery timeline.",
              "In case of non-delivery or wrong delivery, contact LoqMart support within 48 hours of the expected delivery date.",
            ].map((note, i) => (
              <p key={i} className="text-sm text-on-surface-variant bg-surface-container-lowest rounded-lg p-4">
                {note}
              </p>
            ))}
          </div>
        </section>

        <div className="text-center pt-4">
          <p className="text-on-surface-variant text-sm mb-4">Still have questions about your delivery?</p>
          <Link href="/contact" className="text-primary font-bold hover:underline">Contact Us →</Link>
        </div>
      </div>
    </div>
  )
}
