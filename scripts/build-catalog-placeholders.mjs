import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = process.cwd()
const catalog = JSON.parse(await fs.readFile(path.join(root, "public/catalog-import.json"), "utf8"))
const outDir = path.join(root, "public/images/products")
await fs.mkdir(outDir, { recursive: true })

for (const product of catalog.products) {
  const segments = product.name.split(" - ").map(value => value.trim())
  product.name = segments.filter((value, index) => index === 0 || value !== segments[index - 1]).join(" - ")
  const sku = product.specifications?.catalogue_code || product.slug
  const isNehhdc = product.specifications?.catalogue === "NEHHDC Product Catalogue"
  product.description = `Catalog item ${sku} listed by ${isNehhdc ? "NEHHDC" : "Shri Mintu's Art"}. The source catalog does not specify a selling price or live stock count.`
  product.state_code = null
  product.specifications.origin = isNehhdc ? "North East India" : "Not specified in source"
  product.specifications.source_state = "Not specified in source"
  const file = `${product.slug}.webp`
  const svg = `<svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="1500" fill="#FFFFFF"/><rect x="100" y="100" width="1000" height="1300" rx="8" fill="none" stroke="#D0C6AC" stroke-dasharray="12 12" stroke-width="3"/><text x="600" y="720" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" letter-spacing="3" fill="#725C00">PRODUCT PHOTO</text><text x="600" y="775" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#4D4632">PENDING SOURCE VERIFICATION</text><text x="600" y="1380" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#4D4632">${String(sku).replace(/[<&>]/g, "")}</text></svg>`
  await sharp(Buffer.from(svg)).webp({ quality: 96, lossless: true }).toFile(path.join(outDir, file))
  product.images = [`/images/products/${file}`]
}

await fs.writeFile(path.join(root, "public/catalog-import.json"), `${JSON.stringify(catalog)}\n`)
console.log(`Wrote ${catalog.products.length} white placeholder images at 1200x1500.`)
