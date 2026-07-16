import { Mail, FileText, Building2 } from "lucide-react"

export const metadata = {
  title: "Press & Media | LoqMart",
  description: "Press contact and company information for journalists and media covering LoqMart, India's Swadeshi marketplace.",
}

const facts = [
  { label: "Company", value: "LoqMart India Pvt. Ltd." },
  { label: "Founded", value: "2024" },
  { label: "Headquarters", value: "New Delhi, India" },
  { label: "CIN", value: "U74999DL2024PTC123456" },
  { label: "Sector", value: "Multi-vendor e-commerce marketplace" },
  { label: "Focus", value: "Handmade and machine-made Indian-manufactured goods" },
]

export default function PressPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-container py-16 px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] block mb-3">Media</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Press & Media</h1>
        <p className="text-on-surface-variant max-w-xl mx-auto">
          Resources and contact details for journalists and media covering LoqMart.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <section className="bg-surface-container-lowest rounded-xl p-8">
          <div className="flex items-center gap-3 mb-5">
            <Building2 className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-extrabold text-on-surface">Company Facts</h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-xs font-black uppercase tracking-wider text-on-surface-variant mb-1">{f.label}</dt>
                <dd className="text-sm font-semibold text-on-surface">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-8">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-extrabold text-on-surface">Boilerplate</h2>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            LoqMart is an Indian multi-vendor marketplace connecting GST-verified artisans, MSMEs and manufacturers directly to buyers across India. Every product is tagged to its state of origin, and sellers are ranked using a Swadeshi Rank that reflects verification, service quality and years in business.
          </p>
        </section>

        <section className="text-center">
          <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-lg font-extrabold text-on-surface mb-2">Press Inquiries</h2>
          <p className="font-bold text-on-surface">press@loqmart.in</p>
        </section>
      </div>
    </div>
  )
}
