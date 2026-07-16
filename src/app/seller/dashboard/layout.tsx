import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Seller Dashboard | LoqMart",
  description: "Manage your products, orders and payouts on LoqMart.",
  robots: { index: false, follow: false },
}

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
