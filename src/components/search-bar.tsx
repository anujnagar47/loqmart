"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { trackMarketplaceEvent } from "@/lib/analyticsTracker"
import Link from "next/link"
import Image from "next/image"
import { Search, X, Clock, Loader2, PackageSearch, MapPinned, Shapes } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"

const RECENT_KEY = "loqmart-recent-searches"
const MAX_RECENT = 5

interface Suggestion {
  id: string
  label: string
  detail?: string
  href: string
  image?: string | null
}

type SuggestionGroups = { products: Suggestion[]; sellers: Suggestion[]; states: Suggestion[]; categories: Suggestion[] }

export function SearchBar({ variant = "desktop", autoFocus = false, onNavigate }: {
  variant?: "desktop" | "mobile"
  autoFocus?: boolean
  onNavigate?: () => void
}) {
  const router = useRouter()
  const { t } = useLanguage()
  const [query,       setQuery]       = useState("")
  const [open,        setOpen]        = useState(false)
  const [groups, setGroups] = useState<SuggestionGroups>({ products: [], sellers: [], states: [], categories: [] })
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
      queueMicrotask(() => { setGroups({ products: [], sellers: [], states: [], categories: [] }); setResultCount(null); setLoading(false) })
      return
    }

    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) setLoading(true) })

    debounceRef.current = setTimeout(() => {
      fetch(`/api/catalog-search?q=${encodeURIComponent(trimmed)}&limit=6`, { signal: controller.signal })
        .then(r => r.ok ? r.json() : null)
        .then(d => { setGroups(d?.groups || { products: [], sellers: [], states: [], categories: [] }); setResultCount(d?.total ?? 0) })
        .catch(() => { if (!controller.signal.aborted) { setGroups({ products: [], sellers: [], states: [], categories: [] }); setResultCount(null) } })
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
    trackMarketplaceEvent("search_submit", { query: trimmed, ...(resultCount !== null && resultCount !== undefined ? { resultCount } : {}) })
    saveRecent(trimmed)
    setOpen(false)
    setQuery("")
    onNavigate?.()
    router.push(`/catalog?q=${encodeURIComponent(trimmed)}`)
  }

  const trimmedQuery = query.trim()
  const showDropdown = open && (trimmedQuery.length > 0 || recent.length > 0)

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={e => { e.preventDefault(); submitSearch(query) }}
        className={variant === "desktop"
          ? "flex items-stretch bg-white rounded-[4px] overflow-hidden gap-0 border border-[#111827]/15"
          : "flex items-center bg-[#111827]/10 rounded-lg px-3 py-2 gap-2"}
      >
        {variant === "mobile" && <Search className="w-4 h-4 text-[#111827]/50 shrink-0" />}
        <input
          autoFocus={autoFocus}
          className={`bg-transparent border-none focus:ring-0 text-sm placeholder-[#111827]/40 text-[#111827] focus:outline-none ${
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
            className="shrink-0 w-11 flex items-center justify-center bg-[#FACC15] hover:bg-[#f0c700] transition-colors border-l border-[#111827]/15">
            <Search className="w-4 h-4 text-[#111827]" />
          </button>
        )}
        {variant === "mobile" && query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
            <X className="w-4 h-4 text-[#111827]/40" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-96 top-full mt-1 bg-white rounded-[4px] shadow-xl border border-[#111827]/10 z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          {trimmedQuery.length === 0 && recent.length > 0 && (
            <div className="p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#111827]/35 px-2 mb-1.5">Recent Searches</p>
              {recent.map(r => (
                <button key={r} type="button" onClick={() => submitSearch(r)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-[#ffffff] transition-colors text-left group">
                  <span className="flex items-center gap-2 text-sm text-[#111827]/70 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-[#111827]/30 shrink-0" />
                    <span className="truncate">{r}</span>
                  </span>
                  <span onClick={(e) => removeRecent(r, e)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0">
                    <X className="w-3 h-3 text-[#111827]/30" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {trimmedQuery.length > 0 && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#111827]/30" />
                </div>
              ) : Object.values(groups).every(group => group.length === 0) ? (
                <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                  <PackageSearch className="w-7 h-7 text-[#111827]/20" />
                  <p className="text-sm font-semibold text-[#111827]/50">No products found for &quot;{trimmedQuery}&quot;</p>
                  <p className="text-xs text-[#111827]/35">Try another search or tell us what you would like us to onboard.</p>
                  <button type="button" onClick={() => { window.dispatchEvent(new CustomEvent("loqmart:request-demand", { detail: { query: trimmedQuery, source: "search" } })); setOpen(false) }} className="mt-1 rounded-md bg-[#fcd020] px-3 py-2 text-xs font-bold text-[#231b00]">Request this item</button>
                </div>
              ) : (
                <>
                  <div className="py-1.5">
                    {([
                      ["Products", groups.products, PackageSearch],
                      ["States", groups.states, MapPinned], ["Categories", groups.categories, Shapes],
                    ] as const).map(([title, items, Icon]) => items.length > 0 && <section key={title} className="py-1">
                      <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#4d4632]/60">{title}</p>
                      {items.map(item => <Link key={item.id} href={item.href} onClick={() => { trackMarketplaceEvent("search_click", { query: trimmedQuery, source: title }); saveRecent(trimmedQuery); onNavigate?.(); setOpen(false); setQuery("") }} className="flex items-center gap-3 px-3 py-2 hover:bg-[#f3f3f3]">
                        {item.image ? <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-[#d0c6ac] bg-white"><Image src={item.image} alt="" fill sizes="36px" className="object-contain" /></span> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#f3f3f3] text-[#725c00]"><Icon className="h-4 w-4" /></span>}
                        <span className="min-w-0"><span className="block truncate text-[13px] font-semibold text-[#1a1c1c]">{item.label}</span>{item.detail && <span className="block truncate text-xs text-[#4d4632]">{item.detail}</span>}</span>
                      </Link>)}
                    </section>)}
                  </div>
                  <button type="button" onClick={() => submitSearch(trimmedQuery)}
                    className="w-full text-center py-3 text-xs font-black uppercase tracking-wider text-[#111827] border-t border-[#111827]/8 hover:bg-[#ffffff] transition-colors">
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
