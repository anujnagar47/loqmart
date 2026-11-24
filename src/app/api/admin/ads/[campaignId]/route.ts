import { NextRequest,NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function PATCH(req:NextRequest,{params}:{params:Promise<{campaignId:string}>}) {
  const auth=await requireAdmin(); if(!auth.authorized)return auth.response
  if(auth.role!=="admin")return NextResponse.json({error:"Full admin access required"},{status:403})
  const {campaignId}=await params; const body=await req.json()
  if(!["active","scheduled","paused"].includes(body.status))return NextResponse.json({error:"Invalid status"},{status:400})
  const {error}=await auth.db.from("ad_campaigns").update({status:body.status,updated_at:new Date().toISOString()}).eq("id",campaignId)
  if(error)return NextResponse.json({error:error.message},{status:500})
  return NextResponse.json({ok:true})
}

export async function DELETE(_req:NextRequest,{params}:{params:Promise<{campaignId:string}>}) {
  const auth=await requireAdmin(); if(!auth.authorized)return auth.response
  if(auth.role!=="admin")return NextResponse.json({error:"Full admin access required"},{status:403})
  const {campaignId}=await params; const {error}=await auth.db.from("ad_campaigns").delete().eq("id",campaignId)
  if(error)return NextResponse.json({error:error.message},{status:500})
  return NextResponse.json({ok:true})
}
