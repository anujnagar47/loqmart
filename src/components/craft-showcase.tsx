import Image from "next/image"

const CRAFTS = [
  { name: "Pashmina weaving", region: "Kashmir", badge: "Artisan Handcrafted", image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=900&q=85", alt: "Fine woven wool textile" },
  { name: "Blue pottery", region: "Jaipur, Rajasthan", badge: "GI-Certified Origin", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85", alt: "Handmade glazed ceramic pottery" },
  { name: "Dokra metal casting", region: "Bastar, Chhattisgarh", badge: "Artisan Handcrafted", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=85", alt: "Traditional Indian metal craft" },
  { name: "Banarasi silk", region: "Varanasi, Uttar Pradesh", badge: "GI-Certified Origin", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85", alt: "Intricately patterned Indian silk textile" },
]

export function CraftShowcase() {
  return <section className="bg-white px-4 py-12 sm:px-6 lg:py-16" aria-labelledby="craft-showcase-title">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#725c00]">Made across India</p>
          <h2 id="craft-showcase-title" className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">Craft traditions, region by region</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CRAFTS.map(craft => <article key={craft.name} className="overflow-hidden border border-[#E5E7EB] bg-white">
          <div className="relative aspect-[4/3] bg-[#f3f3f3]">
            <Image src={craft.image} alt={craft.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" unoptimized className="object-cover" />
            <span className="absolute left-3 top-3 bg-white/95 px-2.5 py-1 text-xs font-medium text-[#111827]">{craft.region}</span>
          </div>
          <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-3">
            <h3 className="text-sm font-semibold text-[#111827]">{craft.name}</h3>
            <span className="shrink-0 border border-[#d0c6ac] px-2 py-1 text-[10px] font-medium text-[#725c00]">{craft.badge}</span>
          </div>
        </article>)}
      </div>
    </div>
  </section>
}

