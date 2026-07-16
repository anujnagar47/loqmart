import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us | LoqMart",
  description: "Reach LoqMart support by email, phone, or WhatsApp for buyer and seller queries.",
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
