import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/admin"
import { CategoryClient } from "./CategoryClient"
import type { Product } from "@/types/database"

export const metadata: Metadata = {
  title: "Shop Handmade & Machine-Made Products | LoqMart",
  description: "Browse verified handmade crafts and machine-made products from Indian sellers, filterable by state, price and category.",
}

async function fetchInitialProducts(mode: "handmade" | "machine_made", search: string): Promise<Product[]> {
  try {
    const supabase = createServiceClient()
    let query = supabase
      .from("products")
      .select("*, sellers(id, business_name, swadeshi_rank, state_code), categories(id, name, slug)")
      .eq("approval_status", "approved")
      .eq("mode", mode)
      .order("rating", { ascending: false })
      .range(0, 99)

    if (search) query = query.ilike("name", `%${search.slice(0, 100)}%`)

    const { data, error } = await query
    if (error) { console.error("Category initial fetch error:", error); return [] }
    return data || []
  } catch (err) {
    console.error("Category initial fetch failed:", err)
    return []
  }
}

export default async function CategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; search?: string }>
}) {
  const params = await searchParams
  const mode = params.mode === "machine_made" ? "machine_made" : "handmade"
  const search = params.search || ""

  const initialProducts = await fetchInitialProducts(mode, search)

  return (
    <CategoryClient
      key={`${mode}:${search}`}
      initialProducts={initialProducts}
      initialMode={mode}
      initialSearch={search}
    />
  )
}
