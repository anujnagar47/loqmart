import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log("=== Seeding Catalogues for NEHHDC & Jodhpuri Furniture ===")

  // 1. Ensure Categories exist
  const craftCategories = [
    { name: "Heritage Textiles & Handlooms", slug: "heritage-textiles-handlooms", description: "Woven traditions from India’s looms", mode: "handmade", is_active: true, sort_order: 1 },
    { name: "Cane, Bamboo & Natural Fibers", slug: "cane-bamboo-natural-fibers", description: "Everyday forms woven from renewable materials", mode: "handmade", is_active: true, sort_order: 2 },
    { name: "Hand-Carved Woods & Lacquerware", slug: "carved-woods-lacquerware", description: "Carved, turned and lacquered by skilled hands", mode: "handmade", is_active: true, sort_order: 3 },
    { name: "Artisan Pottery & Ceramics", slug: "artisan-pottery-ceramics", description: "Clay shaped by hand and fired with care", mode: "handmade", is_active: true, sort_order: 4 },
    { name: "Solid Wood & Artisan Furniture", slug: "furniture", description: "Handcrafted and precision joinery solid wood furniture", mode: "machine_made", is_active: true, sort_order: 5 },
  ]

  console.log("\n1. Ensuring Categories...")
  for (const cat of craftCategories) {
    const { data, error } = await supabase.from("categories").upsert(cat, { onConflict: "slug" }).select("id, name, slug")
    if (error) console.error("Error upserting category:", cat.slug, error)
    else console.log(`✓ Category '${data[0]?.name}' (${data[0]?.slug}): ${data[0]?.id}`)
  }

  // 2. Ensure Sellers exist
  console.log("\n2. Ensuring Sellers...")
  const sellers = [
    {
      id: "31524146-8951-4718-b9b7-595f6ebe8411",
      business_name: "NEHHDC",
      owner_name: "North Eastern Handicrafts and Handlooms Development Corporation",
      store_name: "NEHHDC Crafts & Handlooms",
      business_type: "corporation",
      state: "Assam",
      state_code: "AS",
      city: "Guwahati",
      approval_status: "approved",
      user_id: "11111111-1111-1111-1111-111111111111",
      intended_categories: ["Heritage Textiles & Handlooms", "Cane, Bamboo & Natural Fibers", "Artisan Pottery & Ceramics"],
      description: "NEHHDC operates under the Ministry of DoNER to promote indigenous handicrafts and handloom artisans across the North Eastern Region of India.",
    },
    {
      id: "ae18e093-2f14-47f6-b9ed-04826fbbaf24",
      business_name: "Jodhpuri Furniture",
      owner_name: "Jodhpur Furniture Company",
      store_name: "Jodhpuri Furniture Studio",
      business_type: "manufacturer",
      state: "Rajasthan",
      state_code: "RJ",
      city: "Jodhpur",
      approval_status: "approved",
      user_id: "11111111-1111-1111-1111-111111111111",
      intended_categories: ["Solid Wood & Artisan Furniture", "Hand-Carved Woods & Lacquerware"],
      description: "Direct manufacturer of solid Sheesham wood, teak wood, and hand-carved heritage furniture crafted by master artisans in Jodhpur, Rajasthan.",
    },
  ]

  for (const s of sellers) {
    const { data: existing } = await supabase.from("sellers").select("id").eq("business_name", s.business_name).maybeSingle()
    if (existing) {
      console.log(`✓ Seller '${s.business_name}' exists: ${existing.id}`)
    } else {
      const { data, error } = await supabase.from("sellers").insert(s).select("id, business_name")
      if (error) console.error("Error creating seller:", s.business_name, error)
      else console.log(`✓ Created seller '${data[0]?.business_name}': ${data[0]?.id}`)
    }
  }

  // 3. Load product records
  const payloadPath = "/private/tmp/all_catalog_products_cleaned.json"
  if (!fs.existsSync(payloadPath)) {
    console.error(`Payload file not found at ${payloadPath}`)
    process.exit(1)
  }

  const products = JSON.parse(fs.readFileSync(payloadPath, "utf-8"))
  console.log(`\n3. Upserting ${products.length} Products in batches of 40...`)

  let inserted = 0
  let failed = 0
  const BATCH_SIZE = 40

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase.from("products").upsert(batch, { onConflict: "seller_id,slug" }).select("id")
    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message)
      failed += batch.length
    } else {
      inserted += (data?.length || batch.length)
      process.stdout.write(`\rProgress: ${inserted} / ${products.length} products upserted...`)
    }
  }

  console.log(`\n\n=== Seeding Complete ===`)
  console.log(`✓ Total successful: ${inserted}`)
  if (failed > 0) console.log(`✗ Failed: ${failed}`)

  // 4. Verify counts by seller
  const { count: nehhdcCount } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("seller_id", "31524146-8951-4718-b9b7-595f6ebe8411")
  const { count: jodhpuriCount } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("seller_id", "ae18e093-2f14-47f6-b9ed-04826fbbaf24")

  console.log(`\nVerification:`)
  console.log(`- NEHHDC products in database: ${nehhdcCount}`)
  console.log(`- Jodhpuri Furniture products in database: ${jodhpuriCount}`)
}

main().catch(console.error)
