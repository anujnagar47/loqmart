"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronRight, Store, FileText, CreditCard, MapPin, Award, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const steps = [
  { id: 1, name: "Basic Info",        icon: FileText  },
  { id: 2, name: "Business Details",  icon: Store     },
  { id: 3, name: "Location",          icon: MapPin    },
  { id: 4, name: "Payment",           icon: CreditCard },
  { id: 5, name: "Review",            icon: Award     },
]

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand",
  "Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
]

const inputCls = "w-full h-11 px-4 rounded-xl text-[13px] outline-none transition-all"
const inputStyle = { border: "1px solid rgba(26,28,28,0.14)", background: "white", color: "#1a1c1c" }
const inputFocus = (e: any) => { e.currentTarget.style.borderColor = "#fcd020"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(252,208,32,0.1)" }
const inputBlur  = (e: any) => { e.currentTarget.style.borderColor = "rgba(26,28,28,0.14)"; e.currentTarget.style.boxShadow = "none" }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10.5px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function SellerRegistrationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [formData, setFormData] = useState({
    businessName: "", ownerName: "", email: "", phone: "",
    businessType: "", gstin: "", pan: "",
    address: "", city: "", state: "", pincode: "",
    bankAccount: "", ifsc: "", acceptTerms: false,
  })

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push("/auth?redirect=/seller/register")
      }
    }
    checkAuth()
  }, [router])

  const set = (field: string, value: string | boolean) => setFormData(p => ({ ...p, [field]: value }))
  const nextStep = () => {
    if (currentStep === 1 && (!formData.businessName || !formData.ownerName || !formData.phone)) {
      alert("Please fill in Business Name, Owner Name and Phone."); return
    }
    if (currentStep === 2 && !formData.pan) {
      alert("PAN Number is required."); return
    }
    if (currentStep === 3 && (!formData.address || !formData.city || !formData.state || !formData.pincode)) {
      alert("Please fill in all address fields."); return
    }
    if (currentStep < 5) setCurrentStep(s => s + 1)
  }
  const prevStep = () => { if (currentStep > 1) setCurrentStep(s => s - 1) }

  const handleSubmit = async () => {
    if (!formData.acceptTerms) { alert("Please accept the terms and conditions."); return }
    setIsSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: formData.businessName,
          owner_name: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          business_type: formData.businessType,
          gstin: formData.gstin || null,
          pan: formData.pan,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          bank_account_number: formData.bankAccount || null,
          bank_ifsc: formData.ifsc || null,
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

  return (
    <div className="min-h-screen py-12" style={{ background: "#eeece8" }}>
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
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: currentStep > step.id ? "#22c55e" : currentStep === step.id ? "#fcd020" : "rgba(26,28,28,0.08)",
                    color: currentStep > step.id ? "white" : currentStep === step.id ? "#1a1c1c" : "rgba(26,28,28,0.35)",
                  }}>
                  {currentStep > step.id ? <Check size={16} /> : <step.icon size={16} />}
                </div>
                <span className="text-[9.5px] font-bold mt-1.5 whitespace-nowrap"
                  style={{ color: currentStep >= step.id ? "#1a1c1c" : "rgba(26,28,28,0.35)" }}>
                  {step.name}
                </span>
              </motion.div>
              {index < steps.length - 1 && (
                <div className="w-8 sm:w-16 h-0.5 mx-1 mt-[-10px] transition-colors"
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
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Basic Information</h2>
                <div className="space-y-4">
                  <Field label="Business Name *">
                    <input className={inputCls} style={inputStyle} placeholder="Enter your business name"
                      value={formData.businessName} onChange={e => set("businessName", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <Field label="Owner Name *">
                    <input className={inputCls} style={inputStyle} placeholder="Enter owner name"
                      value={formData.ownerName} onChange={e => set("ownerName", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Email *">
                      <input type="email" className={inputCls} style={inputStyle} placeholder="you@example.com"
                        value={formData.email} onChange={e => set("email", e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </Field>
                    <Field label="Phone *">
                      <input type="tel" className={inputCls} style={inputStyle} placeholder="10-digit mobile"
                        value={formData.phone} onChange={e => set("phone", e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </Field>
                  </div>
                  <Field label="Business Type *">
                    <select className={inputCls} style={inputStyle}
                      value={formData.businessType} onChange={e => set("businessType", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur}>
                      <option value="">Select business type</option>
                      <option value="individual">Individual / Artisan</option>
                      <option value="proprietorship">Proprietorship</option>
                      <option value="partnership">Partnership</option>
                      <option value="private_ltd">Private Limited</option>
                      <option value="llp">LLP</option>
                    </select>
                  </Field>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Business Details</h2>
                <div className="space-y-4">
                  <Field label="GSTIN">
                    <input className={inputCls} style={inputStyle} placeholder="Enter 15-digit GSTIN"
                      value={formData.gstin} onChange={e => set("gstin", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <Field label="PAN Number *">
                    <input className={inputCls} style={inputStyle} placeholder="Enter 10-digit PAN"
                      value={formData.pan} onChange={e => set("pan", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <div className="p-4 rounded-xl text-[12px] text-[#92400e] leading-relaxed"
                    style={{ background: "rgba(217,119,6,0.07)", border: "1px solid rgba(217,119,6,0.2)" }}>
                    <strong>Note:</strong> GSTIN is required for selling on LoqMart. You can still register without one but won't be able to list products until GSTIN is added.
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Business Location</h2>
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

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Bank Details</h2>
                <div className="space-y-4">
                  <Field label="Bank Account Number *">
                    <input className={inputCls} style={inputStyle} placeholder="Enter bank account number"
                      value={formData.bankAccount} onChange={e => set("bankAccount", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <Field label="IFSC Code *">
                    <input className={inputCls} style={inputStyle} placeholder="Enter 11-digit IFSC code"
                      value={formData.ifsc} onChange={e => set("ifsc", e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </Field>
                  <div className="p-4 rounded-xl text-[12px] text-[#1a1c1c]/55"
                    style={{ background: "#eeece8" }}>
                    Your bank details are securely encrypted and only used for processing payouts.
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[16px] font-black text-[#1a1c1c] mb-5">Review & Submit</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Business Name", formData.businessName],
                      ["Owner Name",    formData.ownerName],
                      ["Email",         formData.email],
                      ["Phone",         formData.phone],
                      ["State",         formData.state],
                      ["City",          formData.city],
                    ].map(([label, value]) => (
                      <div key={label} className="p-4 rounded-xl" style={{ background: "#eeece8" }}>
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/40 mb-1">{label}</p>
                        <p className="text-[13px] font-semibold text-[#1a1c1c]">{value || "—"}</p>
                      </div>
                    ))}
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
                      <li>You'll receive an email once approved</li>
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
              onClick={currentStep < 5 ? nextStep : handleSubmit}
              disabled={(currentStep === 5 && !formData.acceptTerms) || isSubmitting}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-black disabled:opacity-40"
              style={{ background: currentStep === 5 ? "#22c55e" : "#fcd020", color: currentStep === 5 ? "white" : "#1a1c1c" }}>
              {isSubmitting
                ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                : currentStep < 5
                  ? <>Continue <ChevronRight size={14} /></>
                  : "Submit Application"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
