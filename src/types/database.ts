export type UserRole = "buyer" | "seller" | "admin"

export type ProductMode = "handmade" | "machine_made"

export type ApprovalStatus = "pending" | "approved" | "rejected"

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export type CoinTransactionType = "earn" | "redeem" | "expire" | "admin_adjustment" | "refund"

export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Seller {
  id: string
  user_id: string
  business_name: string
  owner_name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  address: string | null
  state_code: string | null
  city: string | null
  pincode: string | null
  gstin: string | null
  pan: string | null
  bank_account_number: string | null
  bank_ifsc: string | null
  approval_status: ApprovalStatus
  swadeshi_rank: number
  swadeshi_score: number
  total_products: number
  total_orders: number
  total_earnings: number
  total_coins_earned: number
  created_at: string
  updated_at: string
  user?: User
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  image_url: string | null
  parent_id: string | null
  mode: ProductMode
  product_count: number
  created_at: string
}

export interface State {
  id: string
  name: string
  code: string
  region: string
  description: string | null
  banner_url: string | null
  artisan_count: number
  product_count: number
  loqcoin_bonus: number
  featured_sellers: string[]
  created_at: string
}

export interface Product {
  id: string
  seller_id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  price: number
  mrp: number | null
  stock: number
  unit: string
  images: string[]
  mode: ProductMode
  approval_status: ApprovalStatus
  state_code: string | null
  tags: string[]
  specifications: Record<string, string>
  rating: number
  review_count: number
  sold_count: number
  swadeshi_rank?: number
  is_featured?: boolean
  created_at: string
  updated_at: string
  seller?: Seller
  category?: Category
}

export interface Address {
  id: string
  user_id: string
  name: string
  phone: string
  address_line1: string
  address_line2: string | null
  landmark: string | null
  city: string
  state: string
  state_code: string
  pincode: string
  is_default: boolean
  address_type: "home" | "work" | "other"
  created_at: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Product
}

export interface Order {
  id: string
  user_id: string
  seller_id: string
  address_id: string
  order_number: string
  subtotal: number
  shipping_cost: number
  tax: number
  discount: number
  coins_used: number
  coins_discount: number
  total: number
  order_status: OrderStatus
  payment_status: PaymentStatus
  payment_id: string | null
  razorpay_order_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  address?: Address
  items?: OrderItem[]
  user?: User
  seller?: Seller
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  total: number
  created_at: string
  product?: Product
}

export interface Review {
  id: string
  order_id: string
  order_item_id: string
  product_id: string
  user_id: string
  rating: number
  title: string | null
  comment: string | null
  images: string[]
  is_verified: boolean
  helpful_count: number
  created_at: string
  updated_at: string
  user?: User
}

export interface LoqCoinBalance {
  id: string
  user_id: string
  balance: number
  lifetime_earned: number
  lifetime_redeemed: number
  updated_at: string
}

export interface LoqCoinLedger {
  id: string
  user_id: string
  transaction_type: CoinTransactionType
  amount: number
  balance_after: number
  source: "purchase" | "review" | "referral" | "promotion" | "checkout" | "admin" | "expiry" | "refund"
  reference_id: string | null
  reference_type: "order" | "review" | "user" | null
  description: string
  expires_at: string | null
  created_at: string
}

export interface SwadeshiRankHistory {
  id: string
  seller_id: string
  rank: number
  score: number
  factors: Record<string, number>
  calculated_at: string
}

export interface SellerApproval {
  id: string
  seller_id: string
  approved_by: string | null
  status: ApprovalStatus
  reason: string | null
  documents: string[]
  reviewed_at: string | null
  created_at: string
}

export interface ProductApproval {
  id: string
  product_id: string
  approved_by: string | null
  status: ApprovalStatus
  reason: string | null
  reviewed_at: string | null
  created_at: string
}
