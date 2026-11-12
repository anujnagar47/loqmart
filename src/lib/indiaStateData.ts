export interface IndiaStateData {
  id: string
  name: string
  slug: string
  /** Catalog state_code values; some legacy Union Territories use two codes. */
  filterCodes: string[]
  region: string
  image: string
  crafts: string[]
  /** Filled only from admin-reviewed GI marks. */
  giTagsCount: number
}

const image = (photoId: string) => `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&q=75`

const photos = {
  textiles: image("photo-1483985988355-763728e1935b"),
  pottery: image("photo-1600210492486-724fe5c67fb0"),
  painting: image("photo-1541961017774-22349e4a1262"),
  metal: image("photo-1452860606245-08befc0ff44b"),
  wood: image("photo-1616486338812-3dadae4b4ace"),
  fibers: image("photo-1553062407-98eeb64c6a62"),
  adornments: image("photo-1515562141207-7a88fb7ce338"),
  foods: image("photo-1606787366850-de6330128bfc"),
  rajasthan: image("photo-1599661559684-6ea0c5e7b5f9"),
  north: image("photo-1561361513-2d000a50f0dc"),
  south: image("photo-1582510003544-4d00b7f7415e"),
  east: image("photo-1558431382-27e303142255"),
  west: image("photo-1603228254119-e6a4d0f5f403"),
  coast: image("photo-1602216056096-3b40cc0c9944"),
  northeast: image("photo-1589136777351-fdc9c9cb15c4"),
  odisha: image("photo-1629215034606-9ab50c5344d5"),
}

