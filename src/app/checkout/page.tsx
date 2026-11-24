"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Loader2, MapPin, Package, Plus, Trash2 } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { cartItemPrice, formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Toast, useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"

type Address = { id: string; name: string; phone: string; address_line1: string; address_line2?: string | null; city: string; state: string; state_code?: string | null; pincode: string; is_default?: boolean }

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore(s => s.items)
  const { toastProps, showError } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState("")
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", state_code: "", pincode: "" })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [savingAddress, setSavingAddress] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const idempotencyKey = useRef<string | null>(null)

  const loadCheckout = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    try {
      const supabase = createClient()
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError
      if (!session?.user) { router.push("/login?next=/checkout"); return }
      const { data: profile, error: profileError } = await supabase.from("users").select("role").eq("id", session.user.id).maybeSingle()
      if (profileError) throw profileError
      if (!profile || !["buyer", "seller"].includes(profile.role)) {
        setLoadError("This account cannot reserve customer orders.")
        return
      }
      const response = await fetch("/api/user/addresses")
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Could not load saved addresses.")
      const rows: Address[] = payload.addresses || []
      setAddresses(rows)
      setSelectedAddress(current => current || rows.find(address => address.is_default)?.id || rows[0]?.id || "")
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load checkout. Please retry.")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { void loadCheckout() }, [loadCheckout])

  function normalizePhone(value: string) {
    let digits = value.trim().replace(/\D/g, "")
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2)
    return digits
  }

  async function saveAddress() {
    const phone = normalizePhone(newAddress.phone)
    const pincode = newAddress.pincode.trim()
    if (!newAddress.name.trim() || !newAddress.address_line1.trim() || !newAddress.city.trim() || !newAddress.state.trim()) {
      showError("Complete the name and address fields."); return
    }
    if (!/^[6-9]\d{9}$/.test(phone)) { showError("Enter a valid 10-digit Indian mobile number."); return }
    if (!/^\d{6}$/.test(pincode)) { showError("Enter a valid 6-digit Indian pincode."); return }
    setSavingAddress(true)
    try {
      const response = await fetch("/api/user/addresses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddress, phone, pincode, is_default: addresses.length === 0 }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Could not save address.")
      setAddresses(previous => [...previous, payload.address])
      setSelectedAddress(payload.address.id)
      setShowForm(false)
      setNewAddress({ name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", state_code: "", pincode: "" })
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not save address. Please retry.")
    } finally {
      setSavingAddress(false)
    }
  }

  async function reserveOrder() {
    if (!selectedAddress) { showError("Select or add a delivery address."); return }
    const address = addresses.find(row => row.id === selectedAddress)
    if (!address || !/^[6-9]\d{9}$/.test(normalizePhone(address.phone))) { showError("The selected address needs a valid 10-digit Indian mobile number."); return }
    if (!/^\d{6}$/.test(address.pincode.trim())) { showError("The selected address needs a valid 6-digit Indian pincode."); return }
    if (!items.length) { showError("Your cart is empty."); return }
    setPlacingOrder(true)
    try {
      const fingerprint = JSON.stringify({ address: selectedAddress, items: items.map(item => [item.product_id, item.variant_id || null, item.quantity]).sort() })
      const storageKey = `loqmart-intent-idempotency:${fingerprint}`
      if (!idempotencyKey.current) {
        try { idempotencyKey.current = sessionStorage.getItem(storageKey) } catch { /* session storage can be disabled */ }
      }
      idempotencyKey.current ||= crypto.randomUUID()
      try { sessionStorage.setItem(storageKey, idempotencyKey.current) } catch { /* API idempotency still covers in-page retries */ }
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify({ address_id: selectedAddress, items: items.map(item => ({ product_id: item.product_id, variant_id: item.variant_id || null, quantity: item.quantity })) }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Could not reserve this order.")
      try { sessionStorage.removeItem(storageKey) } catch { /* optional */ }
      idempotencyKey.current = null
      useCartStore.getState().clearCart()
      router.push(`/checkout/success?orders=${payload.order_ids.join(",")}`)
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not reserve your order. Please retry.")
    } finally {
      setPlacingOrder(false)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + cartItemPrice(item) * item.quantity, 0)

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#725c00]" /></div>
  if (loadError) return <section className="mx-auto my-10 max-w-xl px-4 text-center"><p role="alert" className="mb-4 text-sm text-red-700">{loadError}</p><Button onClick={() => void loadCheckout()}>Retry</Button></section>
  if (!items.length) return <section className="mx-auto my-16 max-w-xl px-4 text-center"><Package className="mx-auto mb-4 h-8 w-8 text-[#725c00]" /><h1 className="mb-2 text-xl font-bold">Your cart is empty</h1><Link className="text-sm font-semibold text-[#725c00] underline" href="/category">Browse products</Link></section>

  return <main className="min-h-[60vh] bg-[#FBF9F5] px-4 py-7 pb-24 sm:px-6">
    {toastProps && <Toast {...toastProps} />}
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-[#1a1c1c]">Reserve your order</h1>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded border border-[#d0c6ac] bg-white p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-bold">Delivery address</h2><button type="button" onClick={() => setShowForm(open => !open)} className="inline-flex min-h-11 items-center gap-2 rounded border border-[#d0c6ac] px-3 text-sm font-semibold"><Plus size={16} />{showForm ? "Cancel" : "Add address"}</button></div>
          {showForm && <div className="mb-5 grid grid-cols-1 gap-3 rounded bg-[#f3f3f3] p-4 sm:grid-cols-2">
            {([ ["name", "Full name"], ["phone", "Mobile number"], ["address_line1", "Address line 1"], ["address_line2", "Address line 2 (optional)"], ["city", "City"], ["state", "State"] ] as const).map(([key, label]) => <input key={key} aria-label={label} placeholder={label} value={newAddress[key]} onChange={event => setNewAddress(value => ({ ...value, [key]: event.target.value }))} className={`${key.startsWith("address_") ? "sm:col-span-2" : ""} min-h-11 rounded border border-[#d0c6ac] bg-white px-3 text-sm`} />)}
            <input aria-label="6-digit pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="6-digit pincode" value={newAddress.pincode} onChange={event => setNewAddress(value => ({ ...value, pincode: event.target.value.replace(/\D/g, "").slice(0, 6) }))} className="min-h-11 rounded border border-[#d0c6ac] bg-white px-3 text-sm" />
            <Button type="button" disabled={savingAddress} onClick={() => void saveAddress()} className="min-h-11 sm:col-span-2">{savingAddress && <Loader2 className="h-4 w-4 animate-spin" />}{savingAddress ? "Saving address" : "Save address"}</Button>
          </div>}
          {addresses.length === 0 && !showForm && <p className="mb-4 rounded border border-dashed border-[#d0c6ac] p-5 text-sm text-[#4d4632]">Add a delivery address to continue.</p>}
          <div className="space-y-3">{addresses.map(address => <button type="button" key={address.id} onClick={() => setSelectedAddress(address.id)} aria-pressed={selectedAddress === address.id} className={`flex min-h-11 w-full items-start gap-3 rounded border p-4 text-left ${selectedAddress === address.id ? "border-[#725c00] bg-[#fcd020]/10" : "border-[#d0c6ac]"}`}>
            <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${selectedAddress === address.id ? "border-[#725c00] bg-[#725c00]" : "border-[#d0c6ac]"}`} />
            <span className="text-sm leading-5"><strong>{address.name}</strong><br />{address.phone}<br />{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ""}<br />{address.city}, {address.state_code || address.state} {address.pincode}</span>
          </button>)}</div>
          <div className="mt-6 rounded border border-[#d0c6ac] bg-[#f3f3f3] p-4 sm:p-5"><div className="mb-2 flex items-center gap-2"><Check size={17} className="text-[#725c00]" /><h2 className="font-bold">Reserve Order (Early Access — No Payment Required Today)</h2></div><p className="text-sm leading-6 text-[#4d4632]">Submitting reserves your selected items and records your delivery pincode so we can understand demand. No payment is taken now. Our team will confirm dispatch availability for your pincode shortly.</p></div>
        </section>
        <aside className="h-fit rounded border border-[#d0c6ac] bg-white p-4 sm:p-5 lg:sticky lg:top-24"><h2 className="mb-4 font-bold">Reservation summary</h2><div className="max-h-72 space-y-3 overflow-y-auto">{items.map(item => <div key={item.id} className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-[#f3f3f3]">{item.product?.images?.[0] && <Image src={item.product.images[0]} alt={item.product.name} width={48} height={48} sizes="48px" className="h-12 w-12 object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.product?.name}</p><p className="text-xs text-[#4d4632]">{item.variant_name ? `${item.variant_name} · ` : ""}Qty {item.quantity}</p></div><span className="shrink-0 text-sm font-semibold">{formatCurrency(cartItemPrice(item) * item.quantity)}</span></div>)}</div><div className="mt-4 flex justify-between border-t border-[#d0c6ac] pt-4 text-sm"><span>Items subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><Button type="button" disabled={placingOrder || !selectedAddress} onClick={() => void reserveOrder()} className="mt-4 min-h-12 w-full">{placingOrder && <Loader2 className="h-4 w-4 animate-spin" />}{placingOrder ? "Reserving" : "Proceed to Reserve"}</Button><p className="mt-2 text-center text-xs text-[#4d4632]">No payment is required today.</p></aside>
      </div>
    </div>
  </main>
}
