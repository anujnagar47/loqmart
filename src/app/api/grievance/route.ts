import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

function generateTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `GR-${date}-${suffix}`
}

// POST /api/grievance — Consumer Protection (E-Commerce) Rules, 2020 grievance intake
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, orderNumber, issue, description } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }
    if (!issue || typeof issue !== "string") {
      return NextResponse.json({ error: "Issue category is required" }, { status: 400 })
    }
    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return NextResponse.json({ error: "Please describe your complaint in more detail (at least 10 characters)" }, { status: 400 })
    }
    if (description.trim().length > 4000) {
      return NextResponse.json({ error: "Description must be under 4000 characters" }, { status: 400 })
    }

    const sessionClient = await createClient()
    const { data: { user } } = await sessionClient.auth.getUser()

    const supabase = createServiceClient()

    // Resolve an order number to its id when provided, so admins can jump straight to the order.
    let orderId: string | null = null
    if (orderNumber && typeof orderNumber === "string" && orderNumber.trim()) {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber.trim())
        .maybeSingle()
      orderId = order?.id || null
    }

    const ticketNumber = generateTicketNumber()

    const { error } = await supabase.from("grievances").insert({
      ticket_number: ticketNumber,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      order_id: orderId,
      category: issue,
      description: description.trim(),
      user_id: user?.id || null,
    })

    if (error) {
      console.error("Grievance insert error:", error)
      return NextResponse.json({ error: "Failed to register your grievance. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true, ticket_number: ticketNumber })
  } catch (error) {
    console.error("Grievance API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
