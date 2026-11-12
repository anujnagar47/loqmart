import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Checkout | LoqMart",
  description: "Complete your purchase on LoqMart.",
  robots: { index: false, follow: false },
}

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "admin" && profile?.role !== "sub_admin") redirect("/priority-invite")
  return children
}
