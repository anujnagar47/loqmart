"use client"

import { useEffect,useRef,useState } from "react"
import Link from "next/link"
import { recordAdEvent } from "@/lib/analyticsTracker"

type Campaign={id:string;headline:string;body:string|null;image_url:string|null;cta_label:string;destination_url:string;ad_type:string;placement:string;product?:{name:string;price:number;slug:string}}
export function SponsoredSlot({placement,stateCode,slug}:{placement:"home_hero"|"search_top"|"state_spotlight"|"product_partner";stateCode?:string;slug?:string}){
  const [campaigns,setCampaigns]=useState<Campaign[]>([]),[failed,setFailed]=useState<string[]>([]),sent=useRef(new Set<string>())
  useEffect(()=>{const q=new URLSearchParams({placement});if(stateCode)q.set("state_code",stateCode);if(slug)q.set("slug",slug);fetch(`/api/ads?${q}`).then(r=>r.json()).then(x=>setCampaigns(x.campaigns|| (x.campaign?[x.campaign]:[]))).catch(()=>setCampaigns([]))},[placement,stateCode,slug])
  useEffect(()=>{for(const c of campaigns)if(!sent.current.has(c.id)){sent.current.add(c.id);recordAdEvent(c.id,"impression")}},[campaigns])
  if(!campaigns.length)return null
  if(placement==="search_top")return <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Sponsored products">{campaigns.map(c=><Link key={c.id} href={c.destination_url.startsWith("/")?c.destination_url:"/"} onClick={()=>recordAdEvent(c.id,"click")} className="flex items-center gap-3 rounded border border-[#d0c6ac] bg-white p-3 shadow-sm"><span className="relative h-20 w-20 shrink-0 overflow-hidden bg-white">{c.image_url&&!failed.includes(c.id)&&<img src={c.image_url} alt="" onError={()=>setFailed(ids=>[...ids,c.id])} className="h-full w-full object-contain"/>}</span><span className="min-w-0 flex-1"><span className="mb-1 inline-block rounded bg-[#fcd020] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#231b00]">Sponsored</span><span className="block truncate text-sm font-bold text-[#1a1c1c]">{c.product?.name||c.headline}</span><span className="block truncate text-xs text-[#4d4632]">{c.product?`₹${Number(c.product.price).toLocaleString("en-IN")}`:c.body}</span></span><span className="shrink-0 text-xs font-bold text-[#725c00]">{c.cta_label} →</span></Link>)}</section>
  const campaign=campaigns[0]
  const imageFailed=failed.includes(campaign.id)
  return <section className={`relative overflow-hidden bg-[#1a1c1c] ${placement==="home_hero"?"min-h-[260px] md:min-h-[390px]":"min-h-[180px]"}`}>
    {campaign.image_url&&!imageFailed&&<img src={campaign.image_url} alt="" onError={()=>setFailed(ids=>[...ids,campaign.id])} className="absolute inset-0 h-full w-full object-cover"/>}
    <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent"/>
    <div className="relative mx-auto flex min-h-[inherit] max-w-7xl flex-col items-start justify-center px-6 py-9 text-white"><span className="mb-3 rounded bg-[#fcd020] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#231b00]">Sponsored</span><h2 className="max-w-2xl text-2xl font-black tracking-tight md:text-4xl">{campaign.headline}</h2>{campaign.body&&<p className="mt-2 max-w-xl text-sm text-white/85">{campaign.body}</p>}<Link href={campaign.destination_url.startsWith("/")?campaign.destination_url:"/"} onClick={()=>recordAdEvent(campaign.id,"click")} className="mt-5 rounded bg-[#fcd020] px-5 py-3 text-sm font-bold text-[#231b00]">{campaign.cta_label}</Link></div>
  </section>
}
