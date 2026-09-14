import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { checkServiceability } from "@/lib/shiprocket"

// GET /api/logistics/serviceability?product_id=...&pincode=...
// Real pincode-to-pincode delivery estimate, looked up from the selling
// seller's actual pincode — not a fabricated number. If Shiprocket isn't
// configured, says so explicitly rather than pretending to have checked.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("product_id")
    const pincode = searchParams.get("pincode")

    if (!productId || !pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: "product_id and a 6-digit pincode are required" }, { status: 400 })
    }

    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      return NextResponse.json({ configured: false, serviceable: null, estimatedDays: null })
    }

    const supabase = createServiceClient()
    const { data: product } = await supabase
      .from("products")
      .select("sellers(pincode)")
      .eq("id", productId)
      .maybeSingle()

    const sellerPincode = (product as unknown as { sellers: { pincode: string | null } | null } | null)?.sellers?.pincode
    if (!sellerPincode) {
      return NextResponse.json({ configured: true, serviceable: null, estimatedDays: null, error: "Seller pincode not on file" })
    }

    const result = await checkServiceability(sellerPincode, pincode)
    return NextResponse.json({ configured: true, ...result })
  } catch (error) {
    console.error("Serviceability check error:", error)
    return NextResponse.json({ configured: true, serviceable: null, estimatedDays: null, error: "Could not check serviceability right now" })
  }
}
