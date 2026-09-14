"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronRight, Store, FileText, CreditCard, MapPin, Award, Loader2, IdCard, Tag } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Toast, useToast } from "@/components/ui/toast"

const steps = [
  { id: 1, name: "Business Type",   icon: Store     },
  { id: 2, name: "Contact",         icon: FileText  },
  { id: 3, name: "Identity & Tax",  icon: IdCard    },
  { id: 4, name: "Store",           icon: Tag       },
  { id: 5, name: "Address",         icon: MapPin    },
  { id: 6, name: "Bank",            icon: CreditCard },
  { id: 7, name: "Review",          icon: Award     },
]

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand",
  "Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
]

const BUSINESS_TYPES = [
  { value: "individual",     label: "Individual / Artisan",  hint: "You sell in your own name, no registered company." },
  { value: "proprietorship", label: "Proprietorship",        hint: "A business owned and run by one person." },
  { value: "partnership",    label: "Partnership",           hint: "Owned jointly by two or more partners." },
  { value: "llp",            label: "LLP",                   hint: "Limited Liability Partnership, registered with the MCA." },
  { value: "private_ltd",    label: "Private Limited",       hint: "A registered private limited company." },
  { value: "public_ltd",     label: "Public Limited",        hint: "A registered public limited company." },
]

const ID_PROOF_TYPES = [
  { value: "aadhaar",         label: "Aadhaar Card" },
  { value: "passport",        label: "Passport" },
  { value: "voter_id",        label: "Voter ID" },
  { value: "driving_license", label: "Driving License" },
]

const inputCls = "w-full h-11 px-4 rounded-xl text-[13px] outline-none transition-all"
const inputStyle = { border: "1px solid rgba(26,28,28,0.14)", background: "white", color: "#1a1c1c" }
const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = "#fcd020"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(252,208,32,0.1)" }
const inputBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = "rgba(26,28,28,0.14)"; e.currentTarget.style.boxShadow = "none" }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10.5px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

interface Category { id: string; name: string }

