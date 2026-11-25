import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { Redis } from "@upstash/redis"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const inquiryRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null
const INQUIRIES_KEY = "loqmart:purchase-inquiries:v1"

function parseStored(row: unknown) {
  return typeof row === "string" ? JSON.parse(row) : row
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { data, error } = await auth.db.from("inquiries")
    .select("id,full_name,email,phone,city_state,note,product_ids,product_options,status,created_at")
    .order("created_at", { ascending: false }).limit(500)
  let sourceRows: any[] = data || []
  if (error) {
    if ((error.code === "42P01" || /schema cache/i.test(error.message)) && inquiryRedis) {
      try { sourceRows = (await inquiryRedis.lrange(INQUIRIES_KEY, 0, 499)).map(parseStored) as any[] }
      catch { return NextResponse.json({ error: "Could not load purchase requests." }, { status: 503 }) }
    } else {
      console.error("Admin inquiry list error:", error)
      return NextResponse.json({ error: "Could not load purchase requests. Check that the inquiries database migration is installed." }, { status: 503 })
    }
  }

  const productIds = [...new Set(sourceRows.flatMap(row => row.product_ids || []))]
  const { data: products, error: productsError } = productIds.length
    ? await auth.db.from("products").select("id,name,slug,images,state_code,sellers(business_name)").in("id", productIds)
    : { data: [], error: null }
  if (productsError) return NextResponse.json({ error: "Could not load requested product details." }, { status: 503 })
  const productMap = new Map((products || []).map(product => [product.id, product]))
  const requests = sourceRows.map(row => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    cityState: row.city_state,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
    products: (row.product_ids || []).map((id: string) => {
      const product = productMap.get(id)
      if (!product) return null
      const seller = Array.isArray(product.sellers) ? product.sellers[0] : product.sellers
      return { ...product, sellerName: seller?.business_name || null, option: row.product_options?.[id] || "" }
    }).filter(Boolean),
  })).filter((row: any) => auth.role !== "sub_admin" || row.products.some((product: any) => product?.state_code === auth.stateScope))
  return NextResponse.json({ requests })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === "string" ? body.id : ""
  const status = typeof body?.status === "string" ? body.status : ""
  if (!id || !["new", "contacted", "closed"].includes(status)) return NextResponse.json({ error: "Choose a valid request and status." }, { status: 400 })
  const { data: inquiry, error: inquiryError } = await auth.db.from("inquiries").select("id,product_ids").eq("id", id).maybeSingle()
  let storedRows: any[] = []
  let selectedInquiry = inquiry
  const missingTable = inquiryError && (inquiryError.code === "42P01" || /schema cache/i.test(inquiryError.message))
  if (missingTable && inquiryRedis) {
    try {
      storedRows = (await inquiryRedis.lrange(INQUIRIES_KEY, 0, 4999)).map(parseStored) as any[]
      selectedInquiry = storedRows.find(row => row.id === id) || null
    } catch { return NextResponse.json({ error: "Could not load purchase request." }, { status: 503 }) }
  }
  if (inquiryError && !missingTable || !selectedInquiry) return NextResponse.json({ error: "Purchase request not found." }, { status: 404 })
  if (auth.role === "sub_admin") {
    if (!auth.stateScope) return NextResponse.json({ error: "A state scope is required." }, { status: 403 })
    const { data: products } = await auth.db.from("products").select("state_code").in("id", selectedInquiry.product_ids || [])
    if (!products?.some(product => product.state_code === auth.stateScope)) return NextResponse.json({ error: "This request is outside your state scope." }, { status: 403 })
  }
  if (missingTable) {
    if (!inquiryRedis) return NextResponse.json({ error: "Request storage is not configured." }, { status: 503 })
    const index = storedRows.findIndex(row => row.id === id)
    if (index < 0) return NextResponse.json({ error: "Purchase request not found." }, { status: 404 })
    storedRows[index] = { ...storedRows[index], status }
    try { await inquiryRedis.lset(INQUIRIES_KEY, index, JSON.stringify(storedRows[index])) }
    catch { return NextResponse.json({ error: "Could not update purchase request." }, { status: 503 }) }
    return NextResponse.json({ ok: true })
  }
  const { error } = await auth.db.from("inquiries").update({ status }).eq("id", id)
  if (error) return NextResponse.json({ error: "Could not update purchase request." }, { status: 503 })
  return NextResponse.json({ ok: true })
}
