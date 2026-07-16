export const metadata = {
  title: "Terms of Service | LoqMart",
  description: "LoqMart Terms of Service - rules governing use of the platform for buyers and sellers.",
}

const sections = [
  {
    id: "1",
    title: "1. Acceptance of Terms",
    content: `By accessing or using LoqMart (the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Platform. These Terms constitute a legally binding agreement between you and LoqMart India Pvt. Ltd. ("LoqMart", "Company").`,
  },
  {
    id: "2",
    title: "2. Eligibility",
    content: `You must be at least 18 years old and a resident of India to use LoqMart. By creating an account, you represent and warrant that you meet these requirements. Sellers must additionally hold valid GST registration or MSME registration where applicable.`,
  },
  {
    id: "3",
    title: "3. Buyer Terms",
    content: `As a buyer, you agree to: (a) provide accurate delivery information; (b) pay for products ordered in full before dispatch; (c) not misuse the return and refund policy; (d) not purchase prohibited or restricted items; (e) treat seller communications respectfully. LoqMart acts as a marketplace platform and is not the seller of any product.`,
  },
  {
    id: "4",
    title: "4. Seller Terms",
    content: `Sellers must: (a) list only products manufactured or sourced in India; (b) maintain accurate inventory and pricing; (c) dispatch orders within the stated timeframe; (d) hold valid GST registration for taxable supplies; (e) comply with all applicable Indian laws including Consumer Protection Act 2019, Legal Metrology Act, and applicable sector regulations; (f) not list counterfeit, adulterated, or prohibited products.`,
  },
  {
    id: "5",
    title: "5. Swadeshi Origin Policy",
    content: `LoqMart exclusively lists products manufactured in India. "Made in India" means the product must have been substantially manufactured or transformed within India. Imported goods, grey market imports, or products assembled from entirely foreign components are not eligible. LoqMart reserves the right to remove listings or suspend sellers that violate this policy.`,
  },
  {
    id: "6",
    title: "6. Intellectual Property",
    content: `All content on LoqMart, including logos, designs, text, and code, is the property of LoqMart India Pvt. Ltd. or its licensors. Sellers retain ownership of product images and descriptions they upload but grant LoqMart a royalty-free licence to display them on the Platform.`,
  },
  {
    id: "7",
    title: "7. Commission & Payments",
    content: `LoqMart charges a platform commission on each transaction as detailed in the Seller Commission Schedule available in the Seller Dashboard. Payments to sellers are processed via NEFT/IMPS on a T+7 settlement cycle after order delivery confirmation. LoqMart uses Razorpay as its payment gateway.`,
  },
  {
    id: "8",
    title: "8. Limitation of Liability",
    content: `LoqMart is a marketplace facilitator and is not liable for: (a) the quality of products listed by sellers; (b) delays caused by courier partners; (c) loss of data; (d) indirect or consequential damages. LoqMart's maximum liability to any buyer or seller is limited to the value of the relevant transaction.`,
  },
  {
    id: "9",
    title: "9. Governing Law & Disputes",
    content: `These Terms are governed by the laws of India. All disputes shall be subject to the exclusive jurisdiction of courts in New Delhi. We encourage resolution through our Grievance Redressal mechanism before legal proceedings.`,
  },
  {
    id: "10",
    title: "10. Amendments",
    content: `LoqMart reserves the right to update these Terms at any time. Changes will be communicated via email or in-app notification. Continued use of the Platform after 15 days of such notification constitutes acceptance of the updated Terms.`,
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-container py-16 px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] block mb-3">Legal</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Terms of Service</h1>
        <p className="text-on-surface-variant">Last updated: June 2024 · Governed by Indian law</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <p className="text-sm text-on-surface-variant bg-surface-container-lowest rounded-xl p-6 leading-relaxed">
          These Terms of Service govern your use of the LoqMart platform. Please read them carefully. For questions, contact legal@loqmart.in.
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
          <p>LoqMart India Pvt. Ltd. · CIN: U74999DL2024PTC123456 · New Delhi, India</p>
          <p className="mt-2">For legal queries: <strong className="text-on-surface">legal@loqmart.in</strong></p>
        </div>
      </div>
    </div>
  )
}