// Covers the 28 states and 8 Union Territories represented by the bundled
// 36-feature TopoJSON. GI counts remain zero until verified product data exists.
export const INDIA_STATE_DATA: IndiaStateData[] = [
  { id: "AP", name: "Andhra Pradesh", slug: "andhra-pradesh", filterCodes: ["AP"], region: "South India", image: photos.south, crafts: ["Kalamkari", "Kondapalli Toys", "Uppada Jamdani"], giTagsCount: 0 },
  { id: "AR", name: "Arunachal Pradesh", slug: "arunachal-pradesh", filterCodes: ["AR"], region: "North East India", image: photos.northeast, crafts: ["Monpa Carpets", "Bamboo Craft", "Tribal Weaving"], giTagsCount: 0 },
  { id: "AS", name: "Assam", slug: "assam", filterCodes: ["AS"], region: "North East India", image: photos.northeast, crafts: ["Muga Silk", "Assam Bamboo", "Bell Metal"], giTagsCount: 0 },
  { id: "BR", name: "Bihar", slug: "bihar", filterCodes: ["BR"], region: "East India", image: photos.painting, crafts: ["Madhubani Painting", "Bhagalpur Silk", "Sikki Grass Craft"], giTagsCount: 0 },
  { id: "CT", name: "Chhattisgarh", slug: "chhattisgarh", filterCodes: ["CT", "CG"], region: "Central India", image: photos.metal, crafts: ["Bastar Dokra", "Bell Metal", "Wrought Iron Craft"], giTagsCount: 0 },
  { id: "GA", name: "Goa", slug: "goa", filterCodes: ["GA"], region: "West India", image: photos.coast, crafts: ["Kaavi Art", "Coconut Craft", "Crochet Lace"], giTagsCount: 0 },
  { id: "GJ", name: "Gujarat", slug: "gujarat", filterCodes: ["GJ"], region: "West India", image: photos.west, crafts: ["Patola", "Bandhani", "Kutch Embroidery"], giTagsCount: 0 },
  { id: "HR", name: "Haryana", slug: "haryana", filterCodes: ["HR"], region: "North India", image: photos.textiles, crafts: ["Panipat Durries", "Phulkari", "Terracotta Craft"], giTagsCount: 0 },
  { id: "HP", name: "Himachal Pradesh", slug: "himachal-pradesh", filterCodes: ["HP"], region: "North India", image: photos.north, crafts: ["Kullu Shawls", "Chamba Rumal", "Wood Carving"], giTagsCount: 0 },
  { id: "JH", name: "Jharkhand", slug: "jharkhand", filterCodes: ["JH"], region: "East India", image: photos.fibers, crafts: ["Sohrai Painting", "Dokra Metalwork", "Bamboo Craft"], giTagsCount: 0 },
  { id: "KA", name: "Karnataka", slug: "karnataka", filterCodes: ["KA"], region: "South India", image: photos.south, crafts: ["Channapatna Toys", "Mysore Silk", "Sandalwood Carving"], giTagsCount: 0 },
  { id: "KL", name: "Kerala", slug: "kerala", filterCodes: ["KL"], region: "South India", image: photos.coast, crafts: ["Kasavu Weave", "Aranmula Kannadi", "Coir Craft"], giTagsCount: 0 },
  { id: "MP", name: "Madhya Pradesh", slug: "madhya-pradesh", filterCodes: ["MP"], region: "Central India", image: photos.painting, crafts: ["Gond Painting", "Bagh Print", "Chanderi Weave"], giTagsCount: 0 },
  { id: "MH", name: "Maharashtra", slug: "maharashtra", filterCodes: ["MH"], region: "West India", image: photos.west, crafts: ["Paithani", "Warli Art", "Sawantwadi Lacquerware"], giTagsCount: 0 },
  { id: "MN", name: "Manipur", slug: "manipur", filterCodes: ["MN"], region: "North East India", image: photos.northeast, crafts: ["Manipuri Weaving", "Kauna Craft", "Bamboo Work"], giTagsCount: 0 },
  { id: "ML", name: "Meghalaya", slug: "meghalaya", filterCodes: ["ML"], region: "North East India", image: photos.fibers, crafts: ["Cane and Bamboo", "Eri Silk", "Khasi Weaving"], giTagsCount: 0 },
  { id: "MZ", name: "Mizoram", slug: "mizoram", filterCodes: ["MZ"], region: "North East India", image: photos.fibers, crafts: ["Puan Weaving", "Bamboo Craft", "Wood Carving"], giTagsCount: 0 },
  { id: "NL", name: "Nagaland", slug: "nagaland", filterCodes: ["NL"], region: "North East India", image: photos.fibers, crafts: ["Naga Textiles", "Bamboo Craft", "Wood Carving"], giTagsCount: 0 },
  { id: "OD", name: "Odisha", slug: "odisha", filterCodes: ["OR", "OD"], region: "East India", image: photos.odisha, crafts: ["Pattachitra", "Cuttack Filigree", "Sambalpuri Ikat"], giTagsCount: 0 },
  { id: "PB", name: "Punjab", slug: "punjab", filterCodes: ["PB"], region: "North India", image: photos.textiles, crafts: ["Phulkari", "Punjabi Jutti", "Wood Inlay"], giTagsCount: 0 },
  { id: "RJ", name: "Rajasthan", slug: "rajasthan", filterCodes: ["RJ"], region: "West India", image: photos.rajasthan, crafts: ["Jaipur Blue Pottery", "Sanganeri Print", "Kathputli"], giTagsCount: 0 },
  { id: "SK", name: "Sikkim", slug: "sikkim", filterCodes: ["SK"], region: "North East India", image: photos.northeast, crafts: ["Thangka Painting", "Wool Weaving", "Wood Carving"], giTagsCount: 0 },
  { id: "TN", name: "Tamil Nadu", slug: "tamil-nadu", filterCodes: ["TN"], region: "South India", image: photos.south, crafts: ["Kanchipuram Silk", "Thanjavur Painting", "Bronze Casting"], giTagsCount: 0 },
  { id: "TG", name: "Telangana", slug: "telangana", filterCodes: ["TG", "TS"], region: "South India", image: photos.adornments, crafts: ["Pochampally Ikat", "Bidriware", "Cheriyal Scrolls"], giTagsCount: 0 },
  { id: "TR", name: "Tripura", slug: "tripura", filterCodes: ["TR"], region: "North East India", image: photos.fibers, crafts: ["Bamboo Craft", "Cane Work", "Handloom"], giTagsCount: 0 },
  { id: "UP", name: "Uttar Pradesh", slug: "uttar-pradesh", filterCodes: ["UP"], region: "North India", image: photos.north, crafts: ["Banarasi Brocade", "Lucknow Chikankari", "Moradabad Brass"], giTagsCount: 0 },
  { id: "UA", name: "Uttarakhand", slug: "uttarakhand", filterCodes: ["UA", "UK"], region: "North India", image: photos.north, crafts: ["Aipan Art", "Ringaal Bamboo", "Wool Weaving"], giTagsCount: 0 },
  { id: "WB", name: "West Bengal", slug: "west-bengal", filterCodes: ["WB"], region: "East India", image: photos.east, crafts: ["Baluchari Silk", "Dokra Craft", "Bengal Kantha"], giTagsCount: 0 },
  { id: "AN", name: "Andaman and Nicobar Islands", slug: "andaman-and-nicobar-islands", filterCodes: ["AN"], region: "Islands", image: photos.coast, crafts: ["Coconut Craft", "Shell Craft", "Cane Work"], giTagsCount: 0 },
  { id: "CH", name: "Chandigarh", slug: "chandigarh", filterCodes: ["CH"], region: "North India", image: photos.north, crafts: ["Phulkari", "Punjabi Jutti", "Contemporary Craft"], giTagsCount: 0 },
  { id: "DN", name: "Dadra and Nagar Haveli and Daman and Diu", slug: "dadra-and-nagar-haveli-and-daman-and-diu", filterCodes: ["DN", "DD"], region: "West India", image: photos.coast, crafts: ["Warli Art", "Bamboo Craft", "Coir Work"], giTagsCount: 0 },
  { id: "DL", name: "Delhi", slug: "delhi", filterCodes: ["DL"], region: "North India", image: photos.adornments, crafts: ["Zardozi", "Metal Inlay", "Contemporary Craft"], giTagsCount: 0 },
  { id: "JK", name: "Jammu and Kashmir", slug: "jammu-and-kashmir", filterCodes: ["JK"], region: "North India", image: photos.north, crafts: ["Pashmina Shawls", "Kashmiri Walnut Wood", "Papier-Mâché"], giTagsCount: 0 },
  { id: "LA", name: "Ladakh", slug: "ladakh", filterCodes: ["LA"], region: "North India", image: photos.north, crafts: ["Pashmina", "Thangka Painting", "Wool Weaving"], giTagsCount: 0 },
  { id: "LD", name: "Lakshadweep", slug: "lakshadweep", filterCodes: ["LD"], region: "Islands", image: photos.coast, crafts: ["Coir Craft", "Coconut Craft", "Handwoven Mats"], giTagsCount: 0 },
  { id: "PY", name: "Puducherry", slug: "puducherry", filterCodes: ["PY"], region: "South India", image: photos.coast, crafts: ["Handmade Paper", "Terracotta", "Textile Printing"], giTagsCount: 0 },
]

export const INDIA_STATE_BY_NAME = new Map(INDIA_STATE_DATA.map((state) => [state.name.toLowerCase(), state]))
