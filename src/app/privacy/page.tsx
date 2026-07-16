export const metadata = {
  title: "Privacy Policy | LoqMart",
  description: "LoqMart's Privacy Policy - how we collect, use and protect your data.",
}

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      content: [
        "Account information: name, mobile number, email address when you register or log in via OTP.",
        "Order information: delivery address, payment method (we store only transaction references, not card numbers), order history.",
        "Usage data: pages visited, searches, products viewed, device type, browser, IP address.",
        "Seller information: GST number, PAN, bank account IFSC and number (encrypted at rest), business address.",
        "Reviews and content you submit on the platform.",
      ],
    },
    {
      title: "How We Use Your Information",
      content: [
        "To process and deliver your orders and communicate order status.",
        "To personalise your shopping experience with state-relevant recommendations.",
        "To send you order updates, LoqCoin credits, and platform notifications via SMS and email.",
        "To verify seller identity, compliance, and prevent fraud.",
        "To improve our platform, resolve disputes, and enforce our seller and buyer agreements.",
        "For analytics to understand platform performance and user behaviour (in anonymised form).",
      ],
    },
    {
      title: "Data Sharing",
      content: [
        "We do NOT sell your personal data to third parties.",
        "We share order details with the relevant seller only to fulfil your order.",
        "We share limited data with courier partners (name, address, phone) solely for delivery.",
        "We share financial data with Razorpay strictly for payment processing and refunds.",
        "We may share data with law enforcement if required by Indian law (IT Act, DPDP Act 2023).",
      ],
    },
    {
      title: "Your Rights (Under DPDP Act 2023)",
      content: [
        "Right to access your personal data held by us.",
        "Right to correction of inaccurate data.",
        "Right to erasure of your data (subject to legal retention obligations).",
        "Right to grievance redressal - contact our Data Protection Officer at privacy@loqmart.in.",
        "Right to withdraw consent for marketing communications at any time.",
      ],
    },
    {
      title: "Data Security",
      content: [
        "All data is stored on Supabase-managed servers in India, compliant with Indian data localisation requirements.",
        "Sensitive financial data (bank account numbers, PAN) is encrypted at rest using AES-256.",
        "All platform traffic is encrypted via HTTPS/TLS.",
        "OTP-based login eliminates password storage risks.",
        "We conduct quarterly security audits and penetration testing.",
      ],
    },
    {
      title: "Cookies",
      content: [
        "We use functional cookies to maintain your login session.",
        "We use analytics cookies (Posthog/Plausible) to understand platform usage - no cross-site tracking.",
        "You may disable cookies via your browser settings, though this may affect platform functionality.",
        "We do not use advertising cookies or sell cookie data to ad networks.",
      ],
    },
    {
      title: "Data Retention",
      content: [
        "Account data is retained for the lifetime of your account plus 7 years for legal compliance.",
        "Order data is retained for 8 years as required by Indian tax law (GST records).",
        "You may request deletion of personal data; we will honour within 30 days where legally permissible.",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-container py-16 px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] block mb-3">Legal</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Privacy Policy</h1>
        <p className="text-on-surface-variant">Last updated: June 2024 · Governed by Indian law (IT Act 2000, DPDP Act 2023)</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <p className="text-on-surface-variant leading-relaxed bg-surface-container-lowest rounded-xl p-6">
          LoqMart India Pvt. Ltd. ("LoqMart", "we", "us") is committed to protecting your privacy. This policy explains how we collect, use, share and protect personal information when you use the LoqMart platform (website and mobile applications).
        </p>

        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-extrabold text-on-surface mb-4">{section.title}</h2>
            <ul className="space-y-3">
              {section.content.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                  <span className="w-5 h-5 bg-primary-container rounded-full flex items-center justify-center text-on-primary-fixed text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="bg-amber-50 rounded-xl p-6">
          <h2 className="text-lg font-extrabold text-amber-900 mb-2">Contact Our Data Protection Officer</h2>
          <p className="text-sm text-amber-800">
            For any privacy concerns, data access requests, or grievances:<br />
            <strong>Email:</strong> privacy@loqmart.in<br />
            <strong>Address:</strong> LoqMart India Pvt. Ltd., New Delhi – 110001<br />
            We aim to respond within <strong>30 business days</strong>.
          </p>
        </section>
      </div>
    </div>
  )
}
