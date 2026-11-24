"use client"

import { useCallback,useEffect,useState } from "react"

const field="w-full rounded border border-[#d0c6ac] bg-white px-3 py-2 text-sm text-[#1a1c1c]"
const localDate=(d:Date)=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)
export default function AdminAdsPage(){
  const [data,setData]=useState<any>({campaigns:[],products:[],sellers:[]}),[message,setMessage]=useState(""),[loading,setLoading]=useState(true)
  const [form,setForm]=useState<any>({name:"",adType:"product",placement:"home_hero",targetId:"",headline:"",body:"",imageUrl:"",ctaLabel:"Explore now",destinationUrl:"",stateCode:"",priority:10,status:"scheduled",startsAt:localDate(new Date()),endsAt:localDate(new Date(Date.now()+7*86400000))})
  const load=useCallback(()=>fetch("/api/admin/ads",{cache:"no-store"}).then(async r=>{const result=await r.json();if(!r.ok)throw new Error(result.error||"Campaign data unavailable");setData(result)}).catch((e:unknown)=>setMessage(e instanceof Error?e.message:"Campaign data unavailable")).finally(()=>setLoading(false)),[])
  useEffect(()=>{load();const timer=setInterval(load,15000);return()=>clearInterval(timer)},[load])
  const change=(key:string,value:any)=>setForm((f:any)=>({...f,[key]:value}))
  async function create(e:React.FormEvent){e.preventDefault();setMessage("");const response=await fetch("/api/admin/ads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const result=await response.json();if(!response.ok){setMessage(result.error||"Could not create campaign");return}setMessage("Campaign created");load()}
  async function status(id:string,value:string){await fetch(`/api/admin/ads/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:value})});load()}
  async function remove(id:string){await fetch(`/api/admin/ads/${id}`,{method:"DELETE"});load()}
  const targets=form.adType==="product"?data.products:data.sellers
  return <div className="min-h-full p-6 md:p-8"><div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-widest text-[#725c00]">Monetization</p><h1 className="mt-1 text-2xl font-black text-[#1a1c1c]">Sponsored placement manager</h1><p className="mt-1 text-sm text-[#4d4632]">Schedule promotions across homepage, search, regional collections, and product pages.</p></div>
    <form onSubmit={create} className="grid gap-3 rounded border border-[#d0c6ac] bg-white p-5 md:grid-cols-3">
      <label className="text-xs font-semibold">Campaign name<input required className={field} value={form.name} onChange={e=>change("name",e.target.value)}/></label>
      <label className="text-xs font-semibold">Promote<select className={field} value={form.adType} onChange={e=>{change("adType",e.target.value);change("targetId","")}}><option value="product">Product</option><option value="seller">Seller storefront</option></select></label>
      <label className="text-xs font-semibold">Target<select required className={field} value={form.targetId} onChange={e=>change("targetId",e.target.value)}><option value="">Select {form.adType}</option>{targets?.map((t:any)=><option key={t.id} value={t.id}>{form.adType==="product"?t.name:t.business_name}</option>)}</select></label>
      <label className="text-xs font-semibold">Placement<select className={field} value={form.placement} onChange={e=>change("placement",e.target.value)}><option value="home_hero">Homepage hero</option><option value="search_top">Search and category top row</option><option value="state_spotlight">State collection spotlight</option><option value="product_partner">Product detail partner pick</option></select></label>
      <label className="text-xs font-semibold">Headline<input required className={field} value={form.headline} onChange={e=>change("headline",e.target.value)}/></label>
      <label className="text-xs font-semibold">CTA label<input className={field} value={form.ctaLabel} onChange={e=>change("ctaLabel",e.target.value)}/></label>
      <label className="text-xs font-semibold">Supporting copy<input className={field} value={form.body} onChange={e=>change("body",e.target.value)}/></label>
      <label className="text-xs font-semibold">Banner image URL<input className={field} value={form.imageUrl} onChange={e=>change("imageUrl",e.target.value)} placeholder="Optional: uses target image"/></label>
      <label className="text-xs font-semibold">Destination path<input className={field} value={form.destinationUrl} onChange={e=>change("destinationUrl",e.target.value)} placeholder="Optional internal path"/></label>
      <label className="text-xs font-semibold">State code<input className={field} value={form.stateCode} onChange={e=>change("stateCode",e.target.value)} placeholder="For state spotlight"/></label>
      <label className="text-xs font-semibold">Priority (0–1000)<input type="number" min="0" max="1000" className={field} value={form.priority} onChange={e=>change("priority",Number(e.target.value))}/></label>
      <label className="text-xs font-semibold">Status<select className={field} value={form.status} onChange={e=>change("status",e.target.value)}><option value="active">Active</option><option value="scheduled">Scheduled</option><option value="paused">Paused</option></select></label>
      <label className="text-xs font-semibold">Starts<input type="datetime-local" required className={field} value={form.startsAt} onChange={e=>change("startsAt",e.target.value)}/></label>
      <label className="text-xs font-semibold">Ends<input type="datetime-local" required className={field} value={form.endsAt} onChange={e=>change("endsAt",e.target.value)}/></label>
      <div className="flex items-end"><button className="rounded bg-[#725c00] px-5 py-2.5 text-sm font-bold text-white">Create campaign</button></div>
      {message&&<p className="self-end text-sm font-semibold text-[#725c00]">{message}</p>}
    </form>
    <div className="mt-6 overflow-x-auto rounded border border-[#d0c6ac] bg-white"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-[#f3f3f3]"><tr>{["Campaign","Placement","Status","Schedule","Impressions","Clicks","CTR","Manage"].map(x=><th key={x} className="px-3 py-3 font-bold">{x}</th>)}</tr></thead><tbody>{data.campaigns?.map((c:any)=><tr key={c.id} className="border-t border-[#eeeeee]"><td className="px-3 py-3"><b>{c.name}</b><span className="block text-[#4d4632]">{c.headline}</span></td><td>{c.placement}</td><td>{c.status}</td><td>{new Date(c.starts_at).toLocaleDateString()} – {new Date(c.ends_at).toLocaleDateString()}</td><td>{c.impressions}</td><td>{c.clicks}</td><td>{c.ctr.toFixed(2)}%</td><td className="space-x-2"><select aria-label="Campaign status" value={c.status} onChange={e=>status(c.id,e.target.value)}><option value="active">Active</option><option value="scheduled">Scheduled</option><option value="paused">Paused</option></select><button className="font-semibold text-red-700" onClick={()=>remove(c.id)}>Delete</button></td></tr>)}</tbody></table>{loading&&<p className="p-6 text-sm">Loading campaigns…</p>}</div>
  </div>
}
