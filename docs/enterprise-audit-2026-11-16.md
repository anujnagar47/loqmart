# LoqMart Enterprise Audit — 16 November 2026

## Scope and method

This first pass was read-only. It inspected the App Router pages and API route inventory, auth helpers, checkout and payment webhook, seller APIs, upload pipeline, Supabase schema and migration scripts, security configuration, SEO metadata, package lock, environment variable names (values were not read into output), tests, and a desktop storefront capture. It also ran the existing test, lint, TypeScript, and dependency-audit commands.

This is a source review, not a penetration test or confirmation of the deployed Supabase schema. The configured Supabase host did not resolve during prior build verification, and the npm registry was unavailable during `npm audit`; production database state and current advisories therefore remain unverified. The request itself ended mid-list at “Incorrect z”, so later UX criteria were not available.

## Highest-priority findings

### P0 — The main schema’s signup and profile policies need a migration gate

`supabase/schema.sql` creates the `handle_new_user()` trigger using `raw_user_meta_data.role`, and the profile self-update policy allows a user to update their own row. Those definitions alone permit privilege escalation if applied without the later hardening migration. `supabase/fix-phase1-critical.sql` contains corrective triggers/functions that force new accounts to buyer and freeze role/suspension/scope changes, but the repo does not prove that every deployed database has applied it. Treat migration state as a deployment prerequisite and verify the live database before launch.

Evidence: `supabase/schema.sql` around `handle_new_user`, and `supabase/fix-phase1-critical.sql` around `prevent_self_privilege_escalation` and the replacement `handle_new_user`.

### P1 — Buyer checkout was rejected by the server (fixed in this pass)

`POST /api/checkout` now allows authenticated `buyer` and `seller` profiles and rejects missing/privileged profiles. COD/Razorpay still require the relevant environment and provider configuration.

Evidence: `src/app/api/checkout/route.ts`, role check immediately after authentication.

### P1 — State-scoped sub-admin authorization is inconsistently applied (partially mitigated)

`requireAdmin()` authorizes both admins and sub-admins. A number of routes then use the service-role client without filtering records by `stateScope`. The global dashboard, analytics, finance, user list/create, and order detail/update APIs now require full-admin access; the dashboard seller query also has an explicit field allowlist. Other admin APIs still need an endpoint-by-endpoint state-scope review before sub-admin access is considered safe.

Evidence: `src/lib/admin-auth.ts`; `src/app/api/admin/dashboard/route.ts`; `src/app/api/admin/analytics/route.ts`; `src/app/api/admin/intelligence/route.ts` (full admin only); `src/app/api/admin/orders/[orderId]/route.ts`; `src/app/api/admin/finance/route.ts`; `src/app/api/admin/users/route.ts`.

### P1 — Payment and loyalty updates are not one atomic/idempotent transaction

Checkout, payment webhooks, review rewards, and COD coin redemption read balances and then write calculated balances/ledger rows through separate requests. Concurrent requests can race and create inconsistent balances or duplicate ledger entries. Promo validation/consumption also has a check-then-update window. The inventory reservation is better protected by a row-locking SQL RPC, but the other financial mutations are not similarly atomic.

Evidence: `src/app/api/checkout/route.ts`; `src/app/api/orders/webhook/razorpay/route.ts`; `src/app/api/products/[slug]/reviews/route.ts`; `supabase/checkout-inventory.sql`.

### P1 — Logistics serviceability is presented as a guarantee without a carrier lookup

`GET /api/logistics/serviceability` returns `serviceable: true` and a 5–7 day estimate for every syntactically valid pincode. It does not query any carrier or warehouse coverage. That is a customer-facing promise with no operational evidence behind it.

Evidence: `src/app/api/logistics/serviceability/route.ts`.

### P1 — The admin intelligence endpoint is bounded by hard result caps and computes aggregates in memory

The intelligence route reads up to 20,000 events, 5,000 sessions, carts, wishlists, and products, then aggregates in application memory. Counts silently become incomplete once those caps are exceeded; large snapshots also add request latency and memory pressure. Dashboard/finance analytics similarly fetch rows rather than using database aggregates for totals.

Evidence: `src/app/api/admin/intelligence/route.ts`; `src/app/api/admin/dashboard/route.ts`; `src/app/api/admin/finance/route.ts`.

### P2 — Request throttling is not consistently applied to public write APIs

OTP endpoints have a limiter, but contact, grievance, demand capture, analytics/ad events, reviews and several other public or low-friction write endpoints do not consistently use one. Analytics/ad event identifiers are client-supplied and events are not deduplicated, so both storage cost and reported campaign metrics can be manipulated. The in-memory fallback limiter is per process and cannot provide reliable limits across serverless instances.

