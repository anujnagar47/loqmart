import catalog from "../../public/catalog-import.json"
import jbsCatalog from "../../public/jbs-catalog-import.json"
import { rankSearchResults } from "@/lib/recommendationEngine"

export type CatalogProduct = (typeof catalog.products)[number]

export const CATALOG_PRODUCTS = [...catalog.products, ...jbsCatalog.products] as CatalogProduct[]

export const CATALOG_SELLERS: Record<string, string> = {
  "31524146-8951-4718-b9b7-595f6ebe8411": "NEHHDC",
  "ae18e093-2f14-47f6-b9ed-04826fbbaf24": "Shri Mintu's Art",
  "a682f12b-8d1d-4da4-9b7c-196019600001": "Jaipur Billiards",
}
export const PENDING_CATALOG_SELLER_IDS = new Set(["a682f12b-8d1d-4da4-9b7c-196019600001"])

export const CATALOG_STATES: Record<string, string> = {
  AS: "Assam", MN: "Manipur", MP: "Madhya Pradesh",
  AR: "Arunachal Pradesh", ML: "Meghalaya", MZ: "Mizoram", NL: "Nagaland",
  SK: "Sikkim", TR: "Tripura", RJ: "Rajasthan",
}

export function catalogProductPath(product: CatalogProduct) {
  return `/catalog/${encodeURIComponent(product.slug)}`
}

function normalize(value: string) {
  return value.toLocaleLowerCase("en-IN").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
}

function editDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 3
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    previous = current
  }
  return previous[b.length]
}

function fieldScore(queryToken: string, value: string, weight: number) {
  const normalized = normalize(value)
  if (!normalized) return 0
  if (normalized === queryToken) return weight * 1.25
  const words = normalized.split(" ")
  if (words.some(word => word.startsWith(queryToken))) return weight
  if (normalized.includes(queryToken)) return weight * 0.82
  if (words.some(word => queryToken.startsWith(word) && queryToken.length >= 3)) return weight * 0.7
  if (queryToken.length >= 4 && words.some(word => editDistance(queryToken, word) <= (queryToken.length > 6 ? 2 : 1))) return weight * 0.55
  return 0
}

export function scoreCatalogProduct(product: CatalogProduct, query: string) {
  const seller = CATALOG_SELLERS[product.seller_id] || ""
  const state = CATALOG_STATES[product.state_code || ""] || ""
  const spec = product.specifications as Record<string, string>
  const fields = [
    [product.name, 12], [product.slug, 10], [spec.catalogue_code || "", 9],
    [seller, 8], [state, 8], [spec.origin || "", 7],
    [spec.craft_family || "", 6], [product.tags.join(" "), 5],
    [product.description, 2],
  ] as const
  const tokens = normalize(query).split(" ").filter(Boolean)
  if (!tokens.length) return 0
  let score = 0
  for (const token of tokens) {
    const best = Math.max(...fields.map(([value, weight]) => fieldScore(token, value, weight)))
    if (best === 0) return 0
    score += best
  }
  return score
}

export function searchCatalog(query: string, limit = 24) {
  const matches = CATALOG_PRODUCTS.filter(product => scoreCatalogProduct(product, query) > 0)
  return rankSearchResults(query, matches, limit).map(row => row.item)
}
