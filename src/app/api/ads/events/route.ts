import { NextRequest,NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function POST(req:NextRequest) {
  if(req.cookies.get("loqmart_analytics_consent")?.value!=="accepted")return NextResponse.json({ok:true})
  try { const b=await req.json(); if(typeof b.campaignId!=="string"||!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(b.campaignId)||!["impression","click"].includes(b.eventType))return NextResponse.json({error:"Invalid event"},{status:400}); const db=createServiceClient(),now=new Date().toISOString(); const {data}=await db.from("ad_campaigns").select("id").in("status",["active","scheduled"]).lte("starts_at",now).gte("ends_at",now).eq("id",b.campaignId).maybeSingle(); if(!data)return NextResponse.json({ok:true}); const visitor=typeof b.visitorId==="string"&&/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(b.visitorId)?b.visitorId:"00000000-0000-4000-8000-000000000000"; await db.from("ad_events").insert({campaign_id:b.campaignId,visitor_id:visitor,event_type:b.eventType}); return NextResponse.json({ok:true}) } catch { return NextResponse.json({ok:true}) }
}
