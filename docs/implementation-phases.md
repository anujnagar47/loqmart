# LoqMart implementation phases

This is the working sequence for the marketplace-flow audit. Payment-gateway
behavior is deliberately outside this review.

## Phase 1 — Public shopping and navigation

Status: in progress

- Keep product discovery, product details, cart, and wishlist usable without an account.
- Require an account when the buyer enters checkout; preserve the checkout URL and its query when redirecting through sign-in.
- Distinguish an empty catalogue from a failed catalogue request.
- Keep catalogue filters and their URL state aligned.

Started: shared catalogue error handling, New Arrivals retry state, internal-only
post-auth redirects, query-preserving auth gate, and guest wishlist persistence.

## Phase 2 — Buyer order lifecycle

Review cart merge, stock and variant validation, address selection, order status,
cancellation, returns, and customer-visible errors. Make every action lead to a
clear screen or a confirmed state change.

## Phase 3 — Seller lifecycle

Review onboarding, approval, product creation/editing, variants, inventory,
fulfilment, settlements, and seller feedback. Split operational tasks into
purpose-built screens where the current dashboard concentrates unrelated work.

## Phase 4 — Admin operations

Review role and state-scope enforcement, approval queues, product/user/order
actions, finance, settings, and audit history. Each mutation should report its
result and offer a safe recovery path.

## Phase 5 — Integration readiness and release

Configure and validate Supabase, email, shipping, and cache services for the
chosen environment. Verify production flows after the external services are
reachable. Payment-gateway configuration and behavior are tracked separately.
