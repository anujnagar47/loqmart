import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/admin"
import { StatePageClient, STATE_NAMES } from "./StatePageClient"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function generateMetadata({ params }: { params: Promise<{ stateId: string }> }): Promise<Metadata> {
  const { stateId } = await params
  const stateCode = stateId.toUpperCase()
  const stateName = STATE_NAMES[stateCode] || stateId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  const supabase = createServiceClient()
  const { count } = await supabase
    .from("sellers")
    .select("id", { count: "exact", head: true })
    .eq("state_code", stateCode)
    .eq("approval_status", "approved")

  const description = count
    ? `Shop authentic ${stateName} crafts and products from ${count} verified sellers on LoqMart.`
    : `Discover authentic products and artisans from ${stateName} on LoqMart.`

  return {
    title: `${stateName} — Shop by State — LoqMart`,
    description,
    openGraph: { title: `${stateName} on LoqMart`, description, type: "website" },
  }
}

export default async function StatePage({ params }: { params: Promise<{ stateId: string }> }) {
  const { stateId } = await params
  const stateCode = stateId.toUpperCase()
  const stateName = STATE_NAMES[stateCode] || stateId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Shop by State", item: `${BASE_URL}/india-map` },
      { "@type": "ListItem", position: 3, name: stateName, item: `${BASE_URL}/state/${stateId}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StatePageClient />
    </>
  )
}
