import { NextRequest,NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export const dynamic="force-dynamic"

export async function GET(req:NextRequest) {
  const placement=req.nextUrl.searchParams.get("placement")||"", stateCode=req.nextUrl.searchParams.get("state_code"), slug=req.nextUrl.searchParams.get("slug")
  const db=createServiceClient(), now=new Date().toISOString()
  let query=db.from("ad_campaigns").select("id,name,ad_type,placement,target_product_id,target_seller_id,headline,body,image_url,cta_label,destination_url,state_code,priority,starts_at,ends_at").eq("placement",placement).in("status",["active","scheduled"]).lte("starts_at",now).gte("ends_at",now).order("priority",{ascending:false}).limit(20)
  if(stateCode)query=query.eq("state_code",stateCode)
  const {data,error}=await query
  if(error)return NextResponse.json({campaign:null})
  const campaigns=data||[]
  const eligible:any[]=[]
  for(const campaign of campaigns) {
    if(campaign.ad_type==="product") { const {data:p}=await db.from("products").select("id,slug,name,price,images,approval_status").eq("id",campaign.target_product_id).maybeSingle(); if(!p||p.approval_status!=="approved"||p.slug===slug)continue; eligible.push({...campaign,image_url:campaign.image_url||p.images?.[0]||null,destination_url:campaign.destination_url||`/product/${p.slug}`,product:{name:p.name,price:p.price,slug:p.slug}}) }
    else { const {data:s}=await db.from("sellers").select("id,store_name,business_name,banner_url,approval_status").eq("id",campaign.target_seller_id).maybeSingle(); if(!s||s.approval_status!=="approved")continue; const {data:p}=await db.from("products").select("slug,name,price,images").eq("seller_id",s.id).eq("approval_status","approved").order("is_featured",{ascending:false}).limit(1).maybeSingle(); eligible.push({...campaign,image_url:campaign.image_url||p?.images?.[0]||s.banner_url||null,destination_url:campaign.destination_url||`/seller/${s.id}`,product:p?{name:p.name,price:p.price,slug:p.slug}:undefined}) }
    if(placement!=="search_top"&&eligible.length)break
  }
  return placement==="search_top"?NextResponse.json({campaigns:eligible.slice(0,3)}):NextResponse.json({campaign:eligible[0]||null})
}
