"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, X, Clock, Loader2, PackageSearch } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"

const RECENT_KEY = "loqmart-recent-searches"
const MAX_RECENT = 5

interface Suggestion {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
}

export function SearchBar({ variant = "desktop", autoFocus = false, onNavigate }: {
  variant?: "desktop" | "mobile"
  autoFocus?: boolean
  onNavigate?: () => void
}) {
  const router = useRouter()
  const { t } = useLanguage()
  const [query,       setQuery]       = useState("")
  const [open,        setOpen]        = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [resultCount, setResultCount] = useState<number | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [recent,      setRecent]      = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()

    if (!trimmed) {
      queueMicrotask(() => { setSuggestions([]); setResultCount(null); setLoading(false) })
      return
    }

    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) setLoading(true) })

    debounceRef.current = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(trimmed)}&limit=6`, { signal: controller.signal })
        .then(r => r.ok ? r.json() : null)
        .then(d => { setSuggestions(d?.products || []); setResultCount(d?.total ?? 0) })
        .catch(() => { if (!controller.signal.aborted) { setSuggestions([]); setResultCount(null) } })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); controller.abort() }
  }, [query])

  function saveRecent(q: string) {
    try {
      const next = [q, ...recent.filter(r => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT)
      setRecent(next)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch { /* non-critical */ }
  }

  function removeRecent(q: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    const next = recent.filter(r => r !== q)
    setRecent(next)
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { /* non-critical */ }
  }

  function submitSearch(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    saveRecent(trimmed)
    setOpen(false)
    setQuery("")
    onNavigate?.()
    router.push(`/category?search=${encodeURIComponent(trimmed)}`)
  }

  const trimmedQuery = query.trim()
  const showDropdown = open && (trimmedQuery.length > 0 || recent.length > 0)

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={e => { e.preventDefault(); submitSearch(query) }}
        className={variant === "desktop"
          ? "flex items-stretch bg-white rounded-[4px] overflow-hidden gap-0 border border-[#1a1c1c]/15"
          : "flex items-center bg-[#1a1c1c]/10 rounded-lg px-3 py-2 gap-2"}
      >
        {variant === "mobile" && <Search className="w-4 h-4 text-[#1a1c1c]/50 shrink-0" />}
        <input
          autoFocus={autoFocus}
          className={`bg-transparent border-none focus:ring-0 text-sm placeholder-[#1a1c1c]/40 text-[#1a1c1c] focus:outline-none ${
            variant === "desktop" ? "flex-1 min-w-0 px-3.5 h-10" : "flex-1"
          }`}
          placeholder={t("header.searchPlaceholder")}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        {variant === "desktop" && (
          <button type="submit" aria-label="Search"
            className="shrink-0 w-11 flex items-center justify-center bg-[#fcd020] hover:bg-[#f0c700] transition-colors border-l border-[#1a1c1c]/15">
            <Search className="w-4 h-4 text-[#1a1c1c]" />
          </button>
        )}
        {variant === "mobile" && query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
            <X className="w-4 h-4 text-[#1a1c1c]/40" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-96 top-full mt-1 bg-white rounded-[4px] shadow-xl border border-[#1a1c1c]/10 z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          {trimmedQuery.length === 0 && recent.length > 0 && (
            <div className="p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/35 px-2 mb-1.5">Recent Searches</p>
              {recent.map(r => (
                <button key={r} type="button" onClick={() => submitSearch(r)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-[#f8f5f0] transition-colors text-left group">
                  <span className="flex items-center gap-2 text-sm text-[#1a1c1c]/70 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-[#1a1c1c]/30 shrink-0" />
                    <span className="truncate">{r}</span>
                  </span>
                  <span onClick={(e) => removeRecent(r, e)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0">
                    <X className="w-3 h-3 text-[#1a1c1c]/30" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {trimmedQuery.length > 0 && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#1a1c1c]/30" />
                </div>
              ) : suggestions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                  <PackageSearch className="w-7 h-7 text-[#1a1c1c]/20" />
                  <p className="text-sm font-semibold text-[#1a1c1c]/50">No products found for &quot;{trimmedQuery}&quot;</p>
                  <p className="text-xs text-[#1a1c1c]/35">Try a different word or browse categories instead.</p>
                </div>
              ) : (
                <>
                  <div className="py-1.5">
                    {suggestions.map(p => (
                      <Link key={p.id} href={`/product/${p.slug}`} onClick={() => { saveRecent(trimmedQuery); onNavigate?.(); setOpen(false); setQuery("") }}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-[#f8f5f0] transition-colors">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#f0ede8]">
                          {p.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#1a1c1c] truncate">{p.name}</p>
                          <p className="text-xs text-[#725c00] font-bold">{formatCurrency(p.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <button type="button" onClick={() => submitSearch(trimmedQuery)}
                    className="w-full text-center py-3 text-xs font-black uppercase tracking-wider text-[#1a1c1c] border-t border-[#1a1c1c]/8 hover:bg-[#f8f5f0] transition-colors">
                    View all {resultCount ?? ""} result{resultCount === 1 ? "" : "s"} for &quot;{trimmedQuery}&quot;
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
