import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  if (auth.role !== "admin") return NextResponse.json({ error: "Full admin access required" }, { status: 403 })
  const db = auth.db
  const since = new Date(Date.now() - 30 * 86400000).toISOString()
  const [eventsQ, sessionsQ, cartsQ, wishesQ, guestsQ, sellersQ, productsQ, ordersQ, campaignsQ] = await Promise.all([
    db.from("analytics_events").select("event_type,visitor_id,product_id,seller_id,state_code,created_at,metadata").gte("created_at", since).limit(20000),
    db.from("visitor_sessions").select("session_id,visitor_id,user_id,state_code,pincode,last_seen_at").gte("last_seen_at", since).limit(5000),
    db.from("cart_items").select("user_id,product_id,quantity,created_at,updated_at").limit(5000),
    db.from("wishlists").select("user_id,product_id,created_at").limit(5000),
    db.from("visitor_intent_items").select("session_id,visitor_id,item_type,product_id,quantity,added_at,updated_at").limit(5000),
    db.from("sellers").select("id,business_name,state,state_code,is_pro_seller").limit(1000),
    db.from("products").select("id,name,slug,price,images,seller_id,state_code,rating,review_count,categories(name),sellers(business_name)").eq("approval_status", "approved").limit(5000),
    db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", since),
    db.from("ad_campaigns").select("id", { count: "exact", head: true }).eq("status", "active").lte("starts_at", new Date().toISOString()).gte("ends_at", new Date().toISOString()),
  ])
  // Telemetry tables are installed through marketplace-intelligence.sql. Keep
  // the operational cart, wishlist, and product views usable before that
  // migration is applied; event counts remain zero until the table exists.
  const error = productsQ.error
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const events = eventsQ.data || [], products = productsQ.data || [], sessions = sessionsQ.data || []
  const productMap = new Map(products.map((p: any) => [p.id,p]))
  const liveWishlistCounts = new Map<string,number>()
  for (const item of wishesQ.data || []) liveWishlistCounts.set(item.product_id,(liveWishlistCounts.get(item.product_id)||0)+1)
  for (const item of (guestsQ.data || []).filter((x:any)=>x.item_type==="wishlist")) liveWishlistCounts.set(item.product_id,(liveWishlistCounts.get(item.product_id)||0)+1)
  const stats = new Map<string, any>()
  for (const e of events) if (e.product_id) {
    const x = stats.get(e.product_id) || { views: 0, visitors: new Set(), cart: 0, wishlist: 0, inquiry: 0 }
    if (e.event_type === "product_view") { x.views++; x.visitors.add(e.visitor_id) }
    if (e.event_type === "add_to_cart") x.cart++
    if (e.event_type === "wishlist_add") x.wishlist++
    if (e.event_type === "customization_inquiry") x.inquiry++
    stats.set(e.product_id, x)
  }
  const leaderboard = [...stats].map(([id,x]) => ({ ...(productMap.get(id) as any), totalViews:x.views, uniqueVisitors:x.visitors.size, cartAdds:x.cart, addToCartRate:x.views ? x.cart / x.views * 100 : 0, wishlistCount:liveWishlistCounts.get(id) || x.wishlist, inquiryCount:x.inquiry })).filter(x => x.id).sort((a,b) => b.totalViews-a.totalViews).slice(0,50)
  const ids = [...new Set([...((cartsQ.data || []).map((x:any)=>x.user_id)), ...((wishesQ.data || []).map((x:any)=>x.user_id))])]
  const { data: users } = ids.length ? await db.from("users").select("id,full_name,email,phone").in("id", ids) : { data: [] as any[] }
  const userMap = new Map((users || []).map((u:any)=>[u.id,u]))
  const grouped = new Map<string,any>()
  const addLine = (key:string, identity:any, product:any, qty:number, updated:string, location:any=null) => {
    if (!grouped.has(key)) grouped.set(key,{ key, customer:identity?.full_name || identity?.email || "Guest visitor", email:identity?.email || null, phone:identity?.phone || null, stateCode:location?.state_code || null, pincode:location?.pincode || null, items:[], total:0, lastActive:updated })
    const group=grouped.get(key); const p=productMap.get(product)
    if (p) { group.items.push({title:(p as any).name,quantity:qty,price:Number((p as any).price)}); group.total+=Number((p as any).price)*qty }
    if (updated > group.lastActive) group.lastActive=updated
  }
  for (const item of cartsQ.data || []) addLine(`user:${item.user_id}`,userMap.get(item.user_id),item.product_id,item.quantity,item.updated_at || item.created_at,sessions.filter((s:any)=>s.user_id===item.user_id).sort((a:any,b:any)=>b.last_seen_at.localeCompare(a.last_seen_at))[0])
  for (const item of (guestsQ.data || []).filter((x:any)=>x.item_type==="cart")) addLine(`session:${item.session_id}`,null,item.product_id,item.quantity,item.updated_at,sessions.find((s:any)=>s.session_id===item.session_id))
  const wishlistRows:any[] = []
  for (const item of wishesQ.data || []) { const p=productMap.get(item.product_id); if (p) wishlistRows.push({customer:(userMap.get(item.user_id) as any)?.full_name || (userMap.get(item.user_id) as any)?.email || "Customer",product:p,updatedAt:item.created_at}) }
  for (const item of (guestsQ.data || []).filter((x:any)=>x.item_type==="wishlist")) { const p=productMap.get(item.product_id); if (p) wishlistRows.push({customer:`Guest ${item.session_id.slice(0,8)}`,product:p,updatedAt:item.updated_at}) }
  const counts=new Map<string,number>(); wishlistRows.forEach(x=>counts.set(x.product.id,(counts.get(x.product.id)||0)+1))
  const sellers=(sellersQ.data||[]).map((s:any)=>({ ...s, views:events.filter((e:any)=>e.seller_id===s.id&&e.event_type==="product_view").length, cartAdds:events.filter((e:any)=>e.seller_id===s.id&&e.event_type==="add_to_cart").length, missedSearchDemand:events.filter((e:any)=>e.event_type==="search_submit"&&Number(e.metadata?.resultCount)===0&&e.state_code===s.state_code).length }))
  return NextResponse.json({ telemetryReady: !eventsQ.error, cartDataReady: !cartsQ.error && !guestsQ.error, wishlistDataReady: !wishesQ.error, kpis:{visitors:new Set(events.map((e:any)=>e.visitor_id)).size,views:events.filter((e:any)=>e.event_type==="product_view").length,cartValue:[...grouped.values()].reduce((n,x)=>n+x.total,0),wishlistedItems:wishlistRows.length,inquiriesOrders:events.filter((e:any)=>e.event_type==="customization_inquiry").length+(ordersQ.count||0),activeCampaigns:campaignsQ.count||0},leaderboard,carts:[...grouped.values()].sort((a,b)=>b.lastActive.localeCompare(a.lastActive)),wishlists:wishlistRows,mostWishlisted:[...counts].map(([id,count])=>({product:productMap.get(id),count})).filter(x=>x.product).sort((a,b)=>b.count-a.count).slice(0,20),sellers })
}
