import Link from "next/link"
import { Check } from "lucide-react"

export default function SellerApplicationSubmittedPage() {
  return <main className="flex min-h-[70vh] items-center justify-center bg-white px-4 py-16 text-[#111827]">
    <section className="w-full max-w-xl border border-[#E5E7EB] bg-white p-8 shadow-sm sm:p-10">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-md bg-[#fcd020]"><Check size={21} /></div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#725c00]">Application received</p>
      <h1 className="text-3xl font-bold tracking-tight">Your seller dossier is with our team</h1>
      <p className="mt-4 text-sm leading-6 text-[#4d4632]">Your seller dossier has been received. Our verification desk will review your credentials and craft provenance before public launch.</p>
      <p className="mt-5 inline-flex border border-[#d0c6ac] bg-[#f3f3f3] px-3 py-1.5 text-xs font-semibold text-[#4d4632]">Status: Pending review</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/seller/dashboard" className="inline-flex h-11 items-center justify-center rounded-md bg-[#fcd020] px-4 text-sm font-semibold text-[#231b00] hover:bg-[#eab308]">Go to seller area</Link>
        <Link href="/" className="inline-flex h-11 items-center justify-center rounded-md border border-[#d0c6ac] px-4 text-sm font-semibold">Return to LoqMart</Link>
      </div>
    </section>
  </main>
}
