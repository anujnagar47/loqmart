import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

// POST /api/contact — public contact form submission
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }
    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json({ error: "Message is too short" }, { status: 400 })
    }
    if (message.trim().length > 4000) {
      return NextResponse.json({ error: "Message must be under 4000 characters" }, { status: 400 })
    }

    // Attach the submitter's user id when they happen to be logged in — optional, never required.
    const sessionClient = await createClient()
    const { data: { user } } = await sessionClient.auth.getUser()

    const supabase = createServiceClient()
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || null,
      message: message.trim(),
      user_id: user?.id || null,
    })

    if (error) {
      console.error("Contact message insert error:", error)
      return NextResponse.json({ error: "Failed to send your message. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
