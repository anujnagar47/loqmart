import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Arrivals | LoqMart",
  description: "The latest handmade and machine-made products added by verified sellers on LoqMart.",
}

export default function NewLayout({ children }: { children: React.ReactNode }) {
  return children
}
