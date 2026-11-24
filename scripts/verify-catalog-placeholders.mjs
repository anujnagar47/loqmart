import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = process.cwd()
const catalog = JSON.parse(await fs.readFile(path.join(root, "public/catalog-import.json"), "utf8"))
const seen = new Set()
for (const product of catalog.products) {
  const publicPath = product.images?.[0]
  if (!publicPath?.startsWith("/images/products/") || seen.has(publicPath)) throw new Error(`Invalid or repeated product path: ${product.slug}`)
  seen.add(publicPath)
  const file = path.join(root, "public", publicPath)
  const image = sharp(file)
  const metadata = await image.metadata()
  if (metadata.width !== 1200 || metadata.height !== 1500) throw new Error(`Unexpected dimensions: ${publicPath}`)
  const { data, info } = await image.extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  if (info.channels < 3 || data[0] !== 255 || data[1] !== 255 || data[2] !== 255) throw new Error(`Top-left pixel is not pure white: ${publicPath}`)
}
console.log(`Verified ${seen.size} unique catalog placeholders at 1200x1500; each sampled canvas corner is #FFFFFF.`)
