import { NextResponse } from "next/server"

// LoqMart storefront coverage is Pan-India. This endpoint validates Indian
// postal-code format and returns the current platform dispatch estimate.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("product_id")
  const pincode = searchParams.get("pincode") || ""
  const numericPincode = Number(pincode)

  if (!productId || !/^\d{6}$/.test(pincode) || numericPincode < 100000 || numericPincode > 999999) {
    return NextResponse.json({ error: "Enter a valid 6-digit Indian pincode (100000–999999)." }, { status: 400 })
  }

  return NextResponse.json({
    configured: true,
    serviceable: true,
    estimatedDays: 5,
    message: "Delivery available across India • Estimated dispatch in 5–7 business days via Pan-India Logistics",
  })
}
