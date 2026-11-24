import { NextRequest,NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function PATCH(req:NextRequest,{params}:{params:Promise<{sellerId:string}>}){
  const auth=await requireAdmin();if(!auth.authorized)return auth.response
  if(auth.role!=="admin")return NextResponse.json({error:"Full admin access required"},{status:403})
  const {sellerId}=await params,body=await req.json()
  if(typeof body.isProSeller!=="boolean")return NextResponse.json({error:"isProSeller must be a boolean"},{status:400})
  const {error}=await auth.db.from("sellers").update({is_pro_seller:body.isProSeller}).eq("id",sellerId)
  if(error)return NextResponse.json({error:error.message},{status:500})
  return NextResponse.json({ok:true})
}
