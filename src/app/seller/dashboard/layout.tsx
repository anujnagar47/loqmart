import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { SellerCentralShell } from "@/components/seller/SellerCentralShell"

export const metadata: Metadata = {
  title: "Seller Central | LoqMart",
  description: "Manage your LoqMart catalog, orders, storefront and growth tools.",
  robots: { index: false, follow: false },
}

export default async function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await createClient()
  const { data: { user }, error } = await session.auth.getUser()
  if (error || !user) redirect("/seller/login")

  const db = createServiceClient()
  const { data: seller } = await db.from("sellers")
    .select("id, business_name, state_code, approval_status")
    .eq("user_id", user.id).maybeSingle()
  if (!seller) redirect("/seller/register")

  const state = seller.state_code || "India"
  return <SellerCentralShell
    businessName={seller.business_name || "Seller account"}
    state={state}
    approvalStatus={seller.approval_status || "pending"}
    storefrontPath={`/seller/${seller.id}`}
  >{children}</SellerCentralShell>
}
