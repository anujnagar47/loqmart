import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

const placements = new Set(["home_hero","search_top","state_spotlight","product_partner"])

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  if (auth.role !== "admin") return NextResponse.json({ error: "Full admin access required" }, { status: 403 })
  const { data, error } = await auth.db.from("ad_campaigns").select("*").order("created_at", { ascending:false }).limit(300)
  if (error) return NextResponse.json({ error:error.message },{status:500})
  const campaigns = data || []
  const ids = campaigns.map(x=>x.id)
  const { data: events } = ids.length ? await auth.db.from("ad_events").select("campaign_id,event_type").in("campaign_id",ids) : {data:[] as any[]}
  return NextResponse.json({ campaigns: campaigns.map(c=>{ const rows=(events||[]).filter(e=>e.campaign_id===c.id); const impressions=rows.filter(e=>e.event_type==="impression").length; const clicks=rows.filter(e=>e.event_type==="click").length; return {...c,impressions,clicks,ctr:impressions?clicks/impressions*100:0} }) })
}

export async function POST(req:NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  if (auth.role !== "admin") return NextResponse.json({ error: "Full admin access required" }, { status: 403 })
  try {
    const body=await req.json()
    if (!placements.has(body.placement) || !["product","seller"].includes(body.adType) || !["active","scheduled","paused"].includes(body.status)) return NextResponse.json({error:"Invalid campaign settings"},{status:400})
    if (body.placement === "state_spotlight" && !/^[A-Z]{2,5}$/.test(String(body.stateCode || ""))) return NextResponse.json({error:"State spotlight campaigns need a state code"},{status:400})
    const start=new Date(body.startsAt), end=new Date(body.endsAt)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end<=start) return NextResponse.json({error:"Campaign end must be after its start"},{status:400})
    const productId=body.adType==="product"?body.targetId:null, sellerId=body.adType==="seller"?body.targetId:null
    if (body.adType==="product") { const {data}=await auth.db.from("products").select("id").eq("id",productId).eq("approval_status","approved").maybeSingle(); if(!data)return NextResponse.json({error:"Choose an approved product"},{status:400}) }
    if (body.adType==="seller") { const {data}=await auth.db.from("sellers").select("id").eq("id",sellerId).eq("approval_status","approved").maybeSingle(); if(!data)return NextResponse.json({error:"Choose an approved seller"},{status:400}) }
    const destination=String(body.destinationUrl||"")
    const safeDestination=destination.startsWith("/")&&!destination.startsWith("//")?destination.slice(0,500):null
    const {data,error}=await auth.db.from("ad_campaigns").insert({name:String(body.name||"").slice(0,120),ad_type:body.adType,placement:body.placement,target_product_id:productId,target_seller_id:sellerId,headline:String(body.headline||body.name||"").slice(0,160),body:String(body.body||"").slice(0,500),image_url:String(body.imageUrl||"").slice(0,1000)||null,cta_label:String(body.ctaLabel||"Explore now").slice(0,40),destination_url:safeDestination,state_code:String(body.stateCode||"").slice(0,5)||null,priority:Math.max(0,Math.min(Number(body.priority)||0,1000)),status:body.status,starts_at:start.toISOString(),ends_at:end.toISOString(),created_by:auth.userId}).select("id").single()
    if(error)throw error
    return NextResponse.json({id:data.id},{status:201})
  } catch(e) { console.error("Admin campaign create failed",e); return NextResponse.json({error:"Could not create campaign"},{status:500}) }
}
