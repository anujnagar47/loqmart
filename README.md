# LoqMart - India's Multi-Vendor Marketplace

A full-stack production-grade web application for LoqMart, an Indian multi-vendor marketplace with two primary commerce modes: **Handmade** and **Machine-Made**.

![LoqMart Banner](https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=1200&h=400&fit=crop)

## Features

### Core Commerce
- **Product Listing** - Full catalog with filtering, sorting, and search
- **Shopping Cart** - Persistent cart with quantity management
- **Checkout Flow** - Multi-step checkout with Razorpay integration
- **Order Management** - Complete order lifecycle tracking

### Seller Features
- **Vendor Registration** - Multi-step onboarding flow
- **Seller Dashboard** - Analytics, orders, and product management
- **Swadeshi Rank** - Trust scoring system based on multiple factors
- **LoqCoin System** - Earn and redeem loyalty points

### Admin Features
- **Admin Dashboard** - Overview of marketplace metrics
- **Seller Approvals** - Review and approve new sellers
- **Product Moderation** - Quality control for product listings
- **State-wise Analytics** - GMV tracking by state

### Discovery
- **India Map Explorer** - Interactive SVG map with 29 states
- **State Pages** - Regional landing pages with local crafts
- **Category Browsing** - Handmade vs Machine-Made toggle
- **Featured Products** - Curated product selections

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (Auth, Database, Storage)
- **Payments**: Razorpay integration
- **State Management**: Zustand

## Design System

Following the STRICT DESIGN.HTML specifications:
- Primary color: `#fcd020` (Golden Yellow)
- Surface containers with Material Design 3 principles
- Inter font family throughout
- Consistent spacing and typography scale

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Razorpay account (for payments)

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-username/loqmart.git
cd loqmart
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment files**
```bash
cp .env.example .env.local
```

4. **Configure environment variables**

Edit `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Razorpay Configuration
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down the API URL and keys

2. **Run the Schema**
   - Go to Supabase SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute the SQL

3. **Enable Row Level Security**
   - The schema includes RLS policies
   - Test authentication flows

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
loqmart/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── account/           # User dashboard
│   │   ├── admin/            # Admin panel
│   │   ├── cart/             # Shopping cart
│   │   ├── category/         # Product listing
│   │   ├── checkout/         # Checkout flow
│   │   ├── india-map/        # India map explorer
│   │   ├── product/          # Product detail
│   │   ├── seller/           # Seller dashboard & registration
│   │   ├── state/           # State pages
│   │   └── page.tsx          # Homepage
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── header.tsx        # Navigation header
│   │   ├── footer.tsx        # Footer
│   │   ├── hero.tsx          # Homepage hero
│   │   ├── india-map.tsx     # Interactive India map
│   │   ├── category-grid.tsx # Category display
│   │   ├── featured-products.tsx
│   │   ├── product-card.tsx   # Product card component
│   │   ├── trust-bar.tsx      # Trust indicators
│   │   ├── seller-spotlight.tsx
│   │   └── editorial-section.tsx
│   ├── lib/
│   │   ├── utils.ts          # Utility functions
│   │   ├── store.ts          # Zustand stores
│   │   └── supabase/         # Supabase clients
│   ├── types/
│   │   └── database.ts        # TypeScript interfaces
│   └── app/
│       ├── globals.css        # Global styles
│       └── layout.tsx        # Root layout
├── supabase/
│   └── schema.sql             # Database schema
├── public/                    # Static assets
├── .env.example              # Environment template
└── package.json
```

## Database Schema

### Core Tables
- `users` - User accounts with roles (buyer, seller, admin)
- `sellers` - Seller profiles with business details
- `products` - Product catalog with approval workflow
- `categories` - Product categories (handmade/machine_made)
- `orders` - Order management
- `order_items` - Individual order items

### Commerce Tables
- `addresses` - User delivery addresses
- `carts` & `cart_items` - Shopping cart
- `payments` - Payment records
- `reviews` - Product reviews
- `wishlists` - User wishlists

### LoqMart Specific
- `loqcoin_balances` - User coin balances
- `loqcoin_ledger` - Immutable transaction log
- `swadeshi_rank_history` - Trust score history
- `seller_approvals` - Seller approval workflow
- `product_approvals` - Product approval workflow
- `coupons` - Discount coupons

## Key Features Explained

### Swadeshi Rank
Trust scoring system (0-100) calculated from:
- Average product rating
- On-time delivery percentage
- Return/cancellation rate
- Years in business
- Document verification status

### LoqCoin System
- Ledger-based (immutable transactions)
- Earn coins on purchases and reviews
- Redeem on checkout
- Expiration handling
- Admin adjustment capability

### Product Approval Flow
1. Seller creates product → `pending`
2. Admin reviews → `approved` or `rejected`
3. Approved products become publicly visible

### India Map
- Interactive SVG with all 29 states
- Hover tooltips with state info
- Click to state page
- Handmade vs Machine-Made toggle

## Scripts

```bash
# Development
npm run dev

# Production Build
npm run build

# Start Production Server
npm start

# Linting
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Railway
- Render
- AWS Amplify
- Google Cloud Run

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspired by STRICT DESIGN.HTML specifications
- Craft imagery from Unsplash
- Icons from Lucide React
- Built with Next.js, Tailwind CSS, and Supabase

## Support

For support, email support@loqmart.in or join our Discord channel.

---

**LoqMart** - Celebrating the best of India, one product at a time.
