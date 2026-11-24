import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminTopbar } from "@/components/admin/AdminTopbar"

export const metadata = { title: "Admin – LoqMart" }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  // Use getUser() (server-validated JWT) — getSession() reads client cookies and can be spoofed
  const { data: { user: authUser }, error } = await supabase.auth.getUser()
  if (error || !authUser) redirect("/login")

  const db = createServiceClient()
  const { data: user } = await db
    .from("users").select("role, full_name, email, state_scope").eq("id", authUser.id).single()
  if (user?.role === "seller") redirect("/seller/dashboard")
  if (user?.role !== "admin" && user?.role !== "sub_admin") redirect("/seller/register")

  return (
    <div className="fixed inset-0 flex z-50 bg-[#F8F8F8]">
      <AdminSidebar
        adminName={user?.full_name || "Admin"}
        adminEmail={user?.email || ""}
        stateScope={user?.state_scope || null}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden ag-scroll">
        <AdminTopbar />
        {children}
      </main>
    </div>
  )
}
