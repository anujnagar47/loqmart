import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const catalog = JSON.parse(await fs.readFile(path.join(root, "public/catalog-import.json"), "utf8"))
const rows = catalog.products.map(product => `| \`${product.images[0]}\` | 1200 × 1500 px | Replace the marked placeholder with one verified, single-item cutout for ${product.name} (SKU ${product.specifications?.catalogue_code || product.slug}); center the complete product on pure white (#FFFFFF). |`)
const states = [
  ["assam", "Assam artisan and handloom headline banner"],
  ["arunachal-pradesh", "Arunachal Pradesh regional craft headline banner"],
  ["manipur", "Manipur craft and textile headline banner"],
  ["meghalaya", "Meghalaya craft headline banner"],
  ["mizoram", "Mizoram craft headline banner"],
  ["nagaland", "Nagaland craft headline banner"],
  ["sikkim", "Sikkim craft headline banner"],
  ["tripura", "Tripura craft headline banner"],
  ["madhya-pradesh", "Chanderi weaving and Eri silk collaboration headline banner"],
]
const stateRows = states.map(([slug, description]) => `| \`/public/images/states/${slug}-hero.jpg\` | 2400 × 900 px (desktop) | ${description}; wide, text-safe composition. |`).join("\n")
const operations = [
  ["/public/images/home/homepage-hero-desktop.jpg", "2400 × 900 px", "Homepage headline image for the India-wide marketplace; leave negative space on the left for copy."],
  ["/public/images/home/homepage-hero-mobile.jpg", "1080 × 1440 px", "Portrait crop of the homepage headline image for small screens."],
  ["/public/images/categories/handloom-textiles.jpg", "800 × 1000 px", "Single handloom textile category thumbnail."],
  ["/public/images/categories/bamboo-cane-reed.jpg", "800 × 1000 px", "Single bamboo, cane, or water-reed craft category thumbnail."],
  ["/public/images/categories/pottery-crafts.jpg", "800 × 1000 px", "Single pottery category thumbnail."],
  ["/public/images/categories/furniture.jpg", "800 × 1000 px", "Single furniture category thumbnail."],
  ["/public/images/categories/apparel-accessories.jpg", "800 × 1000 px", "Single apparel and accessories category thumbnail."],
  ["/public/images/categories/home-decor.jpg", "800 × 1000 px", "Single home furnishing and decor category thumbnail."],
  ["/public/images/trust/artisan-verified.svg", "240 × 240 px", "Trust badge artwork for verified artisan provenance."],
  ["/public/images/trust/secure-payments.svg", "240 × 240 px", "Trust badge artwork for secure payments."],
  ["/public/images/trust/regional-origin.svg", "240 × 240 px", "Trust badge artwork for clearly stated regional origin."],
  ["/public/images/trust/delivery-support.svg", "240 × 240 px", "Trust badge artwork for delivery and customer support."],
  ["/public/images/sellers/default-header.jpg", "2000 × 700 px", "Neutral seller storefront header, without embedded text or logos."],
  ["/public/images/sellers/default-avatar.jpg", "512 × 512 px", "Neutral seller avatar fallback."],
  ["/public/images/empty/cart-empty.svg", "800 × 600 px", "Empty cart illustration in LoqMart colors."],
  ["/public/images/empty/search-empty.svg", "800 × 600 px", "No search results illustration in LoqMart colors."],
  ["/public/images/empty/orders-empty.svg", "800 × 600 px", "Empty order history illustration in LoqMart colors."],
  ["/public/images/empty/wishlist-empty.svg", "800 × 600 px", "Empty wishlist illustration in LoqMart colors."],
]
const operationRows = operations.map(([file, dimensions, description]) => `| \`${file}\` | ${dimensions} | ${description} |`).join("\n")

const text = `# Manual image checklist\n\nAll paths below are rooted at the repository's \`public\` directory. Product placeholders are already present at 1200 × 1500 px on a pure white canvas. The source folder's existing images contain multi-item page captures and mismatched product labels, so they were not assigned as product photography. Replace each marked placeholder only after matching the item to its source page and cropping one product at a time.\n\n## Product images\n\n| Exact upload path | Canvas size | Required image |\n|---|---:|---|\n${rows.join("\n")}\n\n## State and regional storefront heroes\n\n| Exact upload path | Dimensions | Description |\n|---|---:|---|\n${stateRows}\n| \`/public/images/states/north-east-india-hero.jpg\` | 2400 × 900 px (desktop) | Shared North East India regional banner for NEHHDC's multi-state catalog. |\n\n## General operational images\n\n| Exact upload path | Dimensions | Description |\n|---|---:|---|\n${operationRows}\n`

await fs.writeFile(path.join(root, "MANUAL_IMAGE_CHECKLIST.md"), text)
console.log(`Wrote checklist for ${catalog.products.length} product photos, ${states.length + 1} regional heroes, and ${operations.length} operational images.`)
