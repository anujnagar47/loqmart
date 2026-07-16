import { NextResponse } from "next/server"

// This endpoint is disabled in production.
// Admin setup is done via Supabase Auth dashboard or admin-additions.sql.
export async function POST() {
  return NextResponse.json({ error: "Disabled" }, { status: 410 })
}
