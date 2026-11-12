"use client"

import { useEffect, useState, useMemo } from "react"
import { Users, Share2, Tag, TrendingUp, RefreshCw, Download, Award, MapPin } from "lucide-react"

interface TallyItem { value: string; count: number }
interface Stats {
  q1: TallyItem[]; q2: TallyItem[]; q3: TallyItem[]
  q4: TallyItem[]; q5: TallyItem[]; q6: TallyItem[]
  total_referrals: number; codes_issued: number; codes_used: number
}
interface SurveyResponse {
  id: string; email: string; name: string; city_state: string
  referral_code: string; referral_count: number
  milestones_reached: string[]; created_at: string
}

const Q_LABELS: Record<string, string> = {
  q1: "Shopping Frequency",
  q2: "Finding Indian Products on Amazon",
  q3: "Amazon Pricing vs Quality",
  q4: "Would Choose Verified Indian Platform",
  q5: "What Matters When Buying Indian",
  q6: "Willing to Pay Premium for Indian Made",
}

// ── SVG sparkline ──────────────────────────────────────────────

function TimelineChart({ responses }: { responses: SurveyResponse[] }) {
  const data = useMemo(() => {
    const buckets: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      buckets[d.toISOString().slice(0, 10)] = 0
    }
    for (const r of responses) {
      const day = r.created_at?.slice(0, 10)
      if (day && day in buckets) buckets[day]++
    }
    return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  }, [responses])

  const max = Math.max(...data.map(d => d.count), 1)
  const W = 500, H = 72, PX = 4, PY = 6
  const pts = data.map((d, i) => ({
    x: PX + (i / (data.length - 1)) * (W - PX * 2),
    y: H - PY - (d.count / max) * (H - PY * 2),
    count: d.count,
    label: d.date.slice(5),
  }))
  const line = pts.map(p => `${p.x},${p.y}`).join(" ")
  const area = `${PX},${H - PY} ${line} ${W - PX},${H - PY}`
  const hasData = data.some(d => d.count > 0)

  if (!hasData) {
    return <div className="h-20 flex items-center justify-center text-[12px] text-[#111827]/25">No submissions yet</div>
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="tl-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FACC15" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FACC15" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#tl-grad)" />
        <polyline points={line} fill="none" stroke="#FACC15" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />
        {pts.filter(p => p.count > 0).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#FACC15" stroke="white" strokeWidth="1" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[9px] text-[#111827]/25">{pts[0]?.label}</span>
        <span className="text-[9px] text-[#111827]/25">today</span>
      </div>
    </div>
  )
}

// ── Bar chart ──────────────────────────────────────────────────

