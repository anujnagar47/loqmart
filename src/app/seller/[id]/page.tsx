import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/admin"
import { PublicSellerStoreClient } from "./PublicSellerStoreClient"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = createServiceClient()
  const { data: seller } = await supabase
    .from("sellers")
    .select("business_name, description, logo_url, city, state")
    .eq("id", id)
    .eq("approval_status", "approved")
    .maybeSingle()

  if (!seller) return { title: "Seller — LoqMart" }

  const description = seller.description
    || `Shop from ${seller.business_name}${seller.city ? `, based in ${seller.city}` : ""} — a verified seller on LoqMart.`

  return {
    title: `${seller.business_name} — LoqMart Seller`,
    description,
    openGraph: {
      title: seller.business_name,
      description,
      images: seller.logo_url ? [seller.logo_url] : undefined,
      type: "website",
    },
  }
}

export default function PublicSellerStorePage() {
  return <PublicSellerStoreClient />
}