export default function SellerRegistrationPage() {
  const router = useRouter()
  const { toastProps, showError } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    businessType: "",
    businessName: "", ownerName: "", dateOfBirth: "", email: "", phone: "",
    idProofType: "", idProofNumber: "", gstin: "", pan: "",
    storeName: "", description: "", intendedCategories: [] as string[],
    address: "", city: "", state: "", pincode: "",
    bankAccountName: "", bankAccount: "", ifsc: "", acceptTerms: false,
  })

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push("/auth?redirect=/seller/register")
        return
      }
      setFormData(p => ({ ...p, email: session.user.email || p.email }))
    }
    init()
  }, [router])

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.ok ? r.json() : null)
      .then(d => setCategories(d?.categories || []))
      .catch(() => {})
  }, [])

  const set = (field: string, value: string | boolean | string[]) => setFormData(p => ({ ...p, [field]: value }))

  const toggleCategory = (id: string) => {
    setFormData(p => ({
      ...p,
      intendedCategories: p.intendedCategories.includes(id)
        ? p.intendedCategories.filter(c => c !== id)
        : p.intendedCategories.length < 5 ? [...p.intendedCategories, id] : p.intendedCategories,
    }))
  }

  const nextStep = () => {
    if (currentStep === 1 && !formData.businessType) {
      showError("Please select a business type."); return
    }
    if (currentStep === 2 && (!formData.businessName || !formData.ownerName || !formData.dateOfBirth || !formData.phone)) {
      showError("Please fill in Legal Name, Owner Name, Date of Birth and Phone."); return
    }
    if (currentStep === 3 && (!formData.idProofType || !formData.idProofNumber || !formData.pan)) {
      showError("ID proof and PAN are required."); return
    }
    if (currentStep === 4 && (!formData.storeName || formData.intendedCategories.length === 0)) {
      showError("Please enter a store name and pick at least one category."); return
    }
    if (currentStep === 5 && (!formData.address || !formData.city || !formData.state || !formData.pincode)) {
      showError("Please fill in all address fields."); return
    }
    if (currentStep === 6 && (!formData.bankAccountName || !formData.bankAccount || !formData.ifsc)) {
      showError("Please fill in all bank details."); return
    }
    if (currentStep < 7) setCurrentStep(s => s + 1)
  }
  const prevStep = () => { if (currentStep > 1) setCurrentStep(s => s - 1) }

  const handleSubmit = async () => {
    if (!formData.acceptTerms) { showError("Please accept the terms and conditions."); return }
    setIsSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: formData.businessName,
          owner_name: formData.ownerName,
          business_type: formData.businessType,
          date_of_birth: formData.dateOfBirth,
          phone: formData.phone,
          id_proof_type: formData.idProofType,
          id_proof_number: formData.idProofNumber,
          gstin: formData.gstin || null,
          pan: formData.pan,
          store_name: formData.storeName,
          description: formData.description || null,
          intended_categories: formData.intendedCategories.map(id => categories.find(c => c.id === id)?.name).filter(Boolean),
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          bank_account_name: formData.bankAccountName,
          bank_account_number: formData.bankAccount,
          bank_ifsc: formData.ifsc,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit application. Please try again.")
      } else {
        router.push("/seller/dashboard")
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const businessNameLabel = formData.businessType === "individual" ? "Full Name (as on PAN) *" : "Registered Business Name *"

  return (
    <div className="min-h-screen py-12" style={{ background: "#eeece8" }}>
      {toastProps && <Toast {...toastProps} />}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div className="text-center mb-10"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-[32px] font-extrabold text-[#1a1c1c] tracking-tight mb-2">
            Become a Seller on LoqMart
          </h1>
          <p className="text-[14px] text-[#1a1c1c]/45 max-w-xl mx-auto">
            Join thousands of artisans and manufacturers selling quality products to millions of customers across India.
          </p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <motion.div className="flex flex-col items-center"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: currentStep > step.id ? "#22c55e" : currentStep === step.id ? "#fcd020" : "rgba(26,28,28,0.08)",
                    color: currentStep > step.id ? "white" : currentStep === step.id ? "#1a1c1c" : "rgba(26,28,28,0.35)",
                  }}>
                  {currentStep > step.id ? <Check size={15} /> : <step.icon size={15} />}
                </div>
                <span className="text-[9px] font-bold mt-1.5 whitespace-nowrap"
                  style={{ color: currentStep >= step.id ? "#1a1c1c" : "rgba(26,28,28,0.35)" }}>
                  {step.name}
                </span>
              </motion.div>
              {index < steps.length - 1 && (
                <div className="w-6 sm:w-10 h-0.5 mx-1 mt-[-10px] shrink-0 transition-colors"
                  style={{ background: currentStep > step.id ? "#22c55e" : "rgba(26,28,28,0.12)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Form panel */}
        <div className="bg-white rounded-2xl p-6 sm:p-8"
          style={{ border: "1px solid rgba(26,28,28,0.07)", boxShadow: "0 2px 12px rgba(26,28,28,0.05)" }}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-1">What type of business is this?</h2>
                <p className="text-[12px] text-[#1a1c1c]/45 mb-5">This determines what identity and tax documents we&apos;ll ask for next.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BUSINESS_TYPES.map(bt => (
                    <button key={bt.value} type="button" onClick={() => set("businessType", bt.value)}
                      className="text-left p-4 rounded-xl transition-all"
                      style={{
                        border: formData.businessType === bt.value ? "2px solid #fcd020" : "1px solid rgba(26,28,28,0.14)",
                        background: formData.businessType === bt.value ? "rgba(252,208,32,0.08)" : "white",
                      }}>
                      <p className="text-[13px] font-bold text-[#1a1c1c]">{bt.label}</p>
                      <p className="text-[11px] text-[#1a1c1c]/45 mt-0.5">{bt.hint}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Business & Contact Details</h2>
                <div className="space-y-4">
                  <Field label={businessNameLabel}>
                    <input className={inputCls} style={inputStyle} placeholder="As it appears on your PAN / registration certificate"
                      value={formData.businessName} onChange={e => set("businessName", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Owner / Signatory Full Name *">
                      <input className={inputCls} style={inputStyle} placeholder="Legal name of the person registering"
                        value={formData.ownerName} onChange={e => set("ownerName", e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </Field>
                    <Field label="Date of Birth *">
                      <input type="date" className={inputCls} style={inputStyle}
                        value={formData.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Email">
                      <input type="email" disabled className={inputCls} style={{ ...inputStyle, background: "#f3f3f3", color: "#1a1c1c99" }}
                        value={formData.email} />
                    </Field>
                    <Field label="Phone *">
                      <input type="tel" className={inputCls} style={inputStyle} placeholder="10-digit mobile"
                        value={formData.phone} onChange={e => set("phone", e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </Field>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Identity & Tax Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="ID Proof Type *">
                      <select className={inputCls} style={inputStyle}
                        value={formData.idProofType} onChange={e => set("idProofType", e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur}>
                        <option value="">Select ID type</option>
                        {ID_PROOF_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </Field>
                    <Field label="ID Proof Number *">
                      <input className={inputCls} style={inputStyle} placeholder="As printed on the document"
                        value={formData.idProofNumber} onChange={e => set("idProofNumber", e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </Field>
                  </div>
                  <Field label="PAN Number *">
                    <input className={inputCls} style={inputStyle} placeholder="Enter 10-digit PAN"
                      value={formData.pan} onChange={e => set("pan", e.target.value.toUpperCase())}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <Field label="GSTIN">
                    <input className={inputCls} style={inputStyle} placeholder="Enter 15-digit GSTIN"
                      value={formData.gstin} onChange={e => set("gstin", e.target.value.toUpperCase())}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <div className="p-4 rounded-xl text-[12px] text-[#92400e] leading-relaxed"
                    style={{ background: "rgba(217,119,6,0.07)", border: "1px solid rgba(217,119,6,0.2)" }}>
                    <strong>Note:</strong> GSTIN is required for selling on LoqMart. You can still register without one but won&apos;t be able to list products until GSTIN is added.
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Set Up Your Store</h2>
                <div className="space-y-4">
                  <Field label="Store Display Name *">
                    <input className={inputCls} style={inputStyle} placeholder="What buyers will see on your storefront"
                      value={formData.storeName} onChange={e => set("storeName", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <Field label="Store Description">
                    <textarea rows={3} className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all resize-none"
                      style={inputStyle} placeholder="A short line about what you make or sell"
                      value={formData.description} onChange={e => set("description", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <Field label={`Categories you plan to sell in * (up to 5, ${formData.intendedCategories.length} selected)`}>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => {
                        const active = formData.intendedCategories.includes(cat.id)
                        return (
                          <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                            className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                            style={{
                              background: active ? "#fcd020" : "white",
                              border: active ? "1px solid #fcd020" : "1px solid rgba(26,28,28,0.14)",
                              color: "#1a1c1c",
                            }}>
                            {cat.name}
                          </button>
                        )
                      })}
                      {categories.length === 0 && <p className="text-[12px] text-[#1a1c1c]/40">Loading categories…</p>}
                    </div>
                  </Field>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Business Address</h2>
                <div className="space-y-4">
                  <Field label="Address *">
                    <input className={inputCls} style={inputStyle} placeholder="Enter full address"
                      value={formData.address} onChange={e => set("address", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="City *">
                      <input className={inputCls} style={inputStyle} placeholder="City"
                        value={formData.city} onChange={e => set("city", e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </Field>
                    <Field label="State *">
                      <select className={inputCls} style={inputStyle}
                        value={formData.state} onChange={e => set("state", e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur}>
                        <option value="">Select state</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Pincode *">
                      <input className={inputCls} style={inputStyle} placeholder="6-digit pincode"
                        value={formData.pincode} onChange={e => set("pincode", e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </Field>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Bank Details</h2>
                <div className="space-y-4">
                  <Field label="Account Holder Name *">
                    <input className={inputCls} style={inputStyle} placeholder="Name exactly as it appears on the bank account"
                      value={formData.bankAccountName} onChange={e => set("bankAccountName", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <Field label="Bank Account Number *">
                    <input className={inputCls} style={inputStyle} placeholder="Enter bank account number"
                      value={formData.bankAccount} onChange={e => set("bankAccount", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <Field label="IFSC Code *">
                    <input className={inputCls} style={inputStyle} placeholder="Enter 11-digit IFSC code"
                      value={formData.ifsc} onChange={e => set("ifsc", e.target.value.toUpperCase())}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <div className="p-4 rounded-xl text-[12px] text-[#1a1c1c]/55"
                    style={{ background: "#eeece8" }}>
                    Your bank details are securely encrypted and only used for processing payouts.
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 7 && (
              <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Review & Submit</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Business Type",  BUSINESS_TYPES.find(b => b.value === formData.businessType)?.label],
                      ["Legal Name",     formData.businessName],
                      ["Owner Name",     formData.ownerName],
                      ["Store Name",     formData.storeName],
                      ["Email",          formData.email],
                      ["Phone",          formData.phone],
                      ["PAN",            formData.pan],
                      ["GSTIN",          formData.gstin || "—"],
                      ["City",           formData.city],
                      ["State",          formData.state],
                    ].map(([label, value]) => (
                      <div key={label} className="p-4 rounded-xl" style={{ background: "#eeece8" }}>
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/40 mb-1">{label}</p>
                        <p className="text-[13px] font-semibold text-[#1a1c1c]">{value || "—"}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl" style={{ background: "#eeece8" }}>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/40 mb-1">Categories</p>
                    <p className="text-[13px] font-semibold text-[#1a1c1c]">
                      {formData.intendedCategories.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.acceptTerms}
                      onChange={e => set("acceptTerms", e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#fcd020]" />
                    <span className="text-[12px] text-[#1a1c1c]/55 leading-relaxed">
                      I agree to the{" "}
                      <Link href="/seller/terms" className="text-[#725c00] font-semibold hover:underline">Seller Terms</Link>,{" "}
                      <Link href="/privacy" className="text-[#725c00] font-semibold hover:underline">Privacy Policy</Link>,
                      and confirm all information is accurate.
                    </span>
                  </label>

                  <div className="p-4 rounded-xl" style={{ background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.18)" }}>
                    <h3 className="text-[13px] font-bold text-green-800 mb-2">What happens next?</h3>
                    <ul className="text-[12px] text-green-700 space-y-1">
                      <li>Your application will be reviewed within 2–3 business days</li>
                      <li>You&apos;ll receive an email once approved</li>
                      <li>Start listing products and selling immediately after approval</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          {submitError && (
            <div className="mt-4 p-3 rounded-xl text-[12px] font-medium"
              style={{ background: "rgba(220,38,38,0.08)", color: "#b91c1c", border: "1px solid rgba(220,38,38,0.15)" }}>
              {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6" style={{ borderTop: "1px solid rgba(26,28,28,0.07)" }}>
            {currentStep > 1 ? (
              <motion.button onClick={prevStep} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-[#1a1c1c]/60 transition-colors"
                style={{ border: "1px solid rgba(26,28,28,0.12)" }}>
                Back
              </motion.button>
            ) : <div />}
            <motion.button
              onClick={currentStep < 7 ? nextStep : handleSubmit}
              disabled={(currentStep === 7 && !formData.acceptTerms) || isSubmitting}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-black disabled:opacity-40"
              style={{ background: currentStep === 7 ? "#22c55e" : "#fcd020", color: currentStep === 7 ? "white" : "#1a1c1c" }}>
              {isSubmitting
                ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                : currentStep < 7
                  ? <>Continue <ChevronRight size={14} /></>
                  : "Submit Application"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
