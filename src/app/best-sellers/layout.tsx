import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Best Sellers | LoqMart",
  description: "The most popular handmade and machine-made products on LoqMart, ranked by sales and ratings.",
}

export default function BestSellersLayout({ children }: { children: React.ReactNode }) {
  return children
}
