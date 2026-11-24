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


// Covers the 28 states and 8 Union Territories represented by the bundled
// 36-feature TopoJSON. GI counts remain zero until verified product data exists.
export const INDIA_STATE_DATA: IndiaStateData[] = [
  { id: "AP", name: "Andhra Pradesh", slug: "andhra-pradesh", filterCodes: ["AP"], region: "South India", image: "/images/states/andhra-pradesh-hero.jpg", crafts: ["Kalamkari", "Kondapalli Toys", "Uppada Jamdani"], giTagsCount: 0 },
  { id: "AR", name: "Arunachal Pradesh", slug: "arunachal-pradesh", filterCodes: ["AR"], region: "North East India", image: "/images/states/arunachal-pradesh-hero.jpg", crafts: ["Monpa Carpets", "Bamboo Craft", "Tribal Weaving"], giTagsCount: 0 },
  { id: "AS", name: "Assam", slug: "assam", filterCodes: ["AS"], region: "North East India", image: "/images/states/assam-hero.jpg", crafts: ["Muga Silk", "Assam Bamboo", "Bell Metal"], giTagsCount: 0 },
  { id: "BR", name: "Bihar", slug: "bihar", filterCodes: ["BR"], region: "East India", image: "/images/states/bihar-hero.jpg", crafts: ["Madhubani Painting", "Bhagalpur Silk", "Sikki Grass Craft"], giTagsCount: 0 },
  { id: "CT", name: "Chhattisgarh", slug: "chhattisgarh", filterCodes: ["CT", "CG"], region: "Central India", image: "/images/states/chhattisgarh-hero.jpg", crafts: ["Bastar Dokra", "Bell Metal", "Wrought Iron Craft"], giTagsCount: 0 },
  { id: "GA", name: "Goa", slug: "goa", filterCodes: ["GA"], region: "West India", image: "/images/states/goa-hero.jpg", crafts: ["Kaavi Art", "Coconut Craft", "Crochet Lace"], giTagsCount: 0 },
  { id: "GJ", name: "Gujarat", slug: "gujarat", filterCodes: ["GJ"], region: "West India", image: "/images/states/gujarat-hero.jpg", crafts: ["Patola", "Bandhani", "Kutch Embroidery"], giTagsCount: 0 },
  { id: "HR", name: "Haryana", slug: "haryana", filterCodes: ["HR"], region: "North India", image: "/images/states/haryana-hero.jpg", crafts: ["Panipat Durries", "Phulkari", "Terracotta Craft"], giTagsCount: 0 },
  { id: "HP", name: "Himachal Pradesh", slug: "himachal-pradesh", filterCodes: ["HP"], region: "North India", image: "/images/states/himachal-pradesh-hero.jpg", crafts: ["Kullu Shawls", "Chamba Rumal", "Wood Carving"], giTagsCount: 0 },
  { id: "JH", name: "Jharkhand", slug: "jharkhand", filterCodes: ["JH"], region: "East India", image: "/images/states/jharkhand-hero.jpg", crafts: ["Sohrai Painting", "Dokra Metalwork", "Bamboo Craft"], giTagsCount: 0 },
  { id: "KA", name: "Karnataka", slug: "karnataka", filterCodes: ["KA"], region: "South India", image: "/images/states/karnataka-hero.jpg", crafts: ["Channapatna Toys", "Mysore Silk", "Sandalwood Carving"], giTagsCount: 0 },
  { id: "KL", name: "Kerala", slug: "kerala", filterCodes: ["KL"], region: "South India", image: "/images/states/kerala-hero.jpg", crafts: ["Kasavu Weave", "Aranmula Kannadi", "Coir Craft"], giTagsCount: 0 },
  { id: "MP", name: "Madhya Pradesh", slug: "madhya-pradesh", filterCodes: ["MP"], region: "Central India", image: "/images/states/madhya-pradesh-hero.jpg", crafts: ["Gond Painting", "Bagh Print", "Chanderi Weave"], giTagsCount: 0 },
  { id: "MH", name: "Maharashtra", slug: "maharashtra", filterCodes: ["MH"], region: "West India", image: "/images/states/maharashtra-hero.jpg", crafts: ["Paithani", "Warli Art", "Sawantwadi Lacquerware"], giTagsCount: 0 },
  { id: "MN", name: "Manipur", slug: "manipur", filterCodes: ["MN"], region: "North East India", image: "/images/states/manipur-hero.jpg", crafts: ["Manipuri Weaving", "Kauna Craft", "Bamboo Work"], giTagsCount: 0 },
  { id: "ML", name: "Meghalaya", slug: "meghalaya", filterCodes: ["ML"], region: "North East India", image: "/images/states/meghalaya-hero.jpg", crafts: ["Cane and Bamboo", "Eri Silk", "Khasi Weaving"], giTagsCount: 0 },
  { id: "MZ", name: "Mizoram", slug: "mizoram", filterCodes: ["MZ"], region: "North East India", image: "/images/states/mizoram-hero.jpg", crafts: ["Puan Weaving", "Bamboo Craft", "Wood Carving"], giTagsCount: 0 },
  { id: "NL", name: "Nagaland", slug: "nagaland", filterCodes: ["NL"], region: "North East India", image: "/images/states/nagaland-hero.jpg", crafts: ["Naga Textiles", "Bamboo Craft", "Wood Carving"], giTagsCount: 0 },
  { id: "OD", name: "Odisha", slug: "odisha", filterCodes: ["OR", "OD"], region: "East India", image: "/images/states/odisha-hero.jpg", crafts: ["Pattachitra", "Cuttack Filigree", "Sambalpuri Ikat"], giTagsCount: 0 },
  { id: "PB", name: "Punjab", slug: "punjab", filterCodes: ["PB"], region: "North India", image: "/images/states/punjab-hero.jpg", crafts: ["Phulkari", "Punjabi Jutti", "Wood Inlay"], giTagsCount: 0 },
  { id: "RJ", name: "Rajasthan", slug: "rajasthan", filterCodes: ["RJ"], region: "West India", image: "/images/states/rajasthan-hero.jpg", crafts: ["Jaipur Blue Pottery", "Sanganeri Print", "Kathputli"], giTagsCount: 0 },
  { id: "SK", name: "Sikkim", slug: "sikkim", filterCodes: ["SK"], region: "North East India", image: "/images/states/sikkim-hero.jpg", crafts: ["Thangka Painting", "Wool Weaving", "Wood Carving"], giTagsCount: 0 },
  { id: "TN", name: "Tamil Nadu", slug: "tamil-nadu", filterCodes: ["TN"], region: "South India", image: "/images/states/tamil-nadu-hero.jpg", crafts: ["Kanchipuram Silk", "Thanjavur Painting", "Bronze Casting"], giTagsCount: 0 },
  { id: "TG", name: "Telangana", slug: "telangana", filterCodes: ["TG", "TS"], region: "South India", image: "/images/states/telangana-hero.jpg", crafts: ["Pochampally Ikat", "Bidriware", "Cheriyal Scrolls"], giTagsCount: 0 },
  { id: "TR", name: "Tripura", slug: "tripura", filterCodes: ["TR"], region: "North East India", image: "/images/states/tripura-hero.jpg", crafts: ["Bamboo Craft", "Cane Work", "Handloom"], giTagsCount: 0 },
  { id: "UP", name: "Uttar Pradesh", slug: "uttar-pradesh", filterCodes: ["UP"], region: "North India", image: "/images/states/uttar-pradesh-hero.jpg", crafts: ["Banarasi Brocade", "Lucknow Chikankari", "Moradabad Brass"], giTagsCount: 0 },
  { id: "UA", name: "Uttarakhand", slug: "uttarakhand", filterCodes: ["UA", "UK"], region: "North India", image: "/images/states/uttarakhand-hero.jpg", crafts: ["Aipan Art", "Ringaal Bamboo", "Wool Weaving"], giTagsCount: 0 },
  { id: "WB", name: "West Bengal", slug: "west-bengal", filterCodes: ["WB"], region: "East India", image: "/images/states/west-bengal-hero.jpg", crafts: ["Baluchari Silk", "Dokra Craft", "Bengal Kantha"], giTagsCount: 0 },
  { id: "AN", name: "Andaman and Nicobar Islands", slug: "andaman-and-nicobar-islands", filterCodes: ["AN"], region: "Islands", image: "/images/states/andaman-and-nicobar-islands-hero.jpg", crafts: ["Coconut Craft", "Shell Craft", "Cane Work"], giTagsCount: 0 },
  { id: "CH", name: "Chandigarh", slug: "chandigarh", filterCodes: ["CH"], region: "North India", image: "/images/states/chandigarh-hero.jpg", crafts: ["Phulkari", "Punjabi Jutti", "Contemporary Craft"], giTagsCount: 0 },
  { id: "DN", name: "Dadra and Nagar Haveli and Daman and Diu", slug: "dadra-and-nagar-haveli-and-daman-and-diu", filterCodes: ["DN", "DD"], region: "West India", image: "/images/states/dadra-and-nagar-haveli-and-daman-and-diu-hero.jpg", crafts: ["Warli Art", "Bamboo Craft", "Coir Work"], giTagsCount: 0 },
  { id: "DL", name: "Delhi", slug: "delhi", filterCodes: ["DL"], region: "North India", image: "/images/states/delhi-hero.jpg", crafts: ["Zardozi", "Metal Inlay", "Contemporary Craft"], giTagsCount: 0 },
  { id: "JK", name: "Jammu and Kashmir", slug: "jammu-and-kashmir", filterCodes: ["JK"], region: "North India", image: "/images/states/jammu-and-kashmir-hero.jpg", crafts: ["Pashmina Shawls", "Kashmiri Walnut Wood", "Papier-Mâché"], giTagsCount: 0 },
  { id: "LA", name: "Ladakh", slug: "ladakh", filterCodes: ["LA"], region: "North India", image: "/images/states/ladakh-hero.jpg", crafts: ["Pashmina", "Thangka Painting", "Wool Weaving"], giTagsCount: 0 },
  { id: "LD", name: "Lakshadweep", slug: "lakshadweep", filterCodes: ["LD"], region: "Islands", image: "/images/states/lakshadweep-hero.jpg", crafts: ["Coir Craft", "Coconut Craft", "Handwoven Mats"], giTagsCount: 0 },
  { id: "PY", name: "Puducherry", slug: "puducherry", filterCodes: ["PY"], region: "South India", image: "/images/states/puducherry-hero.jpg", crafts: ["Handmade Paper", "Terracotta", "Textile Printing"], giTagsCount: 0 },
]

export const INDIA_STATE_BY_NAME = new Map(INDIA_STATE_DATA.map((state) => [state.name.toLowerCase(), state]))