function BarChart({ data, total, accent = "#FACC15" }: { data: TallyItem[]; total: number; accent?: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="space-y-3">
      {data.map(({ value, count }) => {
        const barPct    = Math.round((count / max)   * 100)
        const ofTotal   = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={value}>
            <div className="flex items-start justify-between mb-1 gap-2">
              <span className="text-[11px] text-[#111827]/60 leading-tight flex-1">{value}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-black text-[#111827]">{count}</span>
                <span className="text-[10px]" style={{ color: "rgba(17,24,39,0.3)" }}>{ofTotal}%</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${barPct}%`, background: accent }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Funnel bar ─────────────────────────────────────────────────

function FunnelRow({ label, count, base, color }: { label: string; count: number; base: number; color: string }) {
  const pct = base > 0 ? Math.round((count / base) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10.5px] text-[#111827]/55">{label}</span>
        <span className="text-[10.5px] font-black text-[#111827]">
          {count} <span className="text-[9px] font-normal text-[#111827]/30">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Pill ───────────────────────────────────────────────────────

function Pill({ label }: { label: string }) {
  return (
    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: "rgba(250,204,21,0.15)", color: "#111827" }}>
      {label.replace(/_/g, " ")}
    </span>
  )
}

const timeAgo = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 60000)    return "just now"
  if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
  return `${Math.floor(d / 86400000)}d ago`
}

// ── Page ───────────────────────────────────────────────────────

export default function AdminSurveyPage() {
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState("")
  const [tab,       setTab]       = useState<"overview" | "questions" | "responses">("overview")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/survey?limit=500")
      if (res.ok) {
        const d = await res.json()
        setStats(d.stats)
        setResponses(d.responses || [])
        setTotal(d.total || 0)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Derived ──────────────────────────────────────────────────

  const topCities = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of responses) if (r.city_state) m[r.city_state] = (m[r.city_state] || 0) + 1
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [responses])

  const topReferrers = useMemo(() =>
    [...responses].filter(r => r.referral_count > 0)
      .sort((a, b) => b.referral_count - a.referral_count).slice(0, 8),
    [responses])

  const funnelCounts = useMemo(() => ({
    submitted:  total,
    anyRef:     responses.filter(r => r.referral_count > 0).length,
    m10:        responses.filter(r => (r.milestones_reached || []).includes("10_referrals")).length,
    m20:        responses.filter(r => (r.milestones_reached || []).includes("20_referrals")).length,
    m40:        responses.filter(r => (r.milestones_reached || []).includes("40_referrals")).length,
  }), [responses, total])

  const filtered = responses.filter(r =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.city_state?.toLowerCase().includes(search.toLowerCase()) ||
    r.referral_code?.toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    const headers = ["Name", "Email", "City/State", "Referral Code", "Referrals", "Milestones", "Submitted At"]
    const rows = responses.map(r => [
      r.name, r.email, r.city_state, r.referral_code,
      r.referral_count,
      (r.milestones_reached || []).join("; "),
      new Date(r.created_at).toLocaleString("en-IN"),
    ])
    const csv  = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `loqmart-survey-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="p-7 min-h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-black text-[#111827] tracking-tight leading-none">Survey Analytics</h1>
          <p className="text-[12px] text-[#111827]/40 font-medium mt-1.5">Pre-launch survey · referral tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "rgba(17,24,39,0.07)", color: "#111827" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(17,24,39,0.12)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(17,24,39,0.07)"}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black"
            style={{ background: "#FACC15", color: "#111827" }}>
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Responses", value: loading ? "—" : total.toLocaleString("en-IN"),                              icon: Users,      color: "#FACC15" },
          { label: "Total Referrals", value: loading ? "—" : (stats?.total_referrals || 0).toLocaleString("en-IN"),      icon: Share2,     color: "#22c55e" },
          { label: "Codes Issued",    value: loading ? "—" : (stats?.codes_issued    || 0).toLocaleString("en-IN"),      icon: Tag,        color: "#3b82f6" },
          { label: "Codes Redeemed",  value: loading ? "—" : (stats?.codes_used      || 0).toLocaleString("en-IN"),      icon: TrendingUp, color: "#a855f7" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="ag-card-stat rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-[26px] font-black text-[#111827] leading-none tracking-tight">{value}</p>
            <p className="text-[10.5px] text-[#111827]/40 font-semibold mt-1.5 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {(["overview", "questions", "responses"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-[12px] font-black capitalize transition-all"
            style={{
              borderBottom: tab === t ? "2px solid #FACC15" : "2px solid transparent",
              color: tab === t ? "#111827" : "rgba(17,24,39,0.38)",
              marginBottom: -1,
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="space-y-5">

          {/* Submissions timeline */}
          <div className="ag-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30">
                Submissions — last 30 days
              </h3>
              {!loading && (
                <span className="text-[11px] font-black text-[#111827]">
                  {responses.filter(r => {
                    const d = new Date(r.created_at)
                    return Date.now() - d.getTime() < 7 * 86400000
                  }).length}
                  <span className="text-[10px] font-normal text-[#111827]/35 ml-1">this week</span>
                </span>
              )}
            </div>
            {loading
              ? <div className="h-20 ag-shimmer rounded-xl" />
              : <TimelineChart responses={responses} />
            }
          </div>

          {/* Row: Geographic + Top referrers + Milestone funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Top locations */}
            <div className="ag-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={12} style={{ color: "#111827" }} />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30">Top Locations</h3>
              </div>
              {loading ? (
                <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-6 ag-shimmer rounded-lg" />)}</div>
              ) : topCities.length === 0 ? (
                <p className="text-[12px] text-[#111827]/25 py-4 text-center">No data yet</p>
              ) : (
                <div className="space-y-2.5">
                  {topCities.map(([city, count], i) => {
                    const maxCount = topCities[0][1]
                    const pct = Math.round((count / maxCount) * 100)
                    return (
                      <div key={city}>
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] font-black text-[#111827]/22 w-3.5 shrink-0">{i + 1}</span>
                            <span className="text-[11px] text-[#111827]/65 truncate">{city}</span>
                          </div>
                          <span className="text-[11px] font-black text-[#111827] ml-2 shrink-0">{count}</span>
                        </div>
                        <div className="h-1 rounded-full ml-5 overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: "rgba(234,179,8,0.3)" }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top referrers */}
            <div className="ag-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award size={12} style={{ color: "#22c55e" }} />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30">Top Referrers</h3>
              </div>
              {loading ? (
                <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-8 ag-shimmer rounded-lg" />)}</div>
              ) : topReferrers.length === 0 ? (
                <p className="text-[12px] text-[#111827]/25 py-4 text-center">No referrals yet</p>
              ) : (
                <div className="space-y-2.5">
                  {topReferrers.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-2.5">
                      <span className="text-[9px] font-black text-[#111827]/22 w-3.5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-[#111827] truncate leading-tight">{r.name}</p>
                        <p className="text-[9px] font-mono text-[#111827]/70">{r.referral_code}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[13px] font-black text-[#22c55e]">{r.referral_count}</span>
                        {(r.milestones_reached || []).length > 0 && (
                          <p className="text-[8px] text-[#111827]/30 uppercase tracking-wide">
                            {(r.milestones_reached || []).length} milestone{(r.milestones_reached || []).length > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Referral funnel */}
            <div className="ag-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={12} style={{ color: "#a855f7" }} />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30">Referral Funnel</h3>
              </div>
              {loading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-7 ag-shimmer rounded-lg" />)}</div>
              ) : (
                <div className="space-y-3">
                  <FunnelRow label="Submitted survey"     count={funnelCounts.submitted} base={funnelCounts.submitted} color="#FACC15" />
                  <FunnelRow label="Made ≥ 1 referral"   count={funnelCounts.anyRef}    base={funnelCounts.submitted} color="#fb923c" />
                  <FunnelRow label="10 referrals (50% off)" count={funnelCounts.m10}    base={funnelCounts.submitted} color="#22c55e" />
                  <FunnelRow label="20 referrals (+delivery)" count={funnelCounts.m20}  base={funnelCounts.submitted} color="#3b82f6" />
                  <FunnelRow label="40 referrals (free order)" count={funnelCounts.m40} base={funnelCounts.submitted} color="#a855f7" />
                </div>
              )}
            </div>

          </div>

          {/* Row: q4 + q6 spotlight charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="ag-card rounded-2xl p-5">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30 mb-4">
                Would choose verified Indian platform?
              </h3>
              {loading
                ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-7 ag-shimmer rounded-lg" />)}</div>
                : <BarChart data={stats?.q4 || []} total={(stats?.q4 || []).reduce((s, d) => s + d.count, 0)} accent="#22c55e" />
              }
            </div>
            <div className="ag-card rounded-2xl p-5">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30 mb-4">
                Willing to pay premium for Indian made?
              </h3>
              {loading
                ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-7 ag-shimmer rounded-lg" />)}</div>
                : <BarChart data={stats?.q6 || []} total={(stats?.q6 || []).reduce((s, d) => s + d.count, 0)} accent="#a855f7" />
              }
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════
          QUESTIONS TAB
      ══════════════════════════════════════════ */}
      {tab === "questions" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {(["q1", "q2", "q3", "q4", "q5", "q6"] as const).map(key => {
            const data = stats?.[key] || []
            const sum  = data.reduce((s, d) => s + d.count, 0)
            const accents: Record<string, string> = {
              q1: "#FACC15", q2: "#fb923c", q3: "#f87171",
              q4: "#22c55e", q5: "#3b82f6", q6: "#a855f7",
            }
            return (
              <div key={key} className="ag-card rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30 leading-tight flex-1 pr-4">
                    {Q_LABELS[key]}
                  </h3>
                  <span className="text-[10px] font-black text-[#111827]/25 shrink-0">{sum} responses</span>
                </div>
                {loading
                  ? <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-7 ag-shimmer rounded-lg" />)}</div>
                  : data.length === 0
                    ? <p className="text-[12px] text-[#111827]/25 py-4 text-center">No data yet</p>
                    : <BarChart data={data} total={sum} accent={accents[key]} />
                }
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════
          RESPONSES TAB
      ══════════════════════════════════════════ */}
      {tab === "responses" && (
        <div className="ag-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <h2 className="text-[13px] font-black text-[#111827]">
              All Responses
              <span className="ml-2 text-[10.5px] font-bold text-[#111827]/30">({total})</span>
            </h2>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, code…"
              className="w-56 px-3 py-1.5 rounded-xl text-[12px] outline-none"
              style={{ border: "1px solid rgba(0,0,0,0.09)", background: "#FBF9F5" }}
            />
          </div>

          {loading ? (
            <div className="px-5 py-8 space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-10 rounded-xl ag-shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-14 text-[12px] text-[#111827]/30">No responses found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    {["Name", "Email", "City / State", "Referral Code", "Referrals", "Milestones", "When"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest whitespace-nowrap"
                        style={{ color: "rgba(17,24,39,0.28)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}
                      className="hover:bg-[#FACC15]/5 transition-colors">
                      <td className="px-5 py-3 font-bold text-[12px] text-[#111827]">{r.name}</td>
                      <td className="px-5 py-3 text-[11px] text-[#111827]/55">{r.email}</td>
                      <td className="px-5 py-3 text-[11px] text-[#111827]/55">{r.city_state}</td>
                      <td className="px-5 py-3">
                        <code className="text-[11px] font-black text-[#111827]">{r.referral_code}</code>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[12px] font-black"
                          style={{ color: r.referral_count > 0 ? "#22c55e" : "rgba(17,24,39,0.3)" }}>
                          {r.referral_count || 0}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(r.milestones_reached || []).length === 0
                            ? <span className="text-[10px] text-[#111827]/22">—</span>
                            : (r.milestones_reached || []).map(m => <Pill key={m} label={m} />)
                          }
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[10.5px] text-[#111827]/35 whitespace-nowrap">{timeAgo(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
