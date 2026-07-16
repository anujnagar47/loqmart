<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LoqMart Project Notes

## Project Overview
- Full-stack production-grade web application for "LoqMart", an Indian multi-vendor marketplace
- Two primary commerce modes: Handmade and Machine-Made
- Must strictly follow STRICT DESIGN.HTML for all designs
- Phase 4 tech requirements from loqmart_phase4_tech.pdf

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## Design Reference
- STRICT DESIGN.HTML located at `C:\Users\pushp\Downloads\LOQMART\STRICT DESIGN.HTML`
- Key color tokens from design:
  - primary: #725c00
  - primary-container: #fcd020
  - on-primary-fixed: #231b00
  - on-surface: #1a1c1c
  - on-surface-variant: #4d4632
  - surface-container-lowest: #ffffff
  - surface-container: #eeeeee
  - surface-container-low: #f3f3f3
  - outline-variant: #d0c6ac
  - on-secondary-fixed-variant: #474746

## Design Guidelines
1. Remove ALL emojis from the codebase (user explicitly stated it "looks AI generated")
2. Use Material Design-style color tokens (surface-container, primary-container, etc.)
3. Typography: Use Inter font, tracking-tight for headings, tracking-widest for labels
4. Border radius: DEFAULT=0.125rem, lg=0.25rem, xl=0.5rem, full=0.75rem

## Completed Components (Redesigned to match STRICT DESIGN.HTML)
- header.tsx - Yellow header with navigation, search, cart
- hero.tsx - "PRECISION UTILITY" hero section
- footer.tsx - Clean footer with links and copyright
- product-card.tsx - Product cards with aspect-[4/5], hover effects
- category-grid.tsx - Grid layout for categories
- featured-products.tsx - Product grid section
- trust-bar.tsx - Trust badges section
- editorial-section.tsx - Philosophy/editorial section

## Pages
- Homepage (/) - Hero, TrustBar, CategoryGrid, FeaturedProducts, IndiaMap, SellerSpotlight, EditorialSection
- Category (/category) - With filters and mode toggle
- Product (/product/[slug]) - Product detail page
- Cart (/cart) - Shopping cart
- Checkout (/checkout) - Checkout flow
- India Map (/india-map) - Interactive SVG map of India
- State (/state/[stateId]) - State-specific page
- Seller Register (/seller/register) - Seller registration
- Seller Dashboard (/seller/dashboard) - Seller dashboard
- Admin (/admin) - Admin panel
- Account (/account) - User account

## Key Technologies
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS 4
- Framer Motion (for animations)
- Zustand (for state management)
- Supabase (for backend)

## Database
- Supabase PostgreSQL schema at `supabase/schema.sql`
- Tables: users, sellers, products, categories, orders, reviews, states, swadeshi_ranks, etc.
- RLS (Row Level Security) policies enabled
- Triggers for automatic Swadeshi Rank calculation

## Notes
- Icons from lucide-react (NOT Material Symbols Outlined)
- Facebook, Twitter, Instagram, YouTube icons NOT in lucide-react - need custom SVG
- Remove checkmarks and emoji-like characters from UI
- Use HTML entities like &#10003; for check marks if needed
