# LoqMart design audit

## Audit scope

The source scan covered all 54 App Router page modules. Runtime visual review covered the mobile homepage and catalogue at the current in-app viewport. The shared header, product cards, listing controls, seller/admin card system, design tokens, and India map were reviewed in source. Supabase is not resolving in this environment, so populated product, account, seller, and admin states could not all be inspected live.

## Shared design system

**Flagged issue**  
**Element:** Buttons and interactive controls across the site  
**Flaw:** Button heights and corners varied between shared and page-local components. Primary actions used gradients and shadows, while several controls had no dependable keyboard focus treatment.  
**Corrected design spec:** Shared button sizes are 36px (`sm`), 40px (`default`), 44px (`lg`), and 48px (`xl`). Use 4px corners for controls, yellow `#fcd020` with dark text for primary actions, dark charcoal for secondary actions, white with `#d0c6ac` border for outline actions, and a 2px `#725c00` focus outline with a 2px offset.  
**Alignment verdict:** Actions now share a compact, legible shape and a visible keyboard state. Page-local buttons inherit the same control radius.

**Flagged issue**  
**Element:** Cards and page surfaces  
**Flaw:** `rounded-xl` and `rounded-2xl` produced 12px and 16px corners beside 4px controls. Seller/admin cards also used heavy backdrop blur, inset highlights, and large hover lifts.  
**Corrected design spec:** Neutral canvas `#f8f5f0`, white cards, structural text `#1a1c1c` / `#4d4632`, borders `#d0c6ac`; 2px default, 4px `lg`, and 8px `xl` through `3xl` radii. Seller/admin cards use a solid white surface, 1px outline-variant border, and a subtle 1–4px shadow.  
**Alignment verdict:** Surfaces now read as a single marketplace system instead of separate rounded and glassy styles.

**Flagged issue**  
**Element:** Muted text and focus states  
**Flaw:** Many labels used 30–55% black opacity on light surfaces, making small text hard to read. The global focus treatment was not consistently visible.  
**Corrected design spec:** Those muted black text utilities resolve to `#4d4632`; focusable controls receive a 2px `#725c00` outline. Reduced-motion preferences disable long transitions and scrolling animation.  
**Alignment verdict:** Supporting text and keyboard focus are easier to see without changing the hierarchy of headings and actions.

**Flagged issue**  
**Element:** Accent palette  
**Flaw:** A bright cyan tertiary token, blue mode labels, and yellow-to-orange gradients added accents outside LoqMart’s yellow, charcoal, and neutral palette.  
**Corrected design spec:** Primary `#725c00`, primary container `#fcd020`, on-primary-fixed `#231b00`, charcoal `#1a1c1c`, warm neutral surfaces, and semantic red/green only for error/success states. Machine-made labels use charcoal; handmade labels use the primary container.  
**Alignment verdict:** Brand color now marks the main action and active state; status color remains reserved for status.

**Flagged issue**  
**Element:** Typography and spacing  
**Flaw:** Body typography was already Inter, but some labels were tracked too widely and several controls used one-off dimensions.  
**Corrected design spec:** Keep Inter for interface text, reserve monospace for identifiers, and use the shared 36/40/44/48px control scale. Keep content spacing on 4px increments and use 8px multiples for major section gaps.  
**Alignment verdict:** The type system remains simple, with a more predictable scale for controls and layout.

## Page and component findings

**Flagged issue**  
**Element:** Homepage hero (`/`)  
**Flaw:** At mobile width, the hero headline wrapped the final word “it.” onto a line by itself. When Supabase failed, product, seller, and category counts appeared as real zeroes.  
**Corrected design spec:** Put the two headline phrases on separate responsive lines. Render an em dash for unavailable counts; show a number only when the corresponding query succeeds.  
**Alignment verdict:** The hook reads cleanly on a narrow screen, and unavailable data no longer looks like an empty marketplace.

**Flagged issue**  
**Element:** Catalogue pages (`/category`, `/category/[slug]`, `/deals`, `/new`, `/best-sellers`)  
**Flaw:** Muted status text had low contrast, and a failed product request could look like an empty result.  
**Corrected design spec:** Use `#1a1c1c` for headings, `#4d4632` for supporting text, keep filters above the result grid, and preserve an explicit retry state. Product images stay inside square card frames with `object-fit: cover`.  
**Alignment verdict:** The listing hierarchy stays clear at mobile width; loading failure and an empty search are distinct states.

**Flagged issue**  
**Element:** Product cards and detail gallery (`/product/[slug]`)  
**Flaw:** Product review links used a bright blue outside the palette; mode badges also introduced blue and amber fills.  
**Corrected design spec:** Use `#725c00` for the review link, yellow/charcoal mode badges, a square product-card image, and a 3:4 product detail image frame with `object-fit: contain` for the selected image.  
**Alignment verdict:** Product information and imagery keep their proportions, while interactive and mode colors follow the brand palette.

**Flagged issue**  
**Element:** India map and state discovery (`/india-map`, state links)  
**Flaw:** The map card, search, info panels, and CTA used corners from 9px to 24px. SVG states were clickable but not keyboard-operable, and fractional particle values produced hydration noise.  
**Corrected design spec:** Keep the map SVG at `width: 100%; height: auto` with its `800 × 700` viewBox; use 8px card and input corners, 4px CTA corners, and a 2px primary focus stroke. States expose a link role and respond to Enter/Space. Particle animation uses rounded, deterministic CSS values.  
**Alignment verdict:** The map retains its aspect ratio through the one-column mobile breakpoint, aligns with surrounding cards, and works from the keyboard.

**Flagged issue**  
**Element:** Seller and admin workspaces (`/seller/*`, `/admin/*`)  
**Flaw:** Shared workspace cards used layered blur and pronounced hover lift, and some information/status accents used blue.  
**Corrected design spec:** Solid white cards with an outline-variant border and subtle shadow; 4px control corners; charcoal/neutral information accents, with yellow limited to primary actions and selected states.  
**Alignment verdict:** Dense operational screens have calmer surfaces and clearer action hierarchy.

**Flagged issue**  
**Element:** Cart, checkout, account, and auth controls  
**Flaw:** Page-local controls had inconsistent corner radii and focus states compared with the shared button component.  
**Corrected design spec:** Use 4px control corners, 40px default action height, 44px prominent action height, the shared palette, and the global focus outline. Preserve larger card radii at 8px.  
**Alignment verdict:** Buyer flows now use the same control language from cart through checkout.

## Live-preview limitation

The configured Supabase hostname currently fails DNS resolution. Catalogue pages therefore show their unavailable state, and populated seller/account/admin layouts cannot be verified in this environment. The map’s geometry remains available locally and does not depend on the product catalogue.
