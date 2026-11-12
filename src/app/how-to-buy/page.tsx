import Link from "next/link"
import { Search, MessageSquareText, MapPin, Mail, PackageCheck } from "lucide-react"

export const metadata = {
  title: "How Inquiries Work | LoqMart",
  description: "Browse regional crafts, save pieces to your inquiry list, and ask our team to confirm availability.",
}

const steps = [
  { icon: Search, title: "1. Explore the collection", desc: "Browse products by craft, category, or seller location. You can explore without signing in." },
  { icon: MessageSquareText, title: "2. Save pieces to your inquiry list", desc: "Choose Add to Inquiry on any piece. Your list stays saved on this device while you browse." },
  { icon: MapPin, title: "3. Tell us where to reach you", desc: "Share your name, email, phone or WhatsApp number, and city or state so we can check availability with the seller." },
  { icon: Mail, title: "4. Our curation team follows up", desc: "We will review the selected pieces and contact you with availability and product details. No payment is taken through an inquiry." },
  { icon: PackageCheck, title: "5. Decide what comes next", desc: "Once we confirm details, you can decide whether you would like to continue with the seller." },
]

export default function HowToBuyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#f3f3f3] px-6 py-16 text-center">
        <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-[#725c00]">Buyer guide</span>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-[#1a1c1c] sm:text-4xl">How inquiries work</h1>
        <p className="mx-auto max-w-xl text-[#4d4632]">Browse freely, save what catches your eye, and ask us to check availability.</p>
      </div>
      <div className="mx-auto max-w-4xl space-y-5 px-6 py-12">
        {steps.map(step => <section key={step.title} className="flex gap-5 rounded-md border border-[#E5E7EB] bg-white p-5 sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#fcd020]"><step.icon className="h-5 w-5 text-[#231b00]" /></div>
          <div><h2 className="mb-1 font-semibold text-[#1a1c1c]">{step.title}</h2><p className="text-sm leading-6 text-[#4d4632]">{step.desc}</p></div>
        </section>)}
        <div className="pt-5 text-center"><Link href="/category" className="inline-flex items-center justify-center rounded-md bg-[#fcd020] px-7 py-3 font-semibold text-[#231b00] hover:bg-[#eab308]">Explore collections</Link></div>
      </div>
    </div>
  )
}
