"use client"

import { useEffect,useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { IndianRupee,Eye,Users,Heart,MessageSquare,BarChart3 } from "lucide-react"

type Data={telemetryReady?:boolean;cartDataReady?:boolean;wishlistDataReady?:boolean;kpis:{visitors:number;views:number;cartValue:number;wishlistedItems:number;inquiriesOrders:number;activeCampaigns:number};leaderboard:any[];carts:any[];wishlists:any[];mostWishlisted:any[];sellers:any[]}
const money=(v:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v||0)

export function MarketplaceIntelligence(){
  const [data,setData]=useState<Data|null>(null),[tab,setTab]=useState("products"),[busy,setBusy]=useState(true),[error,setError]=useState("")
  const load=()=>fetch("/api/admin/intelligence",{cache:"no-store"}).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.error||"Marketplace analytics unavailable");setData(x);setError("")}).catch((e:unknown)=>setError(e instanceof Error?e.message:"Marketplace analytics unavailable")).finally(()=>setBusy(false))
  useEffect(()=>{load();const t=setInterval(load,15000);return()=>clearInterval(t)},[])
  useEffect(()=>{
    const selectFromHash=()=>{
      const hash=window.location.hash
      if(hash==="#product-traffic")setTab("products")
      else if(hash==="#customer-carts")setTab("carts")
      else if(hash==="#customer-wishlists")setTab("wishlists")
    }
    selectFromHash()
    window.addEventListener("hashchange",selectFromHash)
    return()=>window.removeEventListener("hashchange",selectFromHash)
  },[])
  const tiles=data?[{title:"Total Visitors",value:data.kpis.visitors,icon:Users},{title:"Product Views",value:data.kpis.views,icon:Eye},{title:"Active Cart Value",value:money(data.kpis.cartValue),icon:IndianRupee},{title:"Wishlisted Items",value:data.kpis.wishlistedItems,icon:Heart},{title:"Inquiries / Orders",value:data.kpis.inquiriesOrders,icon:MessageSquare},{title:"Active Ad Campaigns",value:data.kpis.activeCampaigns,icon:BarChart3}]:[]
  async function setPremium(id:string,isProSeller:boolean){await fetch(`/api/admin/sellers/${id}/premium`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({isProSeller})});load()}
  return <section id="telemetry" className="mt-8 border-t border-[#d0c6ac] pt-7">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#725c00]">Marketplace intelligence</p><h2 className="mt-1 text-xl font-black text-[#1a1c1c]">Customer activity & product demand</h2></div><Link href="/admin/ads" className="rounded bg-[#725c00] px-4 py-2 text-xs font-bold text-white">Manage sponsored ads</Link></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{tiles.map(({title,value,icon:Icon})=><div key={title} className="rounded border border-[#d0c6ac] bg-white p-4"><Icon size={16} className="text-[#725c00]"/><p className="mt-3 text-xl font-black text-[#1a1c1c]">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#4d4632]">{title}</p></div>)}</div>
    {data&&(!data.telemetryReady||!data.cartDataReady||!data.wishlistDataReady)&&<p className="mt-3 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">Some live activity tables are not installed yet. Apply the marketplace intelligence database migration to enable visitor events and customer cart and wishlist inspection.</p>}
    <div className="mt-5 flex flex-wrap gap-2"><button id="product-traffic" onClick={()=>setTab("products")} className={`rounded px-3 py-2 text-xs font-bold ${tab==="products"?"bg-[#fcd020] text-[#231b00]":"bg-white text-[#4d4632] border border-[#d0c6ac]"}`}>Product traffic rankings</button><button id="customer-carts" onClick={()=>setTab("carts")} className={`rounded px-3 py-2 text-xs font-bold ${tab==="carts"?"bg-[#fcd020] text-[#231b00]":"bg-white text-[#4d4632] border border-[#d0c6ac]"}`}>Customer carts</button><button id="customer-wishlists" onClick={()=>setTab("wishlists")} className={`rounded px-3 py-2 text-xs font-bold ${tab==="wishlists"?"bg-[#fcd020] text-[#231b00]":"bg-white text-[#4d4632] border border-[#d0c6ac]"}`}>Wishlists</button><button onClick={()=>setTab("sellers")} className={`rounded px-3 py-2 text-xs font-bold ${tab==="sellers"?"bg-[#fcd020] text-[#231b00]":"bg-white text-[#4d4632] border border-[#d0c6ac]"}`}>Seller premium insights</button></div>
    <div className="mt-3 overflow-x-auto rounded border border-[#d0c6ac] bg-white">
      {tab==="products"&&<table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[#f3f3f3]"><tr>{["Product","Seller","State","Views","Visitors","Cart rate","Wishlists","Inquiries"].map(x=><th key={x} className="px-3 py-3 font-bold">{x}</th>)}</tr></thead><tbody>{data?.leaderboard.map(p=><tr key={p.id} className="border-t border-[#eeeeee]"><td className="px-3 py-2"><Link href={`/product/${p.slug}`} className="flex items-center gap-2 font-semibold"><span className="relative h-10 w-10 shrink-0 bg-white">{p.images?.[0]&&<Image src={p.images[0]} alt="" fill sizes="40px" className="object-contain"/>}</span>{p.name}</Link></td><td className="px-3 py-2">{p.sellers?.business_name||"—"}</td><td className="px-3 py-2">{p.state_code||"—"}</td><td className="px-3 py-2">{p.totalViews}</td><td className="px-3 py-2">{p.uniqueVisitors}</td><td className="px-3 py-2">{p.addToCartRate.toFixed(1)}%</td><td className="px-3 py-2">{p.wishlistCount}</td><td className="px-3 py-2">{p.inquiryCount}</td></tr>)}</tbody></table>}
      {tab==="carts"&&<table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#f3f3f3]"><tr>{["Customer / session","Email / phone","State / pincode","Items","Value","Last active"].map(x=><th key={x} className="px-3 py-3 font-bold">{x}</th>)}</tr></thead><tbody>{data?.carts.map(c=><tr key={c.key} className="border-t border-[#eeeeee]"><td className="px-3 py-3">{c.customer}</td><td className="px-3 py-3">{[c.email,c.phone].filter(Boolean).join(" · ")||"Guest session"}</td><td className="px-3 py-3">{[c.stateCode,c.pincode].filter(Boolean).join(" · ")||"Not provided"}</td><td className="px-3 py-3">{c.items.map((i:any)=>`${i.title} × ${i.quantity}`).join(", ")}</td><td className="px-3 py-3">{money(c.total)}</td><td className="px-3 py-3">{new Date(c.lastActive).toLocaleString("en-IN")}</td></tr>)}</tbody></table>}
      {tab==="wishlists"&&<div className="grid gap-5 p-4 lg:grid-cols-2"><div><h3 className="mb-3 font-bold">Most wishlisted products</h3>{data?.mostWishlisted.map((x:any)=><div key={x.product.id} className="flex justify-between border-b border-[#eeeeee] py-2 text-xs"><span>{x.product.name}</span><b>{x.count}</b></div>)}</div><div><h3 className="mb-3 font-bold">Customer wishlist items</h3>{data?.wishlists.slice(0,100).map((x:any,i:number)=><div key={`${x.customer}:${x.product.id}:${i}`} className="flex justify-between border-b border-[#eeeeee] py-2 text-xs"><span>{x.customer}</span><b>{x.product.name}</b></div>)}</div></div>}
      {tab==="sellers"&&<table className="w-full text-left text-xs"><thead className="bg-[#f3f3f3]"><tr>{["Seller","State","Views","Cart adds","Missed search demand","Premium insights"].map(x=><th key={x} className="px-3 py-3 font-bold">{x}</th>)}</tr></thead><tbody>{data?.sellers.map(s=><tr key={s.id} className="border-t border-[#eeeeee]"><td className="px-3 py-3">{s.business_name}</td><td>{s.state}</td><td>{s.views}</td><td>{s.cartAdds}</td><td>{s.missedSearchDemand}</td><td><button onClick={()=>setPremium(s.id,!s.is_pro_seller)} className="rounded border border-[#d0c6ac] px-2 py-1 font-semibold">{s.is_pro_seller?"Pro enabled · Disable":"Preview · Enable Pro"}</button></td></tr>)}</tbody></table>}
      {busy&&!data&&<p className="p-8 text-sm text-[#4d4632]">Loading marketplace activity…</p>}
      {error&&!data&&<p className="p-8 text-sm text-[#4d4632]">{error}</p>}
      {!busy&&data&&tab==="carts"&&!data.carts.length&&<p className="p-8 text-sm text-[#4d4632]">No cart activity recorded yet.</p>}
    </div>
  </section>
}
