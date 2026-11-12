"use client"

import { useEffect, useId, useRef, useState } from "react"
import { FileText, ImagePlus, Loader2, Upload, X } from "lucide-react"

export type UploadPurpose = "product-image" | "blog-image" | "category-image" | "seller-document" | "seller-portfolio"

interface FileUploadZoneProps {
  value: string[]
  onChange: (value: string[]) => void
  purpose: UploadPurpose
  maxFiles?: number
  label?: string
  aspectRatio?: "1:1" | "16:9"
  disabled?: boolean
}

interface PendingUpload {
  id: string
  name: string
  preview?: string
  progress: number
}

interface UploadResult { url: string; previewUrl?: string }

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"]
const SIZE_LIMITS: Record<UploadPurpose, number> = {
  "product-image": 5 * 1024 * 1024,
  "blog-image": 5 * 1024 * 1024,
  "category-image": 5 * 1024 * 1024,
  "seller-document": 15 * 1024 * 1024,
  "seller-portfolio": 5 * 1024 * 1024,
}

function displayName(value: string) {
  try { return decodeURIComponent(value.split("/").pop()?.split("?")[0] || "Uploaded file") }
  catch { return "Uploaded file" }
}

function uploadFile(file: File, purpose: UploadPurpose, onProgress: (progress: number) => void) {
  return new Promise<UploadResult>((resolve, reject) => {
    const body = new FormData()
    body.append("file", file)
    body.append("purpose", purpose)

    const request = new XMLHttpRequest()
    request.open("POST", "/api/upload")
    request.responseType = "json"
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onerror = () => reject(new Error("Upload failed. Check your connection and try again."))
    request.onabort = () => reject(new Error("Upload was cancelled."))
    request.onload = () => {
      const response = request.response as { url?: string; previewUrl?: string; error?: string } | null
      if (request.status < 200 || request.status >= 300 || !response?.url) {
        reject(new Error(response?.error || "Upload failed. Please try again."))
        return
      }
      resolve({ url: response.url, previewUrl: response.previewUrl })
    }
    request.send(body)
  })
}

