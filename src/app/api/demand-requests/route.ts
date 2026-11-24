import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { INDIA_STATE_DATA } from "@/lib/indiaStateData"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function categoryFor(query: string) {
  const text = query.toLowerCase()
  if (/saree|sari|handloom|silk|weave|textile/.test(text)) return "Sarees & Handlooms"
  if (/wood|furniture|table|chair|stool|cabinet/.test(text)) return "Solid Wood Furniture"
  if (/shoe|shoes|footwear|jutti|sandal/.test(text)) return "Footwear"
  if (/shirt|kurta|apparel|clothing|garment/.test(text)) return "Apparel"
  if (/brass|decor|home|metal/.test(text)) return "Home Decor"
  return "Other"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const query = typeof body.query === "string" ? body.query.trim().replace(/\s+/g, " ").slice(0, 140) : ""
    const stateCode = typeof body.stateCode === "string" && INDIA_STATE_DATA.some(state => state.id === body.stateCode) ? body.stateCode : null
    const contact = typeof body.contact === "string" ? body.contact.trim().slice(0, 180) : null
    const source = ["welcome", "search", "footer"].includes(body.source) ? body.source : "homepage"
    if (query.length < 2) return NextResponse.json({ error: "Tell us what item or category you want." }, { status: 400 })
    if (contact && contact.length < 5) return NextResponse.json({ error: "Enter a valid email address or phone number." }, { status: 400 })

    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    const db = createServiceClient()
    const { error } = await db.from("customer_demand_requests").insert({
      requested_item: query,
      category: categoryFor(query),
      state_code: stateCode,
      user_id: user?.id || null,
      contact,
      source,
    })
    if (error) {
      if (error.code === "42P01" || /schema cache/i.test(error.message)) {
        return NextResponse.json({ error: "Customer demand storage is not installed yet. Apply supabase/customer-demand-requests.sql to enable requests." }, { status: 503 })
      }
      throw error
    }
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("Demand request error:", error)
    return NextResponse.json({ error: "We could not record that request right now." }, { status: 500 })
  }
}
