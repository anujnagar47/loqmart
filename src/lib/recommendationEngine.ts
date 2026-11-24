/** Weighted marketplace discovery for live products and the imported catalog. */
export type RecommendationItem = {
  id?: string
  slug: string
  name: string
  price?: number | null
  mrp?: number | null
  rating?: number | null
  review_count?: number | null
  verified_review_count?: number | null
  state_code?: string | null
  mode?: string | null
  tags?: string[] | null
  category_id?: string | null
  category?: { id?: string; name?: string; slug?: string } | null
  categories?: { id?: string; name?: string; slug?: string } | null
  specifications?: Record<string, unknown> | null
  description?: string | null
  images?: string[] | null
}

export type RankedItem<T> = { item: T; score: number; signals: { type: number; price: number; quality: number; heritage: number } }

const TYPE_GROUPS: Record<string, string[]> = {
  furniture: ["furniture", "stool", "bench", "chair", "table", "sofa", "bed", "wardrobe", "cabinet"],
  stool: ["stool", "bench", "accent table"],
  bench: ["bench", "stool", "accent table"],
  "accent table": ["accent table", "stool", "side table"],
  chair: ["chair", "armchair", "lounge chair", "stool"],
  armchair: ["armchair", "chair", "lounge chair"],
  "lounge chair": ["lounge chair", "armchair", "chair"],
  table: ["table", "desk", "console", "sideboard"],
  "coffee table": ["coffee table", "side table", "accent table"],
  "side table": ["side table", "bedside table", "accent table", "coffee table"],
  "bedside table": ["bedside table", "side table", "nightstand"],
  sofa: ["sofa", "couch", "lounge chair"],
  couch: ["couch", "sofa", "lounge chair"],
  bed: ["bed", "bedside table", "wardrobe"],
  textile: ["textile", "handloom", "fabric", "saree", "shawl", "cushion", "curtain"],
  pottery: ["pottery", "ceramic", "terracotta", "vase"],
  painting: ["painting", "art", "miniature", "mural"],
  jewellery: ["jewellery", "jewelry", "adornment", "filigree"],
  spice: ["spice", "food", "honey", "turmeric", "saffron"],
}

const KNOWN_STATES: Array<[string, string]> = [
  ["andhra pradesh", "AP"], ["arunachal pradesh", "AR"], ["assam", "AS"], ["bihar", "BR"], ["chhattisgarh", "CT"], ["goa", "GA"], ["gujarat", "GJ"], ["haryana", "HR"], ["himachal pradesh", "HP"], ["jharkhand", "JH"], ["karnataka", "KA"], ["kerala", "KL"], ["madhya pradesh", "MP"], ["maharashtra", "MH"], ["manipur", "MN"], ["meghalaya", "ML"], ["mizoram", "MZ"], ["nagaland", "NL"], ["odisha", "OD"], ["punjab", "PB"], ["rajasthan", "RJ"], ["sikkim", "SK"], ["tamil nadu", "TN"], ["telangana", "TG"], ["tripura", "TR"], ["uttar pradesh", "UP"], ["uttarakhand", "UK"], ["west bengal", "WB"], ["delhi", "DL"], ["jammu and kashmir", "JK"], ["ladakh", "LA"],
]

const normalize = (value: unknown) => String(value ?? "").toLocaleLowerCase("en-IN").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
const categoryText = (item: RecommendationItem) => {
  const specs = item.specifications || {}
  return normalize([item.category?.name, item.category?.slug, item.categories?.name, item.categories?.slug, specs.craft_family, specs.category, item.tags?.join(" ")].filter(Boolean).join(" "))
}
const itemText = (item: RecommendationItem) => normalize([item.name, item.slug, item.description, categoryText(item), Object.values(item.specifications || {}).join(" ")].join(" "))

function queryType(query: string) {
  const normalized = normalize(query)
  const matches = Object.entries(TYPE_GROUPS).filter(([type]) => normalized.includes(type))
  return matches.sort((a, b) => Number(["furniture", "textile", "spice"].includes(a[0])) - Number(["furniture", "textile", "spice"].includes(b[0])) || b[0].length - a[0].length)[0]?.[0] || null
}

function itemType(item: RecommendationItem) {
  const text = itemText(item)
  const matches = Object.entries(TYPE_GROUPS).filter(([type]) => text.includes(type))
  return matches.sort((a, b) => Number(["furniture", "textile", "spice"].includes(a[0])) - Number(["furniture", "textile", "spice"].includes(b[0])) || b[0].length - a[0].length)[0]?.[0] || null
}

function matchingState(query: string) {
  const normalized = normalize(query)
  return KNOWN_STATES.find(([name]) => normalized.includes(name))?.[1] || null
}

function targetPrice(query: string, reference?: RecommendationItem) {
  const q = normalize(query)
  const explicit = query.match(/(?:under|below|less than|upto|up to|budget(?: of)?|around|near|₹|rs\.?\s*)\s*([\d,]+)/i)?.[1]
  if (explicit) return Number(explicit.replaceAll(",", "")) || null
  return Number(reference?.price || reference?.mrp) || null
}

export interface SearchIntent {
  query: string
  keywords: string[]
  productType: string | null
  targetPrice: number | null
  stateCode: string | null
  mode: "handmade" | "machine_made" | null
}

