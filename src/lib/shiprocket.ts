const SR_BASE = "https://apiv2.shiprocket.in/v1/external"

let _token: string | null = null
let _tokenExpiry = 0

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token

  const res = await fetch(`${SR_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  })

  if (!res.ok) throw new Error(`Shiprocket auth failed: ${res.status}`)

  const data = await res.json()
  _token = data.token as string
  _tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000 // token valid ~10 days
  return _token
}

async function srFetch(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const res = await fetch(`${SR_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || `Shiprocket API error: ${res.status}`)
  return data
}

export interface ShiprocketItem {
  name: string
  sku: string
  units: number
  selling_price: number
}

export interface ShiprocketOrderPayload {
  order_id: string
  order_date: string
  pickup_location: string
  billing_customer_name: string
  billing_phone: string
  billing_address: string
  billing_city: string
  billing_state: string
  billing_country: string
  billing_pincode: string
  shipping_is_billing: boolean
  order_items: ShiprocketItem[]
  payment_method: "Prepaid" | "COD"
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

export async function createShiprocketOrder(payload: ShiprocketOrderPayload) {
  return srFetch("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function generateAWB(shipmentId: number, courierCode?: string) {
  return srFetch("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_id: courierCode ?? undefined,
    }),
  })
}

export async function schedulePickup(shipmentIds: number[]) {
  return srFetch("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentIds }),
  })
}

export async function generateManifest(shipmentIds: number[]) {
  return srFetch("/manifests/generate", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentIds }),
  })
}
