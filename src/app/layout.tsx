import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ConditionalLayout } from "@/components/ConditionalLayout"
import { LanguageProvider } from "@/lib/i18n/LanguageContext"

export const metadata: Metadata = {
  title: "LoqMart | Indian Crafts, Handlooms & Regional Goods",
  description: "Browse handmade and machine-made products from sellers across India. Compare product details, explore by category or seller location, and shop as a guest.",
  keywords: ["marketplace", "handmade", "Indian products", "machine-made", "online shopping"],
  openGraph: {
    title: "LoqMart | Indian Crafts, Handlooms & Regional Goods",
    description: "Browse products from sellers across India, compare details, and shop as a guest.",
    type: "website",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "LoqMart" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FACC15",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col antialiased">
        <LanguageProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </LanguageProvider>
      </body>
    </html>
  )
}
