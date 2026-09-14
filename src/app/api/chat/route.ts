import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const otherId = searchParams.get("otherId")

    if (!otherId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // The caller can only ever read threads they are a party to — userId is
    // always the authenticated session's own id, never taken from the query string.
    const userId = user.id

    const supabase = createServiceClient()

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Fetch messages error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { receiver_id, content } = await request.json()

    if (!receiver_id || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error("Send message error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: data })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
