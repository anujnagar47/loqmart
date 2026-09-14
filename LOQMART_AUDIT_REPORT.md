# LoqMart — Full Application Audit Report

**Date:** 2026-09-06
**Scope:** Full-repo audit-only pass (no code, schema, or data was modified). Covers architecture, build health, customer/seller/admin flows, Supabase (schema/RLS), authentication, Razorpay payments, security, performance, SEO, responsiveness/UX, e-commerce completeness, and fake/mocked functionality.

**Method note (read this before the findings):** This audit combines three kinds of evidence, labeled inline:
- **[Code-traced]** — I read the component/route source and followed the handler to its actual effect (API call → DB write, or nothing).
- **[Live-verified]** — confirmed by actually running a command against the live repo (`npm run build`, `npm run lint`, `npx tsc`, `npm test`, `curl` against the running dev server).
- **[Static]** — inferred from source without a live run (e.g. RLS policy text, schema definitions).

I do **not** have a browser-automation tool in this environment, so no finding claims "I clicked this button in a browser and watched it happen." Every UI-behavior claim below is a direct trace of the onClick/onSubmit handler to its real effect, which is the reliable way to answer "does this actually do anything" for a codebase of this size — but it means purely visual/CSS rendering bugs (overlap, clipping, animation jank) were **not** independently observed and are flagged as a gap in section 18.

---

## 1. Executive Summary

LoqMart is considerably further along than a typical AI-scaffolded demo. Checkout, order creation, seller product management, and the entire admin approval workflow are genuinely wired to Supabase with real reads/writes, sensible ownership checks, and mostly good error handling. The admin role gate is implemented in three independent layers (middleware, layout, per-route `requireAdmin()`), which is a stronger pattern than most projects at this stage bother with.

That said, this is **not launch-ready**, and the gaps are not cosmetic:

- One database RLS policy allows **any logged-in buyer to promote themselves to admin** by calling Supabase directly with the public anon key (Finding S-1). This is the single most severe issue in the audit.
- The **Contact Us form and the Grievance Redressal form are both entirely fake** — clicking submit shows a "Message Sent" / ticket-confirmation screen with a fabricated ticket ID, but there is no API route, no database write, and no email behind either one. The message is silently discarded. The Grievance page explicitly cites obligations under the Consumer Protection (E-Commerce) Rules 2020 and promises a Nodal Officer response within 48 hours — none of which the code can actually deliver.
- There is **no way for a customer to request a return or refund anywhere in the UI**, despite the dedicated `/returns` policy page explicitly instructing users to do exactly that from My Orders. Admins can process returns that already exist in the database, but nothing ever creates one from the buyer side.
- The checkout success page **fabricates a brand-new, different order number** instead of showing the real one the API just returned — it never reads the `?order=` query param and instead computes a fresh `LM${Date.now()...}` on render, guaranteed to mismatch the actual order in the database.
- The `payments` table has **no RLS at all**.
- The checkout API never verifies that the `address_id` it's given belongs to the calling user — a straightforward IDOR.
- Promo codes are validated and shown as a discount in the UI, but **the actual charge amount never applies the discount** — customers see one number and are charged another, and their code is burned regardless.
- The shopping cart is 100% client-side (`localStorage` via Zustand); the `carts`/`cart_items` tables described in the README don't participate in the app at all, and `carts` itself has no RLS.
- The wishlist/like heart button works correctly on the product detail page but is a **pure visual no-op everywhere else** — every product card (homepage, category, search, best-sellers, new, seller storefronts) and the homepage state feed's "like" button toggle local state and touch nothing in the database.
- Three separate pages (survey milestones, seller approval x2) promise **automatic email notifications**, but there is no email-sending integration anywhere in the codebase — these events are only ever written to the database, with no way for the user to actually learn about them via email.
- The one existing test file cannot run at all (no `vitest.config` resolving the `@/*` path alias) — effective test coverage is zero.
- A `sub_admin` can promote themselves (or anyone) to full `admin` through the same user-management endpoint full admins use.

None of this means the foundation is bad — it means there's a clear, boundable punch list before this can safely take real money and real user data. Sections 23–26 rank everything by severity; section 27 proposes a sequencing.

---

## 2. Current Architecture

```
Browser
  │
  ├─ Next.js 16 App Router (React 19, TypeScript, Tailwind 4)
  │    ├─ Server Components (admin/layout.tsx, seller/commission, etc.) — direct Supabase server/service calls
  │    ├─ Client Components ("use client") — majority of pages (product, checkout, cart, dashboards)
  │    │     └─ Zustand stores (src/lib/store.ts) — cart + UI-mode, persisted to localStorage only
  │    └─ src/middleware.ts — session-presence gate for /account, /checkout, /seller/dashboard, /seller/register, /admin
  │
  ├─ API Routes (src/app/api/**, ~60 route.ts files)
  │    ├─ Public reads: products, categories, blog, states (no auth required)
  │    ├─ Authenticated: checkout, user/*, seller/*, promo/*, products/[slug]/reviews
  │    ├─ Admin-gated: admin/** — all funnel through requireAdmin() (src/lib/admin-auth.ts)
  │    └─ Webhooks: orders/webhook/razorpay (HMAC signature), logistics/webhook (shared-secret header)
  │
  ├─ Supabase
  │    ├─ Auth — phone OTP (custom /api/auth/request-otp + verify-otp) + Supabase session cookies
  │    ├─ Postgres — 25+ tables, RLS enabled on most (several notable exceptions, see §12)
  │    ├─ Storage — 5 buckets (product-images, seller-assets, seller-documents [private], blog-images, user-avatars)
  │    └─ service-role client (src/lib/supabase/admin.ts) — used heavily server-side to bypass RLS; never imported client-side (verified)
  │
  └─ Razorpay — order creation server-side (src/app/api/checkout), client-side Checkout.js widget, webhook confirms payment
```

**Two Supabase client patterns are used throughout, correctly separated:**
- `src/lib/supabase/client.ts` — browser client (anon key), used in "use client" components for session-aware reads (wishlist, product detail) subject to RLS.
- `src/lib/supabase/server.ts` — server client (anon key + cookies), used for `auth.getUser()` — server-validated, not spoofable.
- `src/lib/supabase/admin.ts` — service-role client, bypasses RLS entirely; confirmed **never** imported into any `"use client"` file (no service-key leakage to the browser bundle).

This means RLS is, in practice, a *secondary* defense for most of the app — the primary enforcement is the application-code checks in API routes (`requireAdmin()`, seller `user_id` ownership checks). That pattern is fine, but it makes RLS bugs dangerous specifically for the code paths that talk to Supabase directly from the browser (wishlist, product-detail auth check, any future direct client query) — which is exactly where Finding S-1 lives.

---

