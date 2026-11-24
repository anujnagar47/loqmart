import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { INDIA_STATE_DATA } from "@/lib/indiaStateData"
import { Redis } from "@upstash/redis"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const demandRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null
const DEMAND_REQUESTS_KEY = "loqmart:customer-demand-requests:v1"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { data, error } = await auth.db.from("customer_demand_requests")
    .select("id,requested_item,category,state_code,created_at")
    .order("created_at", { ascending: false }).limit(5000)
  if (error) {
    if (error.code === "42P01" || /schema cache/i.test(error.message)) {
      if (!demandRedis) return NextResponse.json({ ready: false, requests: [], categories: [], states: [], message: "Demand request storage is not configured." })
      try {
        const rows = await demandRedis.lrange<string>(DEMAND_REQUESTS_KEY, 0, 4999)
        const data = rows.map(row => typeof row === "string" ? JSON.parse(row) : row) as Array<{ requested_item: string; category: string; state_code: string | null }>
        return NextResponse.json(summarizeDemand(data))
      } catch {
        return NextResponse.json({ ready: false, requests: [], categories: [], states: [], message: "Could not load demand requests." }, { status: 500 })
      }
    }
    return NextResponse.json({ error: "Could not load customer demand." }, { status: 500 })
  }
  return NextResponse.json(summarizeDemand(data || []))
}

function summarizeDemand(data: Array<{ requested_item: string; category: string; state_code: string | null }>) {
  const byKey = new Map<string, { item: string; category: string; count: number; states: Map<string, number> }>()
  for (const row of data) {
    const key = `${row.category}\0${row.requested_item.toLowerCase()}`
    const item = byKey.get(key) || { item: row.requested_item, category: row.category, count: 0, states: new Map<string, number>() }
    item.count++
    const state = INDIA_STATE_DATA.find(entry => entry.id === row.state_code)?.name || row.state_code || "Unspecified"
    item.states.set(state, (item.states.get(state) || 0) + 1)
    byKey.set(key, item)
  }
  const requests = [...byKey.values()].map(row => ({ ...row, states: [...row.states].map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count) })).sort((a, b) => b.count - a.count).slice(0, 100)
  const categories = new Map<string, number>(), states = new Map<string, number>()
  for (const request of requests) {
    categories.set(request.category, (categories.get(request.category) || 0) + request.count)
    for (const state of request.states) states.set(state.state, (states.get(state.state) || 0) + state.count)
  }
  return { ready: true, requests, categories: [...categories].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count), states: [...states].map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count) }
}
