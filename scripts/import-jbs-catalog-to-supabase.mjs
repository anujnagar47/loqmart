import { createClient } from "@supabase/supabase-js"
import fs from "node:fs"

const catalog = JSON.parse(fs.readFileSync(new URL("../public/jbs-catalog-import.json", import.meta.url), "utf8"))
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before importing.")
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const seller = {
  id: catalog.seller.id,
  business_name: catalog.seller.business_name,
  owner_name: catalog.seller.owner_name,
  business_type: "manufacturer",
  store_name: catalog.seller.store_name,
  description: `${catalog.seller.craft_specialty}. Contact: ${catalog.seller.phone}; ${catalog.seller.secondary_phone}. ${catalog.seller.email}. ${catalog.seller.website}. Source: ${catalog.source_pdf}`,
  intended_categories: ["Snooker tables", "Billiards tables", "Pool tables", "Table tennis", "Foosball", "Carrom", "Chess", "Game table accessories"],
  address: catalog.seller.address,
  city: catalog.seller.city,
  state: catalog.seller.state,
  state_code: catalog.seller.state_code,
  approval_status: "pending",
  swadeshi_rank: 0,
  swadeshi_score: 0,
}
const { error: sellerError } = await db.from("sellers").upsert(seller, { onConflict: "id" })
if (sellerError) throw sellerError

const products = catalog.products.map(({ seller_id, ...row }) => ({
  ...row,
  seller_id,
  category_id: null,
  approval_status: "pending",
}))
for (let offset = 0; offset < products.length; offset += 50) {
  const { error } = await db.from("products").upsert(products.slice(offset, offset + 50), { onConflict: "seller_id,slug" })
  if (error) throw error
}
console.log(`Imported pending seller ${seller.business_name} and ${products.length} pending products.`)
