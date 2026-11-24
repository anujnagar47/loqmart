"use client"

import { useEffect, useState } from "react"
import { BellRing, MapPinned } from "lucide-react"

type DemandData = { ready: boolean; requests: Array<{item:string;category:string;count:number;states:Array<{state:string;count:number}>}>; categories:Array<{category:string;count:number}>; states:Array<{state:string;count:number}>; message?:string }

export function RequestedDemandRadar() {
  const [data,setData]=useState<DemandData|null>(null)
  const [error,setError]=useState("")
  useEffect(()=>{fetch("/api/admin/demand",{cache:"no-store"}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error||"Demand report unavailable");setData(body)}).catch(e=>setError(e instanceof Error?e.message:"Demand report unavailable"))},[])
  return <section id="demand-radar" className="mt-7 rounded-xl border border-[#d0c6ac] bg-white p-5 sm:p-6">
    <div className="flex items-start gap-3"><div className="rounded-md bg-[#fff4c2] p-2 text-[#725c00]"><BellRing size={17}/></div><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#725c00]">Demand radar</p><h2 className="mt-1 text-lg font-black text-[#1a1c1c]">Requested & unmet customer demand</h2><p className="mt-1 text-xs text-[#4d4632]">Customer requests ranked by item interest, category and state.</p></div></div>
    {error&&<p role="alert" className="mt-4 rounded bg-[#f3f3f3] p-3 text-xs text-[#4d4632]">{error}</p>}
    {data&&!data.ready&&<p className="mt-4 rounded border border-[#e6d9a4] bg-[#fff9e8] p-3 text-xs text-[#725c00]">{data.message}</p>}
    {data?.ready&&<div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(230px,1fr)]">
      <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-[#f3f3f3] text-[#4d4632]"><tr><th className="px-3 py-2.5">Requested item</th><th className="px-3 py-2.5">Category</th><th className="px-3 py-2.5">Requests</th><th className="px-3 py-2.5">States</th></tr></thead><tbody>{data.requests.map((item,i)=><tr key={`${item.category}:${item.item}:${i}`} className="border-t border-[#eeeeee]"><td className="px-3 py-3 font-semibold text-[#1a1c1c]">{item.item}</td><td className="px-3 py-3 text-[#4d4632]">{item.category}</td><td className="px-3 py-3 font-black">{item.count}</td><td className="px-3 py-3 text-[#4d4632]">{item.states.map(s=>`${s.state} (${s.count})`).join(", ")}</td></tr>)}</tbody></table>{data.requests.length===0&&<p className="py-8 text-center text-xs text-[#4d4632]">No customer requests have been recorded yet.</p>}</div>
      <div className="space-y-5"><div><h3 className="mb-2 flex items-center gap-2 text-xs font-bold"><BellRing size={14} className="text-[#725c00]"/>Top categories</h3>{data.categories.slice(0,6).map(row=><div key={row.category} className="flex justify-between border-b border-[#eeeeee] py-2 text-xs"><span>{row.category}</span><b>{row.count}</b></div>)}</div><div><h3 className="mb-2 flex items-center gap-2 text-xs font-bold"><MapPinned size={14} className="text-[#725c00]"/>Demand by state</h3>{data.states.slice(0,8).map(row=><div key={row.state} className="flex justify-between border-b border-[#eeeeee] py-2 text-xs"><span>{row.state}</span><b>{row.count}</b></div>)}</div></div>
    </div>}
  </section>
}
