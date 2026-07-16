import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ConditionalLayout } from "@/components/ConditionalLayout"

export const metadata: Metadata = {
  title: "LoqMart | India's Multi-Vendor Marketplace",
  description: "Discover authentic Handmade treasures and quality Machine-Made products from verified sellers across 29 states in India.",
  keywords: ["marketplace", "handmade", "artisan", "Indian crafts", "e-commerce", "multi-vendor"],
  openGraph: {
    title: "LoqMart | India's Multi-Vendor Marketplace",
    description: "Discover authentic Handmade treasures and quality Machine-Made products",
    type: "website",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "LoqMart" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fcd020",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  )
}
