"use client"

import Image from "next/image"
import { useState } from "react"

export function FallbackProductImage({ src, alt, sizes, className = "object-contain" }: { src?: string | null; alt: string; sizes: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <div role="img" aria-label={`${alt} image pending`} className="absolute inset-0 flex items-center justify-center bg-white text-center text-xs font-medium text-[#4d4632]/60">Product image pending</div>
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} onError={() => setFailed(true)} />
}
