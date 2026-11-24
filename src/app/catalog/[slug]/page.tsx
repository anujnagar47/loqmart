import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CATALOG_PRODUCTS, CATALOG_SELLERS, CATALOG_STATES, PENDING_CATALOG_SELLER_IDS, type CatalogProduct } from "@/lib/catalog-search"
import { FallbackProductImage } from "@/components/fallback-product-image"
import { CustomizationRequest } from "@/components/customization-request"
import { ProductViewBeacon } from "@/components/product-view-beacon"

export function generateStaticParams() {
  return CATALOG_PRODUCTS.map(product => ({ slug: product.slug }))
}

export default async function CatalogProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = CATALOG_PRODUCTS.find(item => item.slug === slug) as CatalogProduct | undefined
  if (!product) notFound()
  const specs = product.specifications as Record<string, string>
  const seller = CATALOG_SELLERS[product.seller_id] || "Catalog seller"
  const state = product.state_code ? CATALOG_STATES[product.state_code] || product.state_code : "State not specified"
  const region = specs.origin || "Not specified in source"
  const variants = (() => {
    try { return JSON.parse(specs.variants || "[]") as { name: string; price: number }[] }
    catch { return [] }
  })()

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductViewBeacon slug={product.slug} />
      <nav className="mb-5 text-sm text-[#4d4632]"><Link href="/catalog" className="hover:underline">Catalog</Link><span className="mx-2">/</span>{product.name}</nav>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
        <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg border border-[#d0c6ac] bg-white p-6">
          <FallbackProductImage src={product.images?.[0]} alt={product.name} sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain p-5" />
        </div>
        <section className="py-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#725c00]">{specs.craft_family || "Regional craft"}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1a1c1c]">{product.name}</h1>
          <p className="mt-3 text-sm leading-6 text-[#4d4632]">{product.description}</p>
          <div className="mt-5 border-y border-[#d0c6ac] py-4">
            <p className="text-2xl font-bold text-[#1a1c1c]">{product.price > 0 ? `₹${new Intl.NumberFormat("en-IN").format(product.price)}` : "Price on request"}</p>
            <p className="mt-1 text-xs text-[#4d4632]">{product.price > 0 ? "Catalog price includes the 10% markup requested for this import. Confirm current availability with the seller." : "The source catalog does not state a price. Request a quote from the seller."}</p>
            {variants.length > 0 && <ul className="mt-3 space-y-1 text-sm text-[#4d4632]">{variants.map(variant => <li key={variant.name}>{variant.name}: <strong className="text-[#1a1c1c]">₹{new Intl.NumberFormat("en-IN").format(variant.price)}</strong></li>)}</ul>}
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div><dt className="text-xs text-[#4d4632]">Seller</dt><dd className="mt-1 font-semibold">{seller}{PENDING_CATALOG_SELLER_IDS.has(product.seller_id) ? " · verification pending" : ""}</dd></div>
            <div><dt className="text-xs text-[#4d4632]">Region / State</dt><dd className="mt-1 font-semibold">{region} · {state}</dd></div>
            <div><dt className="text-xs text-[#4d4632]">SKU</dt><dd className="mt-1 font-semibold">{specs.catalogue_code || product.slug}</dd></div>
            <div><dt className="text-xs text-[#4d4632]">Stock</dt><dd className="mt-1 font-semibold">Confirm with seller</dd></div>
            {Object.entries(specs).filter(([key]) => !["variants", "pdf_base_price", "price_rule", "price_status", "catalogue", "catalogue_code", "craft_family", "origin", "source_state"].includes(key)).map(([key, value]) => <div key={key}><dt className="text-xs capitalize text-[#4d4632]">{key.replaceAll("_", " ")}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
            <div><dt className="text-xs text-[#4d4632]">Delivery estimate</dt><dd className="mt-1 font-semibold">Provided after pincode confirmation</dd></div>
          </dl>
          <Link href="/contact" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#fcd020] px-5 text-sm font-bold text-[#231b00] hover:bg-[#e9bf0d]">Ask seller about this product</Link>
          <CustomizationRequest product={{ slug: product.slug, name: product.name }} />
          {product.state_code && <Link href={`/state/${state.toLowerCase().replaceAll(" ", "-")}`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#d0c6ac] px-5 text-sm font-semibold text-[#1a1c1c]">Explore {state} storefront</Link>}
        </section>
      </div>
    </main>
  )
}
