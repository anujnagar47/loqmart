import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export const metadata = { title: "Admin – LoqMart" }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  // Use getUser() (server-validated JWT) — getSession() reads client cookies and can be spoofed
  const { data: { user: authUser }, error } = await supabase.auth.getUser()
  if (error || !authUser) redirect("/auth")

  const db = createServiceClient()
  const { data: user } = await db
    .from("users").select("role, full_name, email, state_scope").eq("id", authUser.id).single()
  if (user?.role !== "admin" && user?.role !== "sub_admin") redirect("/")

  return (
    <div className="fixed inset-0 flex z-50" style={{
      background: "#eeece8",
      backgroundImage: `
        radial-gradient(ellipse at 75% 10%, rgba(252,208,32,0.055) 0%, transparent 45%),
        radial-gradient(ellipse at 15% 85%, rgba(252,208,32,0.04) 0%, transparent 40%),
        radial-gradient(1.2px 1.2px at 1.2px 1.2px, rgba(26,28,28,0.055) 0%, transparent 0)
      `,
      backgroundSize: "auto, auto, 22px 22px",
    }}>
      <AdminSidebar
        adminName={user?.full_name || "Admin"}
        adminEmail={user?.email || ""}
        stateScope={user?.state_scope || null}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden ag-scroll">
        {children}
      </main>
    </div>
  )
}