export function FileUploadZone({
  value,
  onChange,
  purpose,
  maxFiles = 1,
  label = "Choose files",
  aspectRatio,
  disabled = false,
}: FileUploadZoneProps) {
  const inputId = useId()
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [uploadedPreviews, setUploadedPreviews] = useState<Record<string, string>>({})
  const previewUrls = useRef(new Set<string>())
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)
  const isDocument = purpose === "seller-document"
  const acceptedTypes = isDocument ? DOCUMENT_TYPES : IMAGE_TYPES
  const accept = isDocument ? ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" : ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
  const maxSize = SIZE_LIMITS[purpose]

  useEffect(() => () => previewUrls.current.forEach(URL.revokeObjectURL), [])

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || disabled) return
    setError("")
    const remaining = maxFiles - value.length - pending.length
    if (remaining <= 0) {
      setError(`You can upload up to ${maxFiles} ${maxFiles === 1 ? "file" : "files"}.`)
      return
    }
    const selected = Array.from(fileList).slice(0, remaining)
    if (fileList.length > remaining) setError(`Only ${remaining} more ${remaining === 1 ? "file can" : "files can"} be added.`)

    let nextValues = [...value]
    for (const file of selected) {
      if (!acceptedTypes.includes(file.type)) {
        setError(isDocument ? "Choose a PDF, JPG, or PNG file." : "Choose a JPG, PNG, or WEBP image.")
        continue
      }
      if (file.size > maxSize) {
        setError(`File must be ${isDocument ? "15MB" : "5MB"} or smaller.`)
        continue
      }

      const id = `${file.name}-${file.lastModified}-${Math.random()}`
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
      if (preview) previewUrls.current.add(preview)
      setPending(current => [...current, { id, name: file.name, preview, progress: 0 }])
      let keepLocalPreview = false
      try {
        const uploaded = await uploadFile(file, purpose, progress => {
          setPending(current => current.map(item => item.id === id ? { ...item, progress } : item))
        })
        const url = uploaded.url
        nextValues = [...nextValues, url]
        onChange(nextValues)
        if (preview) {
          keepLocalPreview = true
          setUploadedPreviews(current => ({ ...current, [url]: preview }))
        }
        else if (uploaded.previewUrl) setUploadedPreviews(current => ({ ...current, [url]: uploaded.previewUrl! }))
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.")
      } finally {
        if (preview && !keepLocalPreview) {
          URL.revokeObjectURL(preview)
          previewUrls.current.delete(preview)
        }
        setPending(current => current.filter(item => item.id !== id))
      }
    }
  }

  const remove = (index: number) => {
    const removed = value[index]
    const preview = uploadedPreviews[removed]
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview)
      previewUrls.current.delete(preview)
    }
    setUploadedPreviews(current => {
      const next = { ...current }
      delete next[removed]
      return next
    })
    onChange(value.filter((_, itemIndex) => itemIndex !== index))
    setError("")
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, index) => {
            const name = displayName(url)
            const uploadedPreview = uploadedPreviews[url]
            const isRemoteImage = /^https?:\/\//.test(url) && /\.(jpe?g|png|webp)(\?|$)/i.test(url)
            const imageSource = uploadedPreview || (!isDocument || isRemoteImage ? url : undefined)
            return (
              <div key={`${url}-${index}`} className="relative overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
                {imageSource ? (
                  <div className={aspectRatio === "16:9" ? "aspect-video" : "aspect-square"}>
                    <img src={imageSource} alt={name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex min-h-20 items-center gap-2 p-3 pr-10 text-xs text-[#4B5563]">
                    <FileText size={18} className="shrink-0" aria-hidden="true" />
                    <span className="min-w-0 break-all">{name}</span>
                  </div>
                )}
                <button type="button" onClick={() => remove(index)} disabled={disabled}
                  aria-label={`Remove ${name}`}
                  className="absolute right-2 top-2 inline-flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-xs font-medium text-[#111827] shadow-sm hover:bg-[#FBF9F5] disabled:opacity-50">
                  <X size={13} aria-hidden="true" /> Remove
                </button>
              </div>
            )
          })}
        </div>
      )}

      {pending.map(item => (
        <div key={item.id} className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-white p-3">
          {item.preview ? <img src={item.preview} alt="" className="h-12 w-12 rounded object-cover" /> : <FileText size={20} />}
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-3 text-xs"><span className="truncate">{item.name}</span><span>{item.progress}%</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-[#F3F4F6]">
              <div className="h-full bg-[#EAB308] transition-[width] duration-150" style={{ width: `${item.progress}%` }} />
            </div>
          </div>
          <Loader2 size={16} className="animate-spin text-[#4B5563]" aria-label="Uploading" />
        </div>
      ))}

      {value.length + pending.length < maxFiles && (
        <label htmlFor={inputId}
          onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); void handleFiles(event.dataTransfer.files) }}
          className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-5 text-center transition-colors ${dragging ? "border-[#EAB308] bg-[#FACC15]/10" : "border-[#E5E7EB] bg-white hover:bg-[#FBF9F5]"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#FBF9F5] text-[#111827]">
            {pending.length ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} aria-hidden="true" />}
          </span>
          <span className="text-sm font-medium text-[#111827]">{label}</span>
          <span className="text-xs text-[#4B5563]">
            {isDocument ? "PDF, JPG, or PNG · up to 15MB" : `JPG, PNG, or WEBP · up to 5MB${aspectRatio ? ` · ${aspectRatio} recommended` : ""}`}
          </span>
          <input id={inputId} type="file" accept={accept} multiple={maxFiles > 1} disabled={disabled || value.length + pending.length >= maxFiles}
            className="sr-only" onChange={event => { void handleFiles(event.currentTarget.files); event.currentTarget.value = "" }} />
        </label>
      )}

      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  )
}
