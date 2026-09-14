import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = createServiceClient()

    const body = await request.json()
    const {
      business_name,
      owner_name,
      phone,
      business_type,
      store_name,
      description,
      date_of_birth,
      id_proof_type,
      id_proof_number,
      intended_categories,
      gstin,
      pan,
      address,
      city,
      state,
      pincode,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
    } = body

    // Validate required fields
    if (
      !business_name || !owner_name || !business_type || !store_name ||
      !date_of_birth || !id_proof_type || !id_proof_number ||
      !pan || !address || !city || !state || !pincode ||
      !bank_account_name || !bank_account_number || !bank_ifsc
    ) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Map state name to state code
    const STATE_CODES: Record<string, string> = {
      "andhra pradesh": "AP", "arunachal pradesh": "AR", "assam": "AS",
      "bihar": "BR", "chhattisgarh": "CT", "goa": "GA", "gujarat": "GJ",
      "haryana": "HR", "himachal pradesh": "HP", "jharkhand": "JH",
      "karnataka": "KA", "kerala": "KL", "madhya pradesh": "MP",
      "maharashtra": "MH", "manipur": "MN", "meghalaya": "ML",
      "mizoram": "MZ", "nagaland": "NL", "odisha": "OR", "punjab": "PB",
      "rajasthan": "RJ", "sikkim": "SK", "tamil nadu": "TN",
      "telangana": "TG", "tripura": "TR", "uttar pradesh": "UP",
      "uttarakhand": "UA", "west bengal": "WB", "delhi": "DL",
      "jammu and kashmir": "JK", "ladakh": "LA",
    }
    const state_code = STATE_CODES[state.toLowerCase()] || state.substring(0, 2).toUpperCase()

    // Ensure the user has a public.users row (trigger may not have fired)
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!existingUser) {
      await supabase.from("users").insert({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "New User",
        role: "buyer",
        email_verified: !!user.email_confirmed_at,
      })
      await supabase.from("loqcoin_balances").insert({
        user_id: user.id, balance: 0, lifetime_earned: 0, lifetime_redeemed: 0,
      })
    }

    // Check if seller already exists for this user
    const { data: existingSeller } = await supabase
      .from("sellers")
      .select("id, approval_status")
      .eq("user_id", user.id)
      .single()

    if (existingSeller) {
      return NextResponse.json({
        error: existingSeller.approval_status === "pending"
          ? "Your application is already under review."
          : "You already have a registered seller account.",
      }, { status: 409 })
    }

    // Create seller record
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .insert({
        user_id: user.id,
        business_name,
        owner_name,
        business_type,
        store_name,
        description: description || null,
        date_of_birth,
        id_proof_type,
        id_proof_number,
        intended_categories: Array.isArray(intended_categories) ? intended_categories : null,
        address,
        city,
        state,
        state_code,
        pincode,
        gstin: gstin || null,
        pan,
        bank_account_name,
        bank_account_number,
        bank_ifsc,
        approval_status: "pending",
        swadeshi_rank: 0,
        swadeshi_score: 0,
      })
      .select()
      .single()

    if (sellerError || !seller) {
      console.error("Seller creation error:", sellerError)
      return NextResponse.json({ error: "Failed to create seller account" }, { status: 500 })
    }

    // Create seller approval record
    await supabase.from("seller_approvals").insert({
      seller_id: seller.id,
      status: "pending",
    })

    // Update user phone
    await supabase
      .from("users")
      .update({ phone: phone || null })
      .eq("id", user.id)

    // Notify admins
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")

    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map(admin => ({
          user_id: admin.id,
          type: "new_seller_application",
          title: "New Seller Application",
          message: `${business_name} has applied to become a seller. Review and approve.`,
          data: { seller_id: seller.id, business_name },
        }))
      )
    }

    return NextResponse.json({
      message: "Application submitted successfully. You will be notified within 2-3 business days.",
      seller_id: seller.id,
    })
  } catch (error) {
    console.error("Seller registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
