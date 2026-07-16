import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stateId: string }> }
) {
  try {
    const { stateId } = await params
    const supabase = createServiceClient()

    const stateCode = stateId.toUpperCase()

    const { data: state, error: stateError } = await supabase
      .from("sellers")
      .select(`
        id,
        business_name,
        owner_name,
        logo_url,
        banner_url,
        description,
        state,
        state_code,
        city,
        swadeshi_rank,
        total_products,
        total_orders,
        approval_status
      `)
      .eq("state_code", stateCode)
      .eq("approval_status", "approved")
      .order("swadeshi_rank", { ascending: false })
      .limit(20)

    if (stateError) {
      console.error("Error fetching state sellers:", stateError)
      return NextResponse.json({ error: "Failed to fetch state data" }, { status: 500 })
    }

    const artisanCount = state?.length || 0
    const productCount = state?.reduce((acc, s) => acc + (s.total_products || 0), 0) || 0

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        seller_id,
        category_id,
        name,
        slug,
        description,
        price,
        mrp,
        stock,
        unit,
        images,
        mode,
        approval_status,
        state_code,
        tags,
        specifications,
        rating,
        review_count,
        sold_count
      `)
      .eq("state_code", stateCode)
      .eq("approval_status", "approved")
      .order("sold_count", { ascending: false })
      .limit(12)

    if (productsError) {
      console.error("Error fetching products:", productsError)
    }

    const stateNames: Record<string, string> = {
      AN: "Andaman and Nicobar Islands",
      AP: "Andhra Pradesh",
      AR: "Arunachal Pradesh",
      AS: "Assam",
      BR: "Bihar",
      CH: "Chandigarh",
      CT: "Chhattisgarh",
      DN: "Dadra and Nagar Haveli",
      DD: "Daman and Diu",
      DL: "Delhi",
      GA: "Goa",
      GJ: "Gujarat",
      HR: "Haryana",
      HP: "Himachal Pradesh",
      JK: "Jammu and Kashmir",
      JH: "Jharkhand",
      KA: "Karnataka",
      KL: "Kerala",
      LA: "Ladakh",
      LD: "Lakshadweep",
      MP: "Madhya Pradesh",
      MH: "Maharashtra",
      MN: "Manipur",
      ML: "Meghalaya",
      MZ: "Mizoram",
      NL: "Nagaland",
      OR: "Odisha",
      PY: "Puducherry",
      PB: "Punjab",
      RJ: "Rajasthan",
      SK: "Sikkim",
      TN: "Tamil Nadu",
      TG: "Telangana",
      TR: "Tripura",
      UP: "Uttar Pradesh",
      UA: "Uttarakhand",
      WB: "West Bengal",
    }

    const stateDescription = `Explore authentic ${stateNames[stateCode] || stateCode} crafts and handmade products from verified artisans. Each piece tells a story of tradition and craftsmanship passed down through generations.`

    return NextResponse.json({
      state: {
        name: stateNames[stateCode] || stateCode,
        state_code: stateCode,
        description: stateDescription,
        artisan_count: artisanCount,
        product_count: productCount,
        loqcoin_bonus: 10,
      },
      products: products || [],
      artisans: state || [],
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
