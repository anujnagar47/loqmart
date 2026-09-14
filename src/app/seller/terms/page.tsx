import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Seller Agreement | LoqMart",
  description: "LoqMart Seller Agreement - the terms governing sellers listing and fulfilling orders on the LoqMart marketplace.",
}

const sections = [
  {
    id: "1",
    title: "1. Eligibility & Registration",
    content: `To sell on LoqMart you must register a business or individual/artisan account, provide a valid PAN, and where applicable a valid GSTIN. Accounts are subject to review and approval before listing privileges are granted.`,
  },
  {
    id: "2",
    title: "2. Swadeshi Origin Requirement",
    content: `Every product you list must be manufactured or substantially transformed within India. LoqMart may request supporting documentation and will remove listings or suspend accounts that misrepresent origin.`,
  },
  {
    id: "3",
    title: "3. Listings & Inventory",
    content: `You are responsible for accurate product titles, descriptions, images, pricing and stock levels. Inventory must be kept current; repeated out-of-stock cancellations may affect your Swadeshi Rank and account standing.`,
  },
  {
    id: "4",
    title: "4. Order Fulfilment",
    content: `Orders must be dispatched within the timeframe shown in your Seller Dashboard. Delayed or cancelled shipments impact your on-time delivery score, which is a component of your Swadeshi Rank.`,
  },
  {
    id: "5",
    title: "5. Commission & Payouts",
    content: `LoqMart deducts a platform commission and payment gateway fee from each order as set out on the Commission Structure page. Net proceeds are paid out via NEFT/IMPS on a T+7 settlement cycle after delivery confirmation.`,
  },
  {
    id: "6",
    title: "6. Returns, Refunds & Cancellations",
    content: `You must honour LoqMart's published Return & Refund Policy for buyers. Excessive cancellations or return rates may result in reduced visibility or account review.`,
  },
  {
    id: "7",
    title: "7. Prohibited Items",
    content: `You may not list counterfeit goods, items infringing third-party intellectual property, prohibited or restricted goods under Indian law, or products that are not genuinely manufactured in India.`,
  },
  {
    id: "8",
    title: "8. Account Suspension",
    content: `LoqMart may suspend or terminate a seller account for policy violations, sustained poor performance, fraudulent activity, or failure to maintain required verification documents.`,
  },
  {
    id: "9",
    title: "9. Relationship to General Terms",
    content: `This Seller Agreement supplements LoqMart's general Terms of Service. In case of conflict specific to seller obligations, this Agreement governs.`,
  },
]

export default function SellerTermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-container py-16 px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] block mb-3">Legal · For Sellers</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Seller Agreement</h1>
        <p className="text-on-surface-variant">Last updated: June 2024 · Governed by Indian law</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <p className="text-sm text-on-surface-variant bg-surface-container-lowest rounded-xl p-6 leading-relaxed">
          This Seller Agreement governs your participation as a seller on LoqMart. By submitting a seller registration, you agree to these terms in addition to LoqMart&rsquo;s general Terms of Service.
        </p>

        {sections.map((section) => (
          <section key={section.id} id={`section-${section.id}`}>
            <h2 className="text-xl font-extrabold text-on-surface mb-3">{section.title}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-container-lowest rounded-xl p-5">
              {section.content}
            </p>
          </section>
        ))}

        <div className="border-t border-surface-container pt-8 text-center text-sm text-on-surface-variant">
          <p>LoqMart · New Delhi, India</p>
          <p className="mt-2">For seller queries: <strong className="text-on-surface">sellers@loqmart.in</strong></p>
        </div>
      </div>
    </div>
  )
}