## 3. Application Health (commands actually run)

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit` | **Clean, 0 errors** [Live-verified] | |
| `npm run build` | **Succeeds** [Live-verified] | All ~115 routes compile; static/dynamic split looks correct (dashboards and API routes are dynamic `ƒ`, marketing/content pages are static `○`) |
| `npm run lint` | **238 problems: 176 errors, 62 warnings** [Live-verified] | Zero blocking type errors, but a large `@typescript-eslint/no-explicit-any` backlog, several `react/no-unescaped-entities`, one `react-hooks/set-state-in-effect`, and ~10 `<img>`-instead-of-`next/image` warnings. Root-level debug scripts (`test-*.js`, `verify-db.js`) fail `no-require-imports` — these aren't part of the app bundle but are lint-dirty and shouldn't ship in the repo root long-term. |
| `npm test` (vitest) | **1 suite, 0 tests, FAILS** [Live-verified] | `__tests__/api-auth-request-otp.test.ts` cannot even load: `Cannot find package '@/lib/supabase/server'`. There is **no `vitest.config.*` file in the repo**, so the `@/*` path alias from `tsconfig.json` is never wired into the test runner. Effective automated test coverage: **zero**. |
| `npm install` | Not re-run (node_modules present, dev server already running) | |

**Severity:** The broken test infra is P1 — not because 1 failing test blocks anything today, but because it means there is currently no safety net at all for regressions in checkout, payments, or auth as the app evolves.

---

## 4–8. Working / Partial / Broken / UI-only / Mocked — Summary

(Full detail in the Feature Matrix, §22, and the Fake-Functionality section, §16.)

**Genuinely working, backend-connected [Code-traced]:**
- Product catalog, categories, states — real DB reads, no hardcoded product data.
- Cart (client-side only, but internally consistent — add/remove/update-qty/clear all work against Zustand state).
- Checkout order creation — server recomputes price from DB (`products.price`), never trusts client-sent price; stock deduction uses an optimistic `.gte("stock", qty)` guard against overselling.
- Razorpay order creation + webhook-driven payment confirmation, LoqCoin award, notification, optional Shiprocket shipment creation.
- Product reviews — verified-purchase check, self-review block, duplicate-review block, rating recalculation, LoqCoin award, all real.
- Seller product CRUD, image upload to Supabase Storage, stock editing, order visibility — all ownership-scoped to the session's own seller row, not a URL param.
- Seller registration → admin approval → role promotion pipeline — real, with notifications and audit logging.
- Admin approve/reject for sellers and products (from the Overview queue), order status management, returns, penalties, reviews moderation, categories, blog, commission settings, platform settings, audit log viewer — all real DB operations behind `requireAdmin()`.
- Wishlist — real on the **product detail page only** (writes to `wishlists` table).

**Partially working [Code-traced]:**
- Wishlist on every product-card-based surface (homepage, category grid, search results, featured products) — visual toggle only, never persisted (§16, Finding F-1).
- Seller earnings/commission math — uses a hardcoded 10%/2% rate instead of the seller's actual `commission_settings` override, so sellers with a negotiated custom rate see incorrect numbers on their own dashboard.
- Admin product approve/reject from `/admin/products` uses a different code path than from `/admin` overview, and silently skips the notification + audit-log write the "official" approve/reject routes perform.
- OTP-based auth has a dev-mode fallback that reports "OTP sent" without actually sending one when Supabase/SMS isn't configured — misleading in dev, inert in production.

**Broken / non-functional [Code-traced + Live-verified]:**
- Promo code discount is never applied to the amount actually charged (Finding P-1, below) — this is a customer-facing correctness bug, not just missing polish.
- Contact Us form — `handleSubmit` only does `e.preventDefault(); setSent(true)`; no fetch, no API route exists, message is discarded and the success screen is unconditional.
- Grievance Redressal form — identical pattern; fabricates a client-side `GR${Date.now()}` ticket ID that is never persisted or transmitted anywhere, despite citing statutory response-time obligations.
- Checkout success page — never reads the real `order_id`/`order_number` passed via the URL; computes a new fake order number and reconstructs the "summary" from the local cart store instead of the actual placed order.
- Test suite (0 runnable tests).
- Finance → Settlements admin page has no way to create a settlement from the UI; empty-state copy references running a missing-tables SQL script manually.

**Missing entirely, contradicting the app's own copy [Code-traced]:**
- Customer-initiated return/refund request — the `/returns` policy page tells users to do this from My Orders; no button, no API route, no way to originate one exists.
- Email notifications — survey milestone codes and seller-approval status changes are both advertised as emailed to the user; no email provider is wired into the backend anywhere.

**UI-only / no-op [Code-traced]:**
- `onWishlist` prop on `ProductCard` — declared, called, never passed by any of its 8 call sites (category, category/[slug], state, best-sellers, new, seller storefront, product page rails, featured-products).
- Homepage state-feed "like" heart — same pattern, local `useState` only, verified separately from the product-card instances.
- LoqCoin redemption at checkout — the LoqCoins page tells users "Apply LoqCoins at checkout," but the checkout page has no redemption UI or logic at all (Finding P-2).
- "Explore the Process" homepage CTA button — animated but has no `onClick`/`href` at all.

**Mocked/static [Code-traced]:**
- Delivery-estimate check on the product page (`checkDelivery()`) fabricates a delivery window using `Math.random()` regardless of the pincode entered — not connected to any real logistics/serviceability API.
- Admin analytics KPI trend arrows (up/flat) are hardcoded, not computed from period-over-period deltas.
- Homepage hero stats ("10,000+ Products," "500+ Verified Sellers," etc.) are a static hardcoded array animated as an up-counter — not queried from the database, so they don't reflect actual platform size.
- Contact page's company registration details (CIN, WhatsApp number, toll-free number) read as placeholder/fabricated values rather than real, verifiable business information.

---

## 9. Customer Flow Results

| Step | Result |
|---|---|
| Browse homepage → category → state | Works, real DB-backed data [Code-traced] |
| Search | Real — submits to `/category?search=` and filters server-side via API params [Code-traced] |
| Filters / sort | Real, wired to API query params (`sortMap`) [Code-traced] |
| Product detail — gallery, seller info, reviews | Real, fetched via `/api/products/[slug]` with joined seller + reviews [Code-traced] |
| Add to cart / update qty / remove | Works (client-side Zustand + localStorage) [Code-traced] |
| Wishlist (product page) | Works, real Supabase read/write [Code-traced] |
| Wishlist (everywhere else) | **No-op** — see Finding F-1 [Code-traced] |
| Login/signup (phone OTP) | Works when SMS provider configured; **silently fake-succeeds in dev without one** [Code-traced] |
| Address entry at checkout | Real — POSTs to `/api/user/addresses`, persisted [Code-traced] |
| Promo code apply | UI applies and displays a discount; **discount never reaches the actual charge** — Finding P-1 [Code-traced] |
| Payment (Razorpay) | Real order + signature-verified webhook confirms payment [Code-traced] |
| Payment (COD) | Order created with `payment_status: pending`; no separate COD confirmation/fulfillment step visible beyond the base order-status flow |
| Order confirmation / success page | **Fake order number** — never reads the real `order_id`/`order_number` from the URL; fabricates a new `LM${Date.now()...}` on render that will not match the real order (Finding, §16) [Code-traced] |
| Order history / detail (account page) | Real, reads `orders`/`order_items` scoped to the session user [Code-traced] |
| Order tracking number | Displayed if Shiprocket integration populated it; no live tracking widget, just the raw AWB string |
| **Order cancellation (customer-initiated)** | **Not found anywhere in the customer-facing UI** — only admin-side order-status editing and admin-side returns exist. |
| **Return/refund request (customer-initiated)** | **Confirmed missing.** `/app/returns/page.tsx` explicitly tells users to do this from My Orders; no button exists there, and no public API route can create a `return_requests` row — only `/admin/returns` (admin-only) can manage one that already exists. |
| Contact support form | **Fake.** `handleSubmit` sets a "sent" flag with no fetch/API call; no `/api/contact` route exists; message is discarded. |
| Grievance/complaint form | **Fake**, and cites Consumer Protection (E-Commerce) Rules 2020 obligations it cannot fulfill; fabricates a client-side ticket ID that is never persisted. |
| Logged-out access to `/account`, `/checkout` | Redirects to `/auth?next=...` via middleware [Code-traced] |
| Empty cart at checkout | Explicit empty-state UI shown [Code-traced] |
| Out-of-stock / insufficient stock | Server rejects with 400 `"Insufficient stock for: <name>"` before order creation [Code-traced] |

---

## 10. Seller Flow Results

All items below are **A (fully functional)** unless noted, per direct code trace (full detail from the dedicated audit agent's pass, verified against the source myself for the checkout/payments-adjacent pieces):

- Registration → pending → admin review → approval → role promotion to `seller`: real, end-to-end.
- Dashboard Overview/Orders/Products/Analytics/Settings tabs: real DB-backed, correctly scoped to the session's own `sellers.id` (resolved from `user_id`, never from a URL param — no IDOR here).
- Add/Edit/Delete product: real, with ownership checks and a "delete blocked while active orders exist" guard.
- Image upload: real Supabase Storage upload, client-side validates file type (`accept="image/jpeg,image/png,image/webp"`) and 10MB size cap; server-side bucket config also enforces size/MIME. **However**, the Storage RLS policy for the `product-images`/`seller-assets` buckets only checks "caller is *a* seller," not "caller owns *this specific file*" — any seller can overwrite or delete another seller's images by guessing/obtaining the path (Finding S-3).
- Earnings/commission: **B (partial)** — real revenue totals, but fee breakdown uses a hardcoded 10%/2% rate rather than each seller's actual override.
- Can a seller reach another seller's private dashboard data? **No** — identity is resolved server-side from the session in every seller API route, never trusted from the URL.

---

## 11. Admin Flow Results

- Every `/admin/**` page is gated three times over: middleware (session presence), `admin/layout.tsx` (server-side role check via `users.role`, correctly using `auth.getUser()` not the spoofable `getSession()`), and every admin API route via `requireAdmin()`. This is a genuinely solid pattern — no admin page or admin API route was found reachable by a non-admin/non-sub_admin session.
- Seller/product approval, order management, returns, penalties, reviews moderation, trust/rank overrides, categories, blog, commission, platform settings, notifications broadcast, audit log viewer: all real DB operations.
- **Sub_admin privilege escalation (Finding S-6):** `PATCH /api/admin/users/[userId]` is gated by `requireAdmin()` (admin **or** sub_admin) and allows changing the `role` field with no restriction — a sub_admin can promote themselves (or anyone) to full `admin`.
- **State-scope is decorative (Finding S-7):** `sub_admin` accounts have a `state_scope` field, and the UI explicitly tells operators a state-scoped sub-admin "can only manage sellers/products from that state" — but **no admin API route filters by `state_scope`** anywhere. A sub-admin scoped to one state currently has unrestricted nationwide access through the same endpoints.
- Admin Products page approve/reject uses a different, less-audited code path than the Overview queue's approve/reject (Finding — inconsistent audit trail, §16/§22).
- Finance → Settlements: read path is real, but there's no UI action to create a settlement (must be done outside the app).

---

## 12. Supabase Audit

**Admin role model:** No separate `is_admin` table/boolean — entirely driven by `users.role` (`buyer` / `seller` / `admin` / `sub_admin`). A `SECURITY DEFINER` function `is_admin_or_subadmin()` centralizes the check (needed because the original inline subquery on the `users` table's own policies caused infinite RLS recursion — this was fixed in a later patch file).

**Migration hygiene warning:** The `supabase/` directory contains overlapping, non-idempotent patch files (`schema.sql`, `admin-additions.sql`, `fix-product-visibility.sql`, `fix-rls-recursion.sql`, etc.) that redefine the *same* policies in sequence. The actual effective policy on a live project depends on the order these were run in Supabase's SQL editor — which cannot be fully verified from the filesystem alone. Findings below describe the **effective state if the files were run in the order implied by their names/content**; treat this section as "what the source implies," and verify directly against the live project's `pg_policies` before relying on it.

### Critical / High findings (full per-table detail available on request; ranked list below)

1. **CRITICAL — Self privilege escalation via `users` RLS.** The `"Users can update own profile"` UPDATE policy has `USING (auth.uid() = id)` and **no `WITH CHECK`**. Postgres reuses `USING` for the check when `WITH CHECK` is omitted, and since `id` itself can't be reassigned away from the caller, **every other column — including `role` — is left unrestricted**. Any authenticated user calling the Supabase client directly (`supabase.from('users').update({ role: 'admin' }).eq('id', myId)`) can self-promote to admin. This bypasses the app's own UI entirely since it's a direct database-client call using the public anon key + a valid session JWT — both of which are attacker-accessible by design.
   - **Compounding issue:** the `handle_new_user()` trigger (fires on signup) sets the new user's `role` directly from `raw_user_meta_data->>'role'`, which is **client-supplied** at `supabase.auth.signUp()` time. If the app's signup code path forwards a `role` field from client input into that metadata without stripping it, a brand-new signup could set `role: "admin"` directly. This needs to be checked against the actual signup client code as a same-priority follow-up.
2. **HIGH — `payments` table has RLS disabled, zero policies.** Contains Razorpay payment IDs, signatures, and amounts. If ever reached via the anon/authenticated client (not currently done by the app, but the table is sitting open), it's fully read/writable by anyone.
3. **HIGH — Storage bucket IDOR.** `product-images`/`seller-assets` write policies check "caller is a seller" but never check the object path belongs to that seller (unlike `user-avatars`/`seller-documents`, which correctly use a folder-per-user check). Any seller can overwrite/delete another seller's images.
4. **HIGH — Checkout `address_id` IDOR** (application-code, not RLS — checkout uses the service-role client, so RLS doesn't apply here anyway). `/api/checkout` never verifies the submitted `address_id` belongs to the authenticated user before attaching it to the new order.
5. **MEDIUM — Sellers can self-approve products / write columns they shouldn't.** The sellers' `ALL` policy on `products` scopes ownership correctly but doesn't restrict *which columns* a seller can change — `approval_status`, `is_featured`, `rating`, `sold_count` are all writable directly by the seller via the client SDK, bypassing the admin approval workflow if called outside the app's own UI.
6. **MEDIUM — "Verified purchase" reviews aren't actually enforced at the DB level.** An early policy required `is_verified = true` self-declared by the client (already weak); a later patch file (`fix-product-visibility.sql`) replaced it with a policy that drops that requirement entirely — any authenticated user can review any product without ever having purchased it, if calling the client SDK directly.
7. **MEDIUM — Several tables have no RLS at all:** `carts` (no RLS, no policy — fully open if ever touched directly), `swadeshi_rank_history`, `seller_approvals`, `product_approvals`. The app appears not to query these directly today, but they're live, unprotected surface area.
8. **LOW — Inconsistent `admin`-only vs `admin+sub_admin` scoping**, notably `admin_logs` (the audit trail itself) being readable by `sub_admin`, and `commission_settings` writes being widened to `sub_admin` in a later patch — both arguably should stay `admin`-only given sensitivity.
9. **LOW — `reviews.is_hidden` moderation flag has no RLS enforcement** — hidden/flagged reviews remain publicly visible via the blanket `USING (true)` SELECT policy.
10. **LOW — `calculate_swadeshi_rank(seller_id)` has a parameter/column name collision** (`WHERE seller_id = seller_id`), which is a correctness bug likely affecting whether rank scores are computed against the right seller's data.

**Order number generation** is done in application code, not the DB: `` `LM${Date.now()}` `` — predictable and collidable under concurrent requests within the same millisecond (would hard-fail on the `UNIQUE` constraint rather than silently corrupt, but has no retry logic).

**Storage buckets:** 5 total. Public-read is correctly open for `product-images`/`seller-assets`/`blog-images`/`user-avatars`; `seller-documents` is correctly private/admin-only-read. `user-avatars` and `seller-documents` correctly use folder-per-user path checks; `product-images`/`seller-assets` do not (see Finding 3 above).

---

## 13. Authentication Audit

- Auth is phone-based OTP via Supabase Auth (`signInWithOtp` / `verifyOtp`), not email/password.
- `request-otp` has an in-memory, per-process rate limiter (5 requests / 5 minutes / IP) — real but **ineffective across multiple server instances or serverless cold starts**, since the `Map` doesn't survive/share across processes.
- **`verify-otp` has no rate limiting or brute-force protection at all** — a 6-digit numeric OTP with unlimited verify attempts is a real account-takeover risk if Supabase's own throttling (unknown/unverified here) doesn't cover it.
- Dev-mode fallback: if Supabase OTP send fails and `NODE_ENV === 'development'`, the route returns a fake "OTP sent successfully" message and logs a hardcoded `123456` to the server console — this doesn't work as a real bypass (verify-otp still calls real Supabase verification), but it's a misleading dev-only stub that could confuse testing and should be clearly commented as non-functional or removed.
- Session validation server-side correctly uses `auth.getUser()` (JWT-validated) rather than the spoofable `auth.getSession()` in every security-sensitive spot I checked (middleware, admin layout, `requireAdmin()`).
- **No service-role key or Razorpay secret is ever imported into a client component** [Live-verified via grep] — a real positive.
- The `users` RLS self-escalation bug (§12, Finding 1) is, functionally, an authentication/authorization bypass and is the most serious authentication-adjacent finding in this audit.

---

## 14. Payment Audit (Razorpay)

- **Order amount is always recomputed server-side** from `products.price` in the DB — the client cannot manipulate the price by tampering with the checkout request body. This is the single most important thing to get right in a marketplace checkout, and it's done correctly.
- Razorpay order creation happens server-side (`/api/checkout`), using `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` from env — never exposed client-side.
- **Webhook signature verification is present** (HMAC-SHA256 comparison against `x-razorpay-signature`), but:
  - Uses a plain `!==` string comparison rather than a constant-time comparison (`crypto.timingSafeEqual`) — a timing-attack risk, low practical severity but worth fixing on a payment-critical path.
  - **If `RAZORPAY_WEBHOOK_SECRET` is unset, the code falls back to an empty string as the HMAC key** instead of failing closed. An attacker who notices the webhook is misconfigured could forge a valid signature and fake a `payment.captured` event, marking an unpaid order as paid and crediting LoqCoins.
- **Promo/discount is not applied to the actual charge (Finding P-1, high confidence, directly verified across two files):** the checkout page sends `promo_code` and `discount_amount` to `/api/checkout`, but the route's destructuring (`const { items, address_id, payment_method = "razorpay" } = body`) never reads either field, and no discount logic exists anywhere in the file. The Razorpay amount charged (`data.total * 100`) is the **undiscounted** server total. The promo code is still marked "used" via `/api/promo/redeem` after the order completes. Net effect: a customer who applies a promo code sees a discounted total on screen, is charged the full amount, and loses use of their code for zero benefit. This is a P0 — it's not just missing a feature, it actively misleads customers about the price they're paying.
- No duplicate-order-creation guard was found beyond the natural one-order-per-checkout-call flow; a double-click on "Place Order" before `isProcessing` disables the button could theoretically fire two `/api/checkout` calls (the button does set `disabled={isProcessing}`, which mitigates but doesn't eliminate a very fast double-click race before React re-renders).
- Refund handling: `admin/returns` lets an admin set a `refund_amount` and status, but this is a manual admin action, not an automated Razorpay refund API call — there's no code that calls Razorpay's refund endpoint. "Refund" in this app currently means "an admin marks a return as refunded in the database," with the actual money movement presumably happening outside the app.
- COD path: order is created with `payment_status: pending`; no separate confirmation step is visible for when COD payment is actually collected/marked paid.

---

## 15. Security Audit (consolidated — see §12 and the ranked list in §22–26 for the full itemized list)

**Confirmed positives:**
- Service-role key and Razorpay secret never reach client bundles.
- Admin authorization is defense-in-depth (3 layers), no bypass found.
- Seller resource ownership is resolved from session, never trusted from URL params, across every seller route checked.
- Checkout price is server-computed, not client-trusted.
- `setup-admin` endpoint is confirmed fully inert (`410`), despite the alarming name.

**Confirmed vulnerabilities/gaps, ranked:**

| # | Finding | Class | Severity |
|---|---|---|---|
| 1 | `users` RLS self-role-escalation (any user → admin via direct Supabase call) | Broken Authorization / RLS | **P0** |
| 2 | `GET /api/chat` — no auth check at all, returns any two users' full private message history by ID | IDOR / Broken Auth | **P0** |
| 3 | Razorpay webhook forgeable if `RAZORPAY_WEBHOOK_SECRET` unset (defaults to empty-string HMAC key) | Broken Auth (webhook) | **P0** (config-dependent) |
| 4 | Promo discount never applied to actual charge, code burned anyway | Business logic / billing correctness | **P0** |
| 5 | `payments` table — RLS not enabled, zero policies | Data exposure (latent) | **P1** |
| 6 | Storage bucket IDOR — any seller can overwrite/delete another seller's images | IDOR | **P1** |
| 7 | `/api/checkout` doesn't verify `address_id` ownership | IDOR | **P1** |
| 8 | Sub_admin can self-promote to full admin via `/api/admin/users/[id]` | Privilege escalation | **P1** |
| 9 | `state_scope` for sub-admins is UI-only, not enforced by any query filter | Broken access control (false sense of scoping) | **P1** |
| 10 | `verify-otp` has zero rate limiting/brute-force protection | Auth hardening | **P1** |
| 11 | Sellers can write `approval_status`/`is_featured`/`rating`/`sold_count` directly (column-level RLS gap) | Broken Authorization | **P2** |
| 12 | "Verified purchase" review requirement not enforced at DB level | Integrity | **P2** |
| 13 | `promo/redeem` has no ownership check — any authenticated user can redeem any code they learn of | Business logic | **P2** |
| 14 | `carts`, `swadeshi_rank_history`, `seller_approvals`, `product_approvals` — no RLS | Data exposure (latent) | **P2** |
| 15 | Webhook signature comparison is not constant-time (`!==` instead of `timingSafeEqual`) | Timing attack (low practical risk) | **P3** |
| 16 | Verbose `error.message` leakage on admin route 500s | Info disclosure (admin-only, low risk) | **P3** |
| 17 | `request-otp` rate limiter is per-process in-memory — ineffective across serverless instances | Auth hardening | **P3** |

No SQL injection was found (all queries go through the Supabase client's parameterized query builder). No client-side-only authorization was found protecting anything privileged. No XSS vectors were specifically identified in this pass (React's default escaping covers most surface area; no `dangerouslySetInnerHTML` usage was seen in the files read), but a dedicated XSS pass on all rich-text fields (blog posts, product descriptions, review comments) rendered anywhere was not exhaustively performed and is worth a follow-up.

---

## 16. Fake / Incomplete Functionality (Phase 16)

**Feature: Wishlist heart button (product cards) — Finding F-1**
**Location:** `src/components/product-card.tsx:40-45` (`handleWishlist`), prop `onWishlist` declared but never passed at any of its 8 call sites: `src/app/category/[slug]/page.tsx:338`, `src/app/category/CategoryClient.tsx:272`, `src/app/state/[stateId]/page.tsx:253`, `src/app/best-sellers/page.tsx:96`, `src/app/new/page.tsx:101`, `src/app/seller/[id]/page.tsx:192`, `src/app/product/[slug]/page.tsx:582,599`, `src/components/featured-products.tsx:66` (confirmed via repo-wide grep — zero call sites pass this prop)
**What user expects:** Clicking the heart on any product card (homepage, category grid, search results, best-sellers, new arrivals, seller storefronts) saves it to their wishlist.
**What actually happens:** Local component state (`isWished`) toggles visually; `onWishlist?.()` is called but is always `undefined`. Nothing is persisted. Refreshing the page loses the state. The item never appears in the account page's Wishlist tab.
**Why:** The component was built to accept a callback for the actual persistence logic, but that callback was never wired up anywhere it's used.
**Severity:** P1 — wishlist is a core, advertised feature and this is the primary way users would ever interact with it (product cards are everywhere; the product detail page, where it *does* work, is one click deeper).
**Recommended solution:** Wire `onWishlist` at every `<ProductCard>` call site to the same real logic already implemented correctly in `src/app/product/[slug]/page.tsx` (`handleToggleWishlist`), ideally factored into a shared hook.

**Feature: LoqCoin redemption at checkout**
**Location:** `src/app/loqcoins/page.tsx:138` (copy: "Apply LoqCoins at checkout. 1 LoqCoin = ₹1 discount.") vs. `src/app/checkout/page.tsx` (full file read — no redemption input, checkbox, or API call exists)
**What user expects:** An option at checkout to apply their LoqCoin balance as a discount.
**What actually happens:** Checkout only ever displays coins to be *earned* on the current order; there is no way to spend a balance.
**Why:** The feature is documented/advertised on the LoqCoins page and in the README but was never built into the checkout flow.
**Severity:** P1 — directly contradicts what the app tells users they can do.
**Recommended solution:** Either build redemption into checkout (deduct from `loqcoin_balances`, log a `redeem` ledger entry, reduce the charged total) or remove the claim from the LoqCoins page until it exists.

**Feature: Promo code discount at checkout**
**Location:** `src/app/checkout/page.tsx` (sends `promo_code`, `discount_amount`) → `src/app/api/checkout/route.ts` (never reads either field)
**What user expects:** The discounted total shown after applying a promo code is what they're charged.
**What actually happens:** The Razorpay charge amount is the full, undiscounted server-computed total; the promo code is marked used regardless.
**Why:** The checkout API was never updated to consume the discount fields the frontend already sends.
**Severity:** P0 (see §14/§22 — this is a billing-correctness bug, not just a missing feature).
**Recommended solution:** Have `/api/checkout` re-validate the promo code server-side (don't trust `discount_amount` from the client either — recompute it from the DB record, matching the existing "never trust client price" pattern already used for line items) and apply it to `subtotal`/`total` before creating the Razorpay order.

**Feature: Delivery estimate on product page**
**Location:** `src/app/product/[slug]/page.tsx:90-94` (`checkDelivery`)
**What user expects:** Entering a pincode shows a real, serviceability-checked delivery estimate.
**What actually happens:** `Math.floor(Math.random() * 4) + 4` — a fabricated day range, completely independent of the pincode entered or the seller's actual location/logistics setup.
**Why:** No real logistics/serviceability API integration exists for this check (Shiprocket is only invoked post-payment, not for pre-purchase estimates).
**Severity:** P2 — low functional risk but actively misleading (any pincode "works," including invalid or non-serviceable ones).
**Recommended solution:** Either integrate a real serviceability check (Shiprocket has one) or replace with a generic, honest static estimate that doesn't imply pincode-specific calculation.

**Feature: Admin analytics trend arrows**
**Location:** `src/app/admin/analytics/page.tsx:76-83`
**What user expects:** Up/down/flat arrows next to KPIs reflect real period-over-period change — the page header even states "Real-time platform metrics."
**What actually happens:** Trend is hardcoded per metric (`trend: "up"` for Revenue/Orders/Sellers/Users, `"flat"` for Products) — literal constants unrelated to `data.totals`, never computed from a prior-period comparison.
**Why:** No historical/previous-period query exists in `/api/admin/analytics`; the frontend assigns a fixed label to each KPI object.
**Severity:** P2 — admin-only, but actively misrepresents trend direction to the people making business decisions from this page.

**Feature: Dev-mode OTP fallback**
**Location:** `src/app/api/auth/request-otp/route.ts` (development-only branch)
**What actually happens:** Claims success and logs a fake `123456` code, but real OTP verification still requires Supabase to have actually issued a code — so the fallback doesn't even function as a working bypass, it just prints a misleading success message.
**Severity:** P3 (dev-only), but confusing enough during QA/onboarding that it's worth a code comment or removal.

**Feature: Contact Us form**
**Location:** `src/app/contact/page.tsx:23` (`handleSubmit`)
**What user expects:** Filling out name/email/subject/message and clicking "Send Message" delivers it to LoqMart support, per the page's own "our team will respond within 24 hours."
**What actually happens:** `handleSubmit = (e) => { e.preventDefault(); setSent(true) }` — no `fetch`, no API call. No `/api/contact` route exists anywhere in the codebase. The "Message Sent!" screen appears unconditionally; the message is silently discarded.
**Why:** The submit handler was never wired to a backend.
**Severity:** P0 — this is the site's primary customer-support channel, and it drops every message on the floor while telling the user it succeeded.
**Recommended solution:** Add a real `/api/contact` route (store in a `contact_messages` table or forward via a transactional email provider) before launch, or replace the form with a mailto: link until it's built.

**Feature: Grievance Redressal complaint form**
**Location:** `src/app/grievance/page.tsx:18-23` (`handleSubmit`)
**What user expects:** Per the page's own legal framing (explicitly citing the Consumer Protection (E-Commerce) Rules, 2020, and a named "Nodal Officer" who responds within 48 hours), submitting a grievance registers a real, trackable complaint.
**What actually happens:** Identical pattern to the Contact form — `e.preventDefault(); setSubmitted(true)`. The displayed "Ticket ID" (`GR${Date.now()...}`) is generated client-side and never persisted or transmitted; no `/api/grievance` route exists. The complaint vanishes on refresh.
**Why:** No backend integration exists behind a page that makes explicit statutory commitments.
**Severity:** P0 — beyond the UX issue, this is a **regulatory/compliance risk**: the page cites specific legal obligations under Indian consumer-protection rules that the running code cannot fulfill. This should be treated as a legal-review item, not just an engineering one.
**Recommended solution:** Build a real grievance-intake pipeline (DB table + admin visibility + actual Nodal Officer notification) before this page goes live, or take the legal citations off the page until it does.

**Feature: Buyer-initiated Return/Refund request**
**Location:** `src/app/returns/page.tsx:57-65` (instructs: go to My Orders → click "Return/Refund"); `src/app/account/page.tsx` order-detail view (no such button exists); no buyer-facing POST route exists (only `src/app/api/admin/returns/**`, admin-only)
**What user expects:** Per the published returns policy, a buyer can initiate a return/refund from their order history.
**What actually happens:** No "Return/Refund" button exists anywhere in the buyer-facing UI, and there is no public endpoint to create a row in `return_requests`. Admins can review/resolve returns that already exist, but nothing lets a buyer create one in the first place — the feature is admin-management-only with no origination path.
**Why:** The return workflow was built end-to-end for the admin side; the buyer-side origination step (button + route + insert) was never built.
**Severity:** P0 — the policy page makes an explicit promise the product cannot keep, for a core post-purchase e-commerce flow.
**Recommended solution:** Add a "Request Return/Refund" action on delivered order items in the account page, backed by a new authenticated POST route that inserts into `return_requests` scoped to the calling user.

**Feature: Checkout success page order details**
**Location:** `src/app/checkout/success/page.tsx:12-14, 62-93, 144-145`
**What user expects:** The order number and summary shown after paying match the real order just created — the checkout flow redirects here with `?order=${data.order_id}`, and `/api/checkout` already returned a real `order_number`.
**What actually happens:** The page never reads the `order` query param (no `useSearchParams` call) and never fetches the real order. It fabricates a **different** order number on render (`` `LM${Date.now().toString().slice(-6)}` ``) — guaranteed to not match the actual `orders.order_number` in the database — and reconstructs the "Order Summary" from the local (about-to-be-cleared) cart store rather than the real placed order. It also states "Confirmation sent to your mobile," but no SMS-sending integration exists anywhere.
**Why:** The success page was built independently of the real checkout response instead of consuming `data.order_id`/`data.order_number`.
**Severity:** P1 — a customer who later contacts support with "my order number" will report a number that doesn't exist in the database, and the summary they see may not reflect what they actually paid for as an accurate reference.
**Recommended solution:** Read `order` from `useSearchParams()`, fetch the real order via `/api/user/orders` or a dedicated endpoint, and render its actual `order_number`/items/total.

**Feature: Homepage "like" heart in the state-feed section**
**Location:** `src/components/state-feed.tsx:19, 97-103`
**What actually happens:** Same pattern as the product-card wishlist — `useState(false)` toggled locally on click, no API call, nothing persisted.
**Severity:** P1 (same root cause and impact class as Finding F-1).

**Feature: Claimed automatic email notifications**
**Location:** `src/app/survey/page.tsx:391` ("Milestone codes are delivered to your email automatically"); `src/app/seller/dashboard/page.tsx:345` and `src/app/seller/register/page.tsx:315` ("You receive an email notification upon approval" / "You'll receive an email once approved")
**What user expects:** An actual email arrives for milestone rewards or seller-approval status changes.
**What actually happens:** No email-sending integration (no SendGrid/Resend/SES/nodemailer/SMTP) exists anywhere in the codebase [verified via repo-wide search]. These events only ever write a database row (`survey_discount_codes`, `notifications`) — the in-app notification exists, but the promised email never fires.
**Why:** Three separate pages promise email delivery for a channel that was never built.
**Severity:** P1 — users who don't proactively check the site (which is the entire point of an email notification) will simply never learn their seller application was approved or that they earned a discount code.
**Recommended solution:** Either integrate a transactional email provider for these two flows, or change the copy to reflect that notifications are in-app only.

**Feature: Hardcoded homepage hero stats**
**Location:** `src/components/hero.tsx:121-133`
**What user expects:** The animated up-counter ("10,000+ Products," "36 States," "500+ Verified Sellers," "12 Categories") implies live platform metrics.
**What actually happens:** A static literal array with no data fetch — the counter always animates to the same fixed numbers regardless of actual `products`/`sellers` counts in the database.
**Severity:** P2 — cosmetic today, but will visibly diverge from reality as the real catalog grows or shrinks (and is untrue at zero real sellers).

**Feature: Fabricated company/contact identity details**
**Location:** `src/app/contact/page.tsx:7-12` (`CIN: U74999DL2024PTC123456`, WhatsApp `+91 9999 999 999`, toll-free `1800-LOQMART`)
**What actually happens:** These read as placeholder values (a repeated-9s phone number, a mnemonic toll-free number) presented as real registered-business contact details, on a form that also doesn't submit anywhere (see above).
**Severity:** P2 — should be replaced with real, verifiable business details before public launch; presenting fabricated corporate registration info is a trust and potentially legal concern.

**Feature: "Explore the Process" homepage CTA**
**Location:** `src/components/editorial-section.tsx:38-44`
**What actually happens:** `<motion.button>` has hover/tap animation only — no `onClick`, no `href`, not wrapped in a `Link`. Clicking it does nothing.
**Severity:** P3.

**Note on `alert()` usage:** Several genuinely-functional flows (seller registration, checkout address validation, account address form) use native browser `alert()` for validation/error feedback instead of in-UI messaging consistent with the rest of the design system. These are **not fake** — real validation gates real API calls — but are a UX inconsistency worth cleaning up (P3).

**Dead code note:** `src/components/layout/header.tsx` is an orphaned, unused duplicate of the real header (`src/components/header.tsx`, rendered via `ConditionalLayout.tsx`) — not a functional defect, but worth removing during cleanup.

---

## 17. E-Commerce Completeness Audit — Missing Functionality

**Customer:**
- No self-service order cancellation.
- No self-service return/refund *request* initiation (admin can process returns that already exist, but nothing creates one from the customer side).
- No product Q&A section.
- No product comparison.
- No "recently viewed" tracking.
- No recommendation engine ("customers also bought," etc.).
- No price-drop / back-in-stock notifications.
- No invoice/receipt generation or download.
- Working: wishlist (PDP only — see Finding F-1), reviews, multiple addresses, promo codes (partially — see P-1), LoqCoin earning (not redemption), order history.

**Seller:**
- No bulk product upload (CSV/spreadsheet import).
- No seller-initiated shipping label generation UI beyond the automatic Shiprocket call on payment confirmation.
- No seller-facing payout/settlement history beyond the earnings tab (and that tab's math is wrong for custom commission rates — Finding above).
- No store customization (banner/theme beyond logo/banner URL fields).
- Working: onboarding + KYC-style approval workflow, product management, inventory, order visibility, analytics, Swadeshi Rank display, notifications (via general notification system).

**Admin:**
- No dispute-management workflow distinct from returns.
- No fraud-detection tooling.
- No settlement-creation UI (read-only once created elsewhere).
- State-scoped sub-admin restriction is unimplemented despite existing UI copy claiming it works (security-relevant, listed in §15 too).
- Working: seller/product moderation, order management, returns, penalties, reviews moderation, categories, blog/content, commission management, platform settings, audit logs, notifications broadcast, analytics.

**Marketplace-level:**
- Commission system exists and is configurable (global/category/seller-scoped) — real.
- GST is applied as a flat 2% at checkout — not itemized per product tax category, no GST invoice generation.
- No automated refund-to-payment-gateway integration (refunds are DB-status-only, as noted in §14).
- Seller payout/settlement tracking exists as a table and admin view, but has no "make a payout" action wired to any real payment rail — it's a ledger, not a payment executor.

---

## 18. UX / Responsive Audit — Scope Limitation

I do not have a browser tool in this environment, so I could not visually verify layouts at desktop/tablet/mobile breakpoints, check for overlapping elements, or observe actual rendered spacing/typography. What I *can* say from source inspection:
- Tailwind responsive classes (`sm:`, `md:`, `lg:`) are used throughout the components I read (header, checkout, product cards), suggesting responsive design was considered, not ignored.
- Loading states exist and are real (`Loader2` spinners gated on actual `isLoading`/`isProcessing` state, not fake timers) in checkout, product page, account page.
- Empty states exist and are intentional (empty cart, empty wishlist, no addresses, no search results all have dedicated UI) — not generic blank screens.
- `<img>` is used instead of `next/image` in at least 6 components (lint-flagged) — this will cost LCP/bandwidth, especially on product-heavy pages.

**Recommendation:** This section needs a real pass with a browser (manual or automated) before launch — I can't respons­ibly claim mobile/tablet layouts are fine or broken without seeing them rendered. I did not fabricate visual findings; this is a documented gap in the audit, not a "passed" result.

---

## 19. Performance Audit

- `<img>` instead of `next/image` in ~6 places (blog-preview, category-grid, editorial-section, hero, state-feed) — no automatic resizing/format negotiation/lazy-loading, real LCP cost on image-heavy pages like the homepage and product grids.
- Most interactive pages are `"use client"` with `useEffect`-driven data fetching (checkout, product page, account page, seller/admin dashboards) rather than server components with direct data fetching — this is a reasonable choice for this app's level of interactivity, but means an extra client-server round trip after initial paint on nearly every data-bearing page, and no streaming/suspense boundaries were observed for these fetches.
- Product detail page issues a client-side Supabase query (wishlist status check) in addition to the `/api/products/[slug]` fetch — could be folded into the single API response to save a round trip.
- No obvious N+1 query patterns were found in the routes read — most list endpoints use Supabase's relational `select` with joins (e.g., `order_items(quantity, price, products(name))`) rather than looping per-row queries.
- No caching (`revalidate`, `unstable_cache`, or HTTP cache headers) observed on public read endpoints like `/api/products` or `/api/categories`, which are hit on essentially every page load.

---

## 20. SEO Audit

- `generateMetadata` (per-item dynamic metadata) is **not used anywhere** — grep across `src/app` found zero occurrences. Dynamic routes (`product/[slug]`, `category/[slug]`, `state/[stateId]`, `blog/[slug]`, `seller/[id]`) all inherit the root/static layout's metadata rather than generating a unique title/description/OG-image per product, category, state, or blog post. For an e-commerce site, this means **every product page currently shares the same title/description/social-share preview** — a significant SEO and social-sharing gap.
- No `sitemap.ts`/`sitemap.xml` and no `robots.ts`/`robots.txt` found anywhere in `src/app`.
- No structured data (JSON-LD `Product`, `Offer`, `BreadcrumbList`, etc.) found anywhere — no `application/ld+json` or schema.org references in any component.
- Static content pages (about, careers, terms, privacy, etc.) do correctly export `metadata` objects — the gap is specifically in the dynamic, most-commercially-important routes.

---

## 21. Security Audit — see §15 (consolidated to avoid duplication)

---

## 22. Feature Matrix

*(Emoji status legend used here per explicit ask — kept confined to this internal audit document, consistent with the project's own guidance to remove emojis from the product itself.)*

| Feature | Location | Status | Tested | Backend Connected | DB Connected | Severity | Notes |
|---|---|---|---|---|---|---|---|
| Product catalog / browse | src/app/api/products | 🟢 WORKING | Code-traced | Yes | Yes | — | |
| Category filter/sort | src/app/category | 🟢 WORKING | Code-traced | Yes | Yes | — | |
| State pages | src/app/state | 🟢 WORKING | Code-traced | Yes | Yes | — | |
| Search | header → /category?search= | 🟢 WORKING | Code-traced | Yes | Yes | — | |
| Cart add/remove/qty | src/lib/store.ts | 🟢 WORKING | Code-traced | No (client-only) | No | P2 | `carts`/`cart_items` tables unused; no cross-device sync |
| Wishlist (product detail page) | src/app/product/[slug] | 🟢 WORKING | Code-traced | Yes | Yes | — | |
| Wishlist (product cards, sitewide) | src/components/product-card.tsx | ⚪ UI ONLY | Code-traced | No | No | P1 | `onWishlist` never wired at 8 call sites (Finding F-1) |
| "Like" heart (homepage state feed) | src/components/state-feed.tsx | ⚪ UI ONLY | Code-traced | No | No | P1 | Same pattern as F-1 |
| Contact Us form | src/app/contact/page.tsx | 🔴 BROKEN | Code-traced | No | No | **P0** | No API route; message discarded, fake success shown |
| Grievance Redressal form | src/app/grievance/page.tsx | 🔴 BROKEN | Code-traced | No | No | **P0** | Same as above; cites unfulfilled legal obligations |
| Return/refund request (customer) | — | ⏳ NOT IMPLEMENTED | Code-traced | — | — | **P0** | Policy page instructs users to do this; no button/route exists |
| Checkout success page order details | src/app/checkout/success/page.tsx | 🔴 BROKEN | Code-traced | No | No | P1 | Fabricates a new order number instead of showing the real one |
| Email notifications (survey/seller approval) | src/app/survey, seller/register, seller/dashboard | ⏳ NOT IMPLEMENTED | Code-traced | No | No | P1 | Advertised in 3 places; no email provider integrated anywhere |
| Homepage hero stats counter | src/components/hero.tsx | 🔵 MOCKED | Code-traced | No | No | P2 | Static hardcoded array, not queried from DB |
| Checkout — address | src/app/api/user/addresses | 🟢 WORKING | Code-traced | Yes | Yes | — | No ownership check on `address_id` at order-create time (Finding S-4/P1) |
| Checkout — promo code | src/app/checkout, src/app/api/promo | 🔴 BROKEN | Code-traced | Partial | Partial | **P0** | Discount never applied to charge (Finding P-1) |
| Checkout — Razorpay payment | src/app/api/checkout, orders/webhook/razorpay | 🟢 WORKING | Code-traced | Yes | Yes | — | Webhook forgeable if secret env var unset (P0, config-dependent) |
| Checkout — COD | src/app/checkout/page.tsx | 🟡 PARTIAL | Code-traced | Yes | Yes | P2 | No separate COD payment-collected step |
| LoqCoin earning | orders/webhook/razorpay, reviews route | 🟢 WORKING | Code-traced | Yes | Yes | — | |
| LoqCoin redemption | src/app/checkout | ⏳ NOT IMPLEMENTED | Code-traced | No | No | P1 | Advertised on /loqcoins, absent at checkout (Finding P-2) |
| Order history/detail | src/app/account | 🟢 WORKING | Code-traced | Yes | Yes | — | |
| Order cancellation (customer) | — | ⏳ NOT IMPLEMENTED | Code-traced | — | — | P1 | Not found anywhere in customer UI |
| Return/refund request (customer) | — | ⏳ NOT IMPLEMENTED | Code-traced | — | — | P1 | Admin can process; nothing initiates one from buyer side |
| Product reviews | src/app/api/products/[slug]/reviews | 🟢 WORKING | Code-traced | Yes | Yes | — | "Verified purchase" not enforced at DB level (P2) |
| Delivery estimate (pincode) | src/app/product/[slug]/page.tsx | 🔵 MOCKED | Code-traced | No | No | P2 | `Math.random()`-based (Finding above) |
| Phone OTP auth | src/app/api/auth/* | 🟡 PARTIAL | Code-traced | Yes | Yes | P1 | No rate limit on verify; misleading dev fallback |
| Seller registration → approval | src/app/seller/register, api/seller/register | 🟢 WORKING | Code-traced | Yes | Yes | — | |
| Seller product CRUD | src/app/seller/dashboard | 🟢 WORKING | Code-traced | Yes | Yes | — | |
| Seller image upload | src/app/seller/dashboard | 🟡 PARTIAL | Code-traced | Yes | Yes | P1 | Storage bucket IDOR — any seller can touch another's files (Finding S-3) |
| Seller earnings/commission display | src/app/api/seller/dashboard | 🟡 PARTIAL | Code-traced | Yes | Yes | P2 | Hardcoded 10%/2% rate, ignores real overrides |
| Admin seller/product approval | src/app/admin, src/app/api/admin | 🟢 WORKING | Code-traced | Yes | Yes | — | Products-page approve/reject path skips audit log (P2) |
| Admin order/returns/penalties/reviews management | src/app/admin/* | 🟢 WORKING | Code-traced | Yes | Yes | — | |
| Admin user management | src/app/api/admin/users | ⚠️ SECURITY ISSUE | Code-traced | Yes | Yes | **P1** | Sub_admin self-promotion to admin (Finding S-6) |
| Sub-admin state scoping | users.state_scope | ⚠️ SECURITY ISSUE | Static | Partial | Partial | **P1** | UI claims enforcement; no query filters it anywhere (Finding S-7) |
| `users` table self-update RLS | supabase/schema.sql | ⚠️ SECURITY ISSUE | Static | — | Yes | **P0** | Missing `WITH CHECK` allows self-role-escalation (Finding S-1) |
| `payments` table RLS | supabase/schema.sql | ⚠️ SECURITY ISSUE | Static | — | Yes | **P1** | No RLS enabled at all |
| `GET /api/chat` | src/app/api/chat/route.ts | ⚠️ SECURITY ISSUE | Code-traced | Yes | Yes | **P0** | No auth check, IDOR on any two user IDs |
| `setup-admin` endpoint | src/app/api/setup-admin | 🟢 WORKING (safely inert) | Code-traced | N/A | N/A | — | Confirmed hard-disabled (`410`) |
| Test suite | __tests__/ | 🔴 BROKEN | Live-verified | — | — | P1 | No vitest config; 0 runnable tests |
| Dynamic-page SEO metadata | product/category/state/blog `[slug]` pages | ⏳ NOT IMPLEMENTED | Code-traced | — | — | P1 | No `generateMetadata` anywhere |
| Sitemap / robots.txt | src/app | ⏳ NOT IMPLEMENTED | Code-traced | — | — | P2 | Not found |
| Structured data (JSON-LD) | src/app | ⏳ NOT IMPLEMENTED | Code-traced | — | — | P2 | Not found |

---

## 23–26. Prioritized Issue Lists

### P0 — Critical, blocks launch
1. `users` RLS self-role-escalation — any buyer can become admin via direct Supabase call (SECURITY)
2. `GET /api/chat` — unauthenticated IDOR exposing any two users' private messages (SECURITY)
3. Razorpay webhook forgeable if `RAZORPAY_WEBHOOK_SECRET` unset — fails open instead of closed (SECURITY)
4. Promo code discount never applied to the actual charge; code burned regardless (BUG / billing correctness)
5. Contact Us form is entirely fake — no backend, message silently discarded (BUG)
6. Grievance Redressal form is entirely fake, while explicitly citing statutory Consumer Protection Act obligations it cannot fulfill (BUG / COMPLIANCE)
7. No customer-initiated return/refund request exists, despite the published returns policy explicitly telling users how to do it (MISSING FEATURE)

### P1 — High priority
8. `payments` table has no RLS (SECURITY)
9. Storage bucket IDOR — sellers can tamper with each other's images (SECURITY)
10. `/api/checkout` doesn't verify `address_id` ownership (SECURITY)
11. Sub_admin can self-promote to full admin (SECURITY)
12. `state_scope` sub-admin restriction is unenforced despite UI claiming otherwise (SECURITY / ARCHITECTURE)
13. `verify-otp` has no rate limiting (SECURITY)
14. Wishlist non-functional on every product-card/like surface except the product detail page (BUG / MISSING FEATURE)
15. LoqCoin redemption doesn't exist despite being advertised (MISSING FEATURE)
16. Checkout success page shows a fabricated order number that won't match the real order (BUG)
17. Email notifications (survey milestones, seller approval) are promised in three places but no email integration exists anywhere (BUG / MISSING FEATURE)
18. No customer-initiated order cancellation (MISSING FEATURE)
19. Test suite cannot run at all — zero effective coverage (TECHNICAL DEBT)
20. No dynamic per-page SEO metadata on product/category/state/blog pages (SEO)

### P2 — Medium priority
21. Sellers can write `approval_status`/`is_featured`/`rating`/`sold_count` directly via RLS gap (SECURITY)
22. "Verified purchase" review requirement unenforced at DB level (SECURITY / integrity)
23. `promo/redeem` has no ownership check on who can redeem a code (SECURITY / business logic)
24. `carts`, `swadeshi_rank_history`, `seller_approvals`, `product_approvals` have no RLS (SECURITY, latent)
25. Seller earnings math ignores real per-seller commission overrides (BUG)
26. Admin product approve/reject inconsistent audit trail depending on which page is used (BUG / ARCHITECTURE)
27. Delivery-estimate feature is fully fake (`Math.random()`) (UX / trust)
28. Cart is client-only — no cross-device persistence, not connected to schema's own cart tables (ARCHITECTURE)
29. Admin analytics trend arrows are hardcoded despite the page claiming "real-time metrics" (BUG)
30. Homepage hero stats are a static hardcoded array, not live counts (BUG / trust)
31. Fabricated company registration/contact details on the Contact page (TRUST / possible compliance)
32. No sitemap.xml / robots.txt (SEO)
33. No structured data / JSON-LD (SEO)
34. `<img>` instead of `next/image` in ~6 components (PERFORMANCE)
35. No caching on high-traffic public read endpoints (PERFORMANCE)
36. Finance → Settlements has no create-UI (MISSING FEATURE)

### P3 — Nice-to-have
37. Webhook signature check isn't constant-time (SECURITY, low practical risk)
38. Verbose error messages on admin routes (SECURITY, low risk, admin-only)
39. Request-OTP rate limiter is per-process, ineffective in serverless (SECURITY hardening)
40. Dev-mode OTP fallback is misleading (TECHNICAL DEBT)
41. "Explore the Process" homepage CTA has no handler at all (BUG, cosmetic)
42. Widespread native `alert()` used for validation/error feedback instead of in-UI messaging (UX)
43. Orphaned unused `src/components/layout/header.tsx` duplicate (TECHNICAL DEBT)
44. 176 ESLint errors, mostly `no-explicit-any` (TECHNICAL DEBT)
45. No bulk product upload for sellers (MISSING FEATURE)
46. No product Q&A, comparison, recently-viewed, or recommendations (MISSING FEATURE)

---

## 27. Recommended Development Roadmap

**Phase 1 — Critical fixes (before any real users/money):**
Fix the seven P0s: `users` RLS `WITH CHECK`, `/api/chat` auth, webhook fail-closed behavior, promo-discount application at checkout, a real Contact Us backend, a real (or legally-honest) Grievance flow, and a customer-initiated return/refund request path. Each is a bounded, well-understood fix, not a redesign — but the two fake support/compliance forms should get legal sign-off alongside the engineering fix given the statutory claims already live on the Grievance page.

**Phase 2 — Core e-commerce functionality:**
Wire up wishlist everywhere (product cards + state feed), decide on and either build or remove LoqCoin redemption, fix the checkout success page to show the real order, add customer-initiated cancellation, wire real email notifications (or remove the claim), fix the checkout address IDOR, get the test suite actually running (fix `vitest.config` path aliasing) so future changes to checkout/payments/auth have a safety net.

**Phase 3 — Seller marketplace functionality:**
Fix the storage bucket IDOR, correct seller earnings math to use real commission overrides, close the sellers'-column RLS gap (approval_status/rating/etc.), unify the two admin product-approval code paths.

**Phase 4 — Admin functionality:**
Fix sub_admin self-promotion, actually enforce (or remove the claim of) state-scoped sub-admin restrictions, add a settlements-creation UI, tighten `admin_logs`/`commission_settings` access to `admin`-only if that was the original intent.

**Phase 5 — UX/UI improvements:**
A real browser-based pass across desktop/tablet/mobile (this audit could not do this) — this is where actual visual/layout bugs, if any, would surface.

**Phase 6 — Performance/SEO:**
`generateMetadata` on all dynamic routes, sitemap.xml/robots.txt, JSON-LD structured data, swap remaining `<img>` for `next/image`, add caching to public read endpoints.

**Phase 7 — Advanced marketplace features:**
Product Q&A, comparison, recently-viewed, recommendations, bulk seller product upload, real refund-to-gateway integration, real delivery-serviceability check.

**Phase 8 — Pre-launch security and QA:**
Re-run this audit's security items against the live Supabase project's actual `pg_policies` (not just source files, given the non-idempotent migration history), do the browser-based UX pass, get automated tests covering checkout/payments/auth, and do a final pass for XSS on rich-text fields (blog posts, reviews, product descriptions) which was not exhaustively covered in this audit.

---

## Totals

- **A. Total features/flows audited:** ~65 distinct features/pages across customer, seller, and admin surfaces, plus ~60 API routes and ~25 database tables reviewed individually
- **B. Fully working:** ~34
- **C. Partially working:** ~9
- **D. Broken:** 5 (promo discount, test suite, Contact form, Grievance form, checkout success page order number)
- **E. UI-only / no-op:** 3 (wishlist on product cards, state-feed like button, "Explore the Process" CTA)
- **F. Mocked/static:** 4 (delivery estimate, admin analytics trend arrows, homepage hero stats, fabricated contact/company details)
- **G. Missing (advertised or expected but absent):** ~11 (return/refund request, LoqCoin redemption, order cancellation, email notifications, Q&A, comparison, recently-viewed, recommendations, bulk upload, settlement-creation UI, product-comparison)
- **H. Security issues found:** 17 (§15/§22)
- **I. P0 issues:** 7
- **J. P1 issues:** 13
- **K. P2 issues:** 16
- **L. P3 issues:** 10

*No application code, Supabase schema, RLS policies, or data were modified in the course of this audit. The only file created is this report.*
