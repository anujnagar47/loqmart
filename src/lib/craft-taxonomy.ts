export interface CraftCategory {
  slug: string
  name: string
  summary: string
  subcategories: string[]
  searchTerms: string
  image: string
  aliases: string[]
}

const photo = (id: string) => `https://images.unsplash.com/${id}?w=640&h=640&fit=crop`

export const CRAFT_CATEGORIES: CraftCategory[] = [
  {
    slug: "heritage-textiles-handlooms", name: "Heritage Textiles & Handlooms",
    summary: "Woven traditions from India’s looms",
    subcategories: ["Banarasi Brocades", "Chanderi Silks", "Kota Doria", "Pashmina Shawls", "Jamdani", "Pochampally Ikat"],
    searchTerms: "handloom", aliases: ["textiles", "clothing", "handloom", "saree", "fabric"],
    image: photo("photo-1483985988355-763728e1935b"),
  },
  {
    slug: "artisan-pottery-ceramics", name: "Artisan Pottery & Ceramic Studio",
    summary: "Clay shaped by hand and fired with care",
    subcategories: ["Jaipur Blue Pottery", "Khurja Stoneware", "Black Clay Pottery", "Terracotta Murals"],
    searchTerms: "pottery", aliases: ["pottery", "ceramic", "home & living", "terracotta"],
    image: photo("photo-1600210492486-724fe5c67fb0"),
  },
  {
    slug: "traditional-fine-art-miniatures", name: "Traditional Fine Art & Miniatures",
    summary: "Painting traditions, from scrolls to murals",
    subcategories: ["Pichwai Paintings", "Madhubani Art", "Pattachitra Scrolls", "Tanjore Gold Leaf", "Warli Murals"],
    searchTerms: "painting", aliases: ["art", "painting", "collectibles", "madhubani"],
    image: photo("photo-1541961017774-22349e4a1262"),
  },
  {
    slug: "master-metalwork-casting", name: "Master Metalwork & Casting",
    summary: "Lost-wax casting, inlay and forged forms",
    subcategories: ["Dokra Lost-Wax Bronze", "Bidri Silver Inlay", "Moradabad Brass", "Bell Metal Craft"],
    searchTerms: "metal", aliases: ["metal", "brass", "bronze", "decor"],
    image: photo("photo-1452860606245-08befc0ff44b"),
  },
  {
    slug: "carved-woods-lacquerware", name: "Hand-Carved Woods & Lacquerware",
    summary: "Carved, turned and lacquered by skilled hands",
    subcategories: ["Saharanpur Carvings", "Kashmiri Walnut Wood", "Channapatna Wooden Toys", "Sankheda Furniture"],
    searchTerms: "wood", aliases: ["wood", "furniture", "toys", "carving"],
    image: photo("photo-1616486338812-3dadae4b4ace"),
  },
  {
    slug: "cane-bamboo-natural-fibers", name: "Cane, Bamboo & Natural Fibers",
    summary: "Everyday forms woven from renewable materials",
    subcategories: ["Assam Golden Bamboo", "Kauna Grass Weaves", "Jute Fiber Craft", "Golden Grass Basketry"],
    searchTerms: "bamboo", aliases: ["bamboo", "cane", "basket", "jute", "natural fibers"],
    image: photo("photo-1553062407-98eeb64c6a62"),
  },
  {
    slug: "filigree-heritage-adornments", name: "Filigree & Heritage Adornments",
    summary: "Fine metalwork and regional jewellery",
    subcategories: ["Cuttack Tarakasi Silver Filigree", "Jaipur Meenakari", "Dokra Beads", "Terracotta Ornaments"],
    searchTerms: "jewellery", aliases: ["jewellery", "jewelry", "filigree", "accessories"],
    image: photo("photo-1515562141207-7a88fb7ce338"),
  },
  {
    slug: "gourmet-spices-origin-foods", name: "Gourmet Spices & GI-Tagged Origin Foods",
    summary: "Distinctive ingredients rooted in place",
    subcategories: ["Kashmiri Saffron", "Malabar Spices", "Lakadong Turmeric", "Organic Forest Honey"],
    searchTerms: "spices", aliases: ["food", "gourmet", "spices", "honey", "organic"],
    image: photo("photo-1606787366850-de6330128bfc"),
  },
]

export const CRAFT_CLUSTERS = [
  { slug: "rajasthan", label: "Rajasthan", state: "RJ", kind: "state" },
  { slug: "uttar-pradesh", label: "Uttar Pradesh", state: "UP", kind: "state" },
  { slug: "odisha", label: "Odisha", state: "OD", kind: "state" },
  { slug: "tamil-nadu", label: "Tamil Nadu", state: "TN", kind: "state" },
  { slug: "west-bengal", label: "West Bengal", state: "WB", kind: "state" },
  { slug: "karnataka", label: "Karnataka", state: "KA", kind: "state" },
  { slug: "jaipur", label: "Jaipur", state: "RJ", kind: "town" },
  { slug: "sanganer", label: "Sanganer", state: "RJ", kind: "town" },
  { slug: "varanasi", label: "Varanasi", state: "UP", kind: "town" },
  { slug: "bastar", label: "Bastar", state: "CT", kind: "town" },
  { slug: "raghurajpur", label: "Raghurajpur", state: "OD", kind: "town" },
  { slug: "cuttack", label: "Cuttack", state: "OD", kind: "town" },
  { slug: "kanchipuram", label: "Kanchipuram", state: "TN", kind: "town" },
] as const

export function craftSearchHref(term: string) {
  return `/category?q=${encodeURIComponent(term)}`
}

export function categoryHref(category: CraftCategory, available: Array<{ id: string; name: string; slug: string }> = []) {
  const terms = [category.slug, ...category.aliases].map((term) => term.toLowerCase())
  const match = available.find((item) =>
    terms.some((term) => item.slug.toLowerCase().includes(term) || item.name.toLowerCase().includes(term))
  )
  return match ? `/category/${match.slug}` : craftSearchHref(category.searchTerms)
}

export function displayCategoryName(category: { name: string; slug: string }) {
  const match = CRAFT_CATEGORIES.find(item => item.aliases.some(alias => {
    const words = `${category.name} ${category.slug}`.toLowerCase().replace(/[-_]/g, " ").split(/[^a-z0-9]+/).filter(Boolean)
    const aliasWords = alias.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
    return words.some((_word, index) => words.slice(index, index + aliasWords.length).join(" ") === aliasWords.join(" "))
  }))
  return match?.name || category.name
}
