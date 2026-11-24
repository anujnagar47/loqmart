import { CatalogListing } from "@/components/catalog-listing"

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const initialFilters: Record<string, string> = {}
  for (const key of ["q", "state", "seller", "category", "region", "sort"]) {
    const value = params[key]
    if (typeof value === "string") initialFilters[key] = value
  }
  return <CatalogListing initialFilters={initialFilters} />
}
