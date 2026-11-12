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
      documents,
      craft_profile,
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

    const requiredDocumentTypes = ["owner_id", "pan_card"]
    const acceptedDocumentTypes = [...requiredDocumentTypes, "business_mou", "cancelled_cheque", "portfolio_image"]
    const submittedDocuments = Array.isArray(documents) ? documents : []
    const validDocuments = submittedDocuments.filter((doc: { doc_type?: string; file_url?: unknown }) =>
      acceptedDocumentTypes.includes(doc?.doc_type || "") && typeof doc.file_url === "string" &&
      (doc.doc_type === "portfolio_image" ? doc.file_url.startsWith(`${user.id}/portfolio/`) : doc.file_url.startsWith(`${user.id}/kyc/`))
    )
    const portfolioCount = validDocuments.filter((doc: { doc_type?: string }) => doc.doc_type === "portfolio_image").length
    if (validDocuments.length !== submittedDocuments.length || requiredDocumentTypes.some(docType => !validDocuments.some((doc: { doc_type?: string }) => doc.doc_type === docType)) ||
      !validDocuments.some((doc: { doc_type?: string }) => doc.doc_type === "cancelled_cheque") || portfolioCount < 3 || portfolioCount > 5) {
      return NextResponse.json({ error: "Upload your ID, PAN, cancelled cheque, and 3 to 5 portfolio images before submitting." }, { status: 400 })
    }
    if (!craft_profile || typeof craft_profile.cluster !== "string" || !craft_profile.cluster.trim() || typeof craft_profile.craft_type !== "string" || !craft_profile.craft_type || typeof craft_profile.craft_tier !== "string" || !craft_profile.craft_tier) {
      return NextResponse.json({ error: "Complete your craft cluster, craft type, and craft tier." }, { status: 400 })
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
      // Supabase/PostgREST errors are Error-like objects whose useful fields
      // are non-enumerable, so logging the object directly produces `{}`.
      // Keep the structured details in server logs while returning a safe,
      // actionable message for the common unapplied-schema case.
      console.error("Seller creation error:", sellerError ? {
        code: sellerError.code,
        message: sellerError.message,
        details: sellerError.details,
        hint: sellerError.hint,
      } : "Seller insert returned no row")

      if (sellerError?.code === "23505") {
        return NextResponse.json({ error: "A seller application already exists for this account." }, { status: 409 })
      }

      const missingRegistrationField = sellerError?.code === "PGRST204" || sellerError?.code === "42703"
      return NextResponse.json({
        error: missingRegistrationField
          ? "Seller registration needs a database update. Apply supabase/fix-phaseG-seller-registration-fields.sql to the LoqMart Supabase project, then try again."
          : "We couldn’t create your seller account. Please try again or contact support if the problem continues.",
      }, { status: 500 })
    }

    // Create seller approval record
    const { error: approvalError } = await supabase.from("seller_approvals").insert({
      seller_id: seller.id,
      status: "pending",
      documents: [...validDocuments, { doc_type: "seller_craft_profile", data: {
        application_status: "pending_review",
        cluster: craft_profile.cluster.trim(), craft_type: craft_profile.craft_type, craft_tier: craft_profile.craft_tier,
        udyam_number: typeof craft_profile.udyam_number === "string" ? craft_profile.udyam_number : null,
        artisan_pehchan_number: typeof craft_profile.artisan_pehchan_number === "string" ? craft_profile.artisan_pehchan_number : null,
      } }],
    })
    if (approvalError) console.error("Seller approval dossier save failed:", approvalError.message)

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
      message: "Your seller dossier has been received. Our verification desk will review your credentials and craft provenance before public launch.",
      application_status: "pending_review",
      seller_id: seller.id,
    })
  } catch (error) {
    console.error("Seller registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
