import { Code2, Palette, Headset, TrendingUp, Mail } from "lucide-react"

export const metadata = {
  title: "Careers | LoqMart",
  description: "LoqMart is a small team building India's Swadeshi marketplace. See the areas we're hiring for and how to reach us.",
}

const areas = [
  { icon: Code2, title: "Engineering", desc: "Platform, checkout, logistics integrations and seller tooling." },
  { icon: Palette, title: "Design", desc: "Product and brand design for buyers and sellers across India." },
  { icon: Headset, title: "Seller Success", desc: "Onboarding and supporting artisans, MSMEs and manufacturers." },
  { icon: TrendingUp, title: "Growth & Operations", desc: "Category expansion, state partnerships, and logistics operations." },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-container py-16 px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] block mb-3">Join Us</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Careers at LoqMart</h1>
        <p className="text-on-surface-variant max-w-xl mx-auto">
          We&rsquo;re a small team building India&rsquo;s Swadeshi marketplace from the ground up. We&rsquo;re not currently running open postings, but we&rsquo;re always glad to hear from people who want to work on this problem.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <section>
          <h2 className="text-xl font-extrabold text-on-surface mb-5">Areas We Grow Into</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {areas.map((a) => (
              <div key={a.title} className="flex gap-4 bg-surface-container-lowest rounded-xl p-5">
                <div className="w-11 h-11 bg-primary-container rounded-xl flex items-center justify-center shrink-0">
                  <a.icon className="w-5 h-5 text-on-primary-fixed" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface mb-1">{a.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-8 text-center">
          <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-lg font-extrabold text-on-surface mb-2">Get in Touch</h2>
          <p className="text-sm text-on-surface-variant mb-1">
            Send your resume and a note about what you&rsquo;d want to work on to
          </p>
          <p className="font-bold text-on-surface">careers@loqmart.in</p>
        </section>
      </div>
    </div>
  )
}