Evidence: `src/lib/rate-limit.ts`; public write handlers under `src/app/api`.

### P2 — Upload request bodies can be buffered before the file-size check

`/api/upload` checks `Content-Length`, then calls `request.formData()`, and only afterward checks `file.size`. A missing/untrusted length can result in the request body being buffered before the 5/15 MB file limit is enforced. Uploads are authenticated and MIME signatures are checked, but body-size enforcement should happen at the hosting edge/runtime as well.

Evidence: `src/app/api/upload/route.ts`.

### P2 — Logistics webhook authentication and order transitions need provider-grade verification

The logistics webhook uses a shared `x-api-key` equality check, accepts arbitrary status text, defaults unknown values to `processing`, has no event-id replay protection, and ignores update errors. Only Shiprocket is wired; the requested Delhivery, Blue Dart and Ecom Express adapters and a customer tracking page are absent.

Evidence: `src/app/api/logistics/webhook/route.ts`; `src/lib/shiprocket.ts`; no `/track-order` route exists.

### P2 — External dependency risk status is unknown

`npm audit` could not reach `registry.npmjs.org` because DNS/network access failed. The lockfile is present and dependencies resolve locally, but the audit cannot establish whether the current versions have advisories.

### P2 — Static quality gates are not healthy

- `npx tsc --noEmit`: passes.
- `npm test -- --reporter=dot`: 1 existing test file and 3 tests pass.
- `npm run lint`: fails with 182 errors and 54 warnings across the repo (many `any` types, React hook rules, and image optimization warnings).
- `npm audit --json`: could not reach the npm advisory endpoint.
- Production build with `--webpack` succeeded previously, while static data fetches logged Supabase DNS failures. The default Turbopack build previously panicked while trying to bind a process port in the restricted environment.

### P3 — Production defense-in-depth and performance gaps (partially mitigated)

- `next.config.ts` now sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and DNS-prefetch headers. A CSP remains unconfigured because the app's inline scripts and third-party integrations need an inventory and report-only rollout first.
- `src/app/globals.css` imports Inter from Google Fonts at runtime rather than self-hosting through the framework font pipeline.
- Product keyword search uses `ILIKE` and the schema has no demonstrated trigram/full-text index; this will degrade as catalog size grows.
- Public catalog/search endpoints have no per-IP rate limit.
- Current UI evidence is limited to one desktop category listing; no mobile/tablet viewport or keyboard-only pass was completed. The provided UX checklist was cut off mid-line.

## Existing controls that reduce risk

- Admin APIs generally call `requireAdmin()`, which validates the user through Supabase Auth and loads the role server-side.
- Seller product routes resolve the seller record from the authenticated user, rather than trusting a seller ID in the request.
- Checkout recomputes item pricing from database product/variant rows, verifies the address belongs to the user, and reserves stock with a row-locking RPC.
- Razorpay webhook HMAC is checked with constant-time comparison, and paid-order retries are partially handled idempotently.
- Upload validates file signatures and keeps seller KYC documents in a private bucket according to the storage setup script.
- Secrets are configured in the ignored local environment file; it is not tracked by Git. No secret values were displayed during this audit.

## Changes made after the read-only pass

- Checkout now admits authenticated buyer and seller profiles, while rejecting missing and privileged profiles.
- Added `requireFullAdmin()` and applied it to global dashboard, analytics, finance, user management, and order detail/update APIs; narrowed pending-seller dashboard fields.
- Added baseline browser security headers in `next.config.ts`.
- Verification after changes: `npx tsc --noEmit`, `npm test -- --reporter=dot` (3 tests), and `git diff --check` pass. The repo-wide lint failure and unavailable npm advisory endpoint remain as recorded above.

## Recommended remediation order

1. Confirm deployed migrations; remove any direct-client ability to change role and start all signups as buyer.
2. Add idempotent payment/coin/promo procedures; add account suspension checks to checkout where the deployed schema is confirmed.
3. Make sub-admin scoping deny-by-default across every remaining admin API and return only least-privilege fields.
4. Replace pincode-only logistics promises with carrier/warehouse serviceability results or clearly label estimates as unverified.
5. Add provider signature/replay validation and monotonic shipment-state handling; complete remaining carrier adapters and tracking.
6. Add edge request limits, per-IP/user throttles, telemetry dedupe, and upload body-size controls.
7. Replace in-memory aggregate processing with SQL views/RPCs/materialized aggregates and index the catalog search path.
8. Fix lint, add route/payment/RLS integration coverage, and complete mobile, accessibility, SEO, and visual regression audits.
