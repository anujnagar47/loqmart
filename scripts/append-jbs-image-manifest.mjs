import fs from "node:fs"

const products = JSON.parse(fs.readFileSync(new URL("../public/jbs-catalog-import.json", import.meta.url), "utf8")).products
const manifestPath = new URL("../IMAGE_UPLOAD_LIST.md", import.meta.url)
let manifest = fs.readFileSync(manifestPath, "utf8")
manifest = manifest.replace(/\n## JBS Billiards catalogue product images[\s\S]*$/, "")
manifest = manifest.replace(/^> .*$/m, (line) => `${line}; ${products.length} JBS Billiards products (new)`)
manifest += `\n\n## JBS Billiards catalogue product images\n\n`
manifest += `Generate or upload one separate image for each path below. Recommended dimensions: **1000×1000 px**. Background: **pure solid #FFFFFF**. Use the corresponding product photo in the supplied JBS PDF as the visual reference. Isolate the named item only; remove page furniture, neighboring products, text, dimensions, logos, badges, prices, watermarks and shadows that obscure the product. Do not invent design details that are not visible in the source. The storefront displays a white fallback container until each file is uploaded.\n\n`
for (const product of products) {
  const path = product.images[0]
  const family = product.specifications.craft_family
  const prompt = `Using the matching JBS PDF product photo as reference, create a faithful, clean studio product photograph of ${product.name} (${family}). Show only this single product, centered and fully in frame on pure solid #FFFFFF; remove all text, price, SKU, dimensions, watermark, badge, page border, neighboring products and background objects; do not add features absent from the reference; 1000x1000 px.`
  manifest += `- **Exact file:** \`${path}\` · **Dimensions:** 1000×1000 px · **Background:** pure solid #FFFFFF · **Prompt:** ${prompt}\n`
}
fs.writeFileSync(manifestPath, manifest)
console.log(`Appended ${products.length} image specifications.`)
