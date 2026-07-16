import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your Cart | LoqMart",
  description: "Review the items in your LoqMart cart before checkout.",
  robots: { index: false, follow: true },
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
