import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In | LoqMart",
  description: "Sign in or create an account to shop, sell, and track orders on LoqMart.",
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