export function parseSearchIntent(query: string): SearchIntent {
  const normalized = normalize(query)
  return {
    query,
    keywords: normalized.split(" ").filter(token => token.length > 1 && !["under", "below", "less", "than", "upto", "up", "to", "budget", "around", "near", "price", "in", "for", "and"].includes(token)),
    productType: queryType(query),
    targetPrice: targetPrice(query),
    stateCode: matchingState(query),
    mode: /machine made|contemporary|modern/i.test(query) ? "machine_made" : /handmade|handcrafted|artisan/i.test(query) ? "handmade" : null,
  }
}

function titleRelevance(query: string, item: RecommendationItem) {
  const terms = normalize(query).split(" ").filter(token => token.length > 1 && !["under", "below", "with", "from", "near", "around", "budget", "price", "in", "for", "and"].includes(token))
  if (!terms.length) return 0.45
  const text = itemText(item)
  const hits = terms.filter(term => text.includes(term)).length
  return Math.min(1, hits / Math.min(terms.length, 3))
}

function typeSignal(query: string, reference: RecommendationItem | undefined, item: RecommendationItem) {
  const target = reference ? itemType(reference) : queryType(query)
  const candidate = itemType(item)
  const text = titleRelevance(query || reference?.name || "", item)
  if (target && candidate === target) return Math.max(0.94, text)
  if (target && candidate && (TYPE_GROUPS[target] || []).includes(candidate)) return Math.max(0.68, text * 0.8)
  const refCategory = reference ? categoryText(reference) : ""
  const candidateCategory = categoryText(item)
  if (refCategory && candidateCategory && (refCategory === candidateCategory || refCategory.includes(candidateCategory) || candidateCategory.includes(refCategory))) return 0.82
  if (reference?.category_id && reference.category_id === item.category_id) return 0.9
  if (!target && text > 0) return text
  return Math.max(0.08, text * 0.35)
}

function priceSignal(query: string, reference: RecommendationItem | undefined, item: RecommendationItem) {
  const target = targetPrice(query, reference)
  const price = Number(item.price || item.mrp)
  if (!target || target <= 0 || !price || price <= 0) return 0.55
  const relativeDelta = Math.abs(price - target) / target
  // A Gaussian with sigma=25% gives smooth decay around the requested band.
  return Math.exp(-0.5 * (relativeDelta / 0.25) ** 2)
}

function qualitySignal(item: RecommendationItem) {
  const rating = Math.max(0, Math.min(5, Number(item.rating) || 0))
  const reviews = Math.max(0, Number(item.verified_review_count ?? item.review_count) || 0)
  const priorRating = 4
  const priorReviews = 5
  const bayesianRating = (reviews * rating + priorReviews * priorRating) / (reviews + priorReviews)
  return bayesianRating / 5
}

function heritageSignal(query: string, reference: RecommendationItem | undefined, item: RecommendationItem) {
  const intent = parseSearchIntent(query)
  const targetState = reference?.state_code || intent.stateCode
  if (targetState && item.state_code?.toUpperCase() === targetState.toUpperCase()) return 1
  if (!reference && intent.mode) return item.mode === intent.mode ? 0.9 : 0.15
  const refHeritage = reference ? normalize([reference.name, reference.slug, reference.mode, reference.tags?.join(" "), reference.specifications?.origin, reference.specifications?.craft_family, reference.specifications?.catalogue].join(" ")) : normalize(query)
  const candidateHeritage = normalize([item.name, item.slug, item.mode, item.tags?.join(" "), item.specifications?.origin, item.specifications?.craft_family, item.specifications?.catalogue, categoryText(item)].join(" "))
  const tokens = refHeritage.split(" ").filter(token => token.length > 3 && !["handmade", "crafted", "origin"].includes(token))
  if (tokens.some(token => candidateHeritage.includes(token))) return 0.82
  if (reference?.mode && item.mode === reference.mode) return 0.45
  return targetState || queryType(query) ? 0.15 : 0.35
}

export function scoreRecommendation(query: string, reference: RecommendationItem | undefined, candidate: RecommendationItem) {
  const signals = {
    type: typeSignal(query, reference, candidate),
    price: priceSignal(query, reference, candidate),
    quality: qualitySignal(candidate),
    heritage: heritageSignal(query, reference, candidate),
  }
  const score = Math.round((signals.type * 35 + signals.price * 25 + signals.quality * 20 + signals.heritage * 20) * 100) / 100
  return { score, signals }
}

export function rankRecommendations<T extends RecommendationItem>(reference: RecommendationItem, candidates: T[], limit = candidates.length): RankedItem<T>[] {
  return candidates
    .filter(candidate => candidate.id !== reference.id && candidate.slug !== reference.slug)
    .map(item => ({ item, ...scoreRecommendation(reference.name, reference, item) }))
    .sort((a, b) => b.score - a.score || (Number(b.item.rating) || 0) - (Number(a.item.rating) || 0) || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
}

export function rankSearchResults<T extends RecommendationItem>(query: string, candidates: T[], limit = candidates.length): RankedItem<T>[] {
  return candidates
    .map(item => ({ item, ...scoreRecommendation(query, undefined, item) }))
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
}
