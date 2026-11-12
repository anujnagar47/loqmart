import { NextResponse } from "next/server"
import { createClient as createSessionClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?[\d\s().-]{8,20}$/
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : ""

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0)
    if (contentLength > 32_000) return NextResponse.json({ error: "Inquiry is too large." }, { status: 413 })
    const body = await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid inquiry details." }, { status: 400 })
    // Quietly accept bot-filled honeypot forms without storing spam.
    if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ success: true })

    const fullName = clean(body.fullName, 120)
    const email = clean(body.email, 254).toLowerCase()
    const phone = clean(body.phone, 20)
    const cityState = clean(body.cityState, 120)
    const note = clean(body.note, 1000)
    const productIds = Array.isArray(body.productIds) ? [...new Set(body.productIds)] : []
    const rawOptions = body.productOptions && typeof body.productOptions === "object" && !Array.isArray(body.productOptions) ? body.productOptions : {}
    const productOptions = Object.fromEntries(Object.entries(rawOptions)
      .filter(([id, option]) => typeof id === "string" && UUID.test(id) && productIds.includes(id) && typeof option === "string")
      .map(([id, option]) => [id, clean(option, 120)]))

    if (fullName.length < 2 || !EMAIL.test(email) || !PHONE.test(phone) || cityState.length < 2) {
      return NextResponse.json({ error: "Please provide a valid name, email, phone number, and city or state." }, { status: 400 })
    }
    if (productIds.length < 1 || productIds.length > 20 || productIds.some((id: unknown) => typeof id !== "string" || !UUID.test(id))) {
      return NextResponse.json({ error: "Select between 1 and 20 valid products." }, { status: 400 })
    }

    let userId: string | null = null
    try {
      const sessionClient = await createSessionClient()
      const { data: { user } } = await sessionClient.auth.getUser()
      userId = user?.id || null
    } catch {
      // Sign-in is optional for inquiry submission; never block a valid guest lead.
    }
    const db = createServiceClient()
    const { data: validProducts, error: productsError } = await db
      .from("products")
      .select("id")
      .in("id", productIds)
      .eq("approval_status", "approved")
    if (productsError) {
      console.error("Inquiry product validation error:", productsError)
      return NextResponse.json({ error: "We could not verify the selected products. Please try again." }, { status: 500 })
    }
    if ((validProducts || []).length !== productIds.length) {
      return NextResponse.json({ error: "One or more selected products are no longer available to view." }, { status: 400 })
    }

    const { error } = await db.from("inquiries").insert({
      full_name: fullName,
      email,
      phone,
      city_state: cityState,
      note: note || null,
      product_ids: productIds,
      product_options: productOptions,
      user_id: userId,
      status: "new",
    })
    if (error) {
      console.error("Inquiry submission failed:", error)
      return NextResponse.json({ error: "Inquiry storage is not ready yet. Please try again shortly." }, { status: 503 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Inquiry API error:", error)
    return NextResponse.json({ error: "Unable to submit the inquiry right now." }, { status: 500 })
  }
}
