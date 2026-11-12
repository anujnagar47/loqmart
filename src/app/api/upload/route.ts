import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024

type Purpose = "product-image" | "blog-image" | "category-image" | "seller-document" | "seller-portfolio"

function isPurpose(value: string): value is Purpose {
  return ["product-image", "blog-image", "category-image", "seller-document", "seller-portfolio"].includes(value)
}

function matchesSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  if (type === "application/pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  return false
}

function safeFileName(name: string) {
  return name.normalize("NFKD").replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "upload"
}

export async function POST(request: NextRequest) {
  const sessionClient = await createClient()
  const { data: { user }, error: authError } = await sessionClient.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Sign in before uploading files." }, { status: 401 })

  const requestSize = Number(request.headers.get("content-length") || 0)
  if (requestSize > MAX_DOCUMENT_SIZE + 128 * 1024) {
    return NextResponse.json({ error: "The upload is larger than the 15MB maximum." }, { status: 413 })
  }

  const body = await request.formData()
  const file = body.get("file")
  const purposeValue = body.get("purpose")
  if (!(file instanceof File) || typeof purposeValue !== "string" || !isPurpose(purposeValue)) {
    return NextResponse.json({ error: "Choose a valid file and upload type." }, { status: 400 })
  }
  const purpose = purposeValue
  const isDocument = purpose === "seller-document"
  const allowedTypes: readonly string[] = isDocument ? DOCUMENT_TYPES : IMAGE_TYPES
  const maxSize = isDocument ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: isDocument ? "Only PDF, JPG, or PNG files are accepted." : "Only JPG, PNG, or WEBP images are accepted." }, { status: 415 })
  }
  if (file.size <= 0 || file.size > maxSize) {
    return NextResponse.json({ error: `File must be ${isDocument ? "15MB" : "5MB"} or smaller.` }, { status: 413 })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!matchesSignature(file.type, bytes)) {
    return NextResponse.json({ error: "The file content does not match its file type." }, { status: 415 })
  }

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient.from("users").select("role").eq("id", user.id).maybeSingle()
  const isAdmin = profile?.role === "admin" || profile?.role === "sub_admin"
  let sellerId: string | null = null

  if (purpose === "blog-image" || purpose === "category-image" || (purpose === "product-image" && isAdmin)) {
    const admin = await requireAdmin()
    if (!admin.authorized) return admin.response
  } else if (purpose === "product-image") {
    const { data: seller } = await serviceClient.from("sellers").select("id, approval_status").eq("user_id", user.id).maybeSingle()
    if (!seller || seller.approval_status !== "approved") {
      return NextResponse.json({ error: "Only approved sellers can upload product images." }, { status: 403 })
    }
    sellerId = seller.id
  } else if (purpose === "seller-document" && isAdmin) {
    return NextResponse.json({ error: "Seller documents can only be uploaded by the applicant." }, { status: 403 })
  }

  if (purpose === "seller-portfolio" && isAdmin) {
    return NextResponse.json({ error: "Portfolio images can only be uploaded by the applicant." }, { status: 403 })
  }

  const bucket = purpose === "blog-image" ? "blog-images" : purpose === "seller-document" ? "seller-documents" : "product-images"
  const extension = EXTENSIONS[file.type]
  const objectName = `${crypto.randomUUID()}-${safeFileName(file.name)}.${extension}`
  const folder = purpose === "seller-document"
    ? `${user.id}/kyc`
    : purpose === "seller-portfolio"
      ? `${user.id}/portfolio`
    : purpose === "product-image" && sellerId
      ? `${sellerId}/products`
      : purpose === "blog-image"
        ? `${user.id}/blog`
        : purpose === "category-image"
          ? `${user.id}/categories`
          : `admin/${user.id}/products`
  const path = `${folder}/${objectName}`

  const { data, error } = await serviceClient.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  })
  if (error || !data) {
    console.error("Storage upload failed:", error)
    return NextResponse.json({ error: "The file could not be stored. Check the storage bucket configuration and try again." }, { status: 500 })
  }

  if (bucket === "seller-documents") {
    const { data: signedPreview } = await serviceClient.storage.from(bucket).createSignedUrl(data.path, 60 * 60)
    return NextResponse.json({ url: data.path, path: data.path, bucket, name: file.name, previewUrl: signedPreview?.signedUrl }, { status: 201 })
  }
  if (purpose === "seller-portfolio") return NextResponse.json({ url: data.path, path: data.path, bucket, name: file.name }, { status: 201 })
  const { data: publicAsset } = serviceClient.storage.from(bucket).getPublicUrl(data.path)
  return NextResponse.json({ url: publicAsset.publicUrl, path: data.path, bucket, name: file.name }, { status: 201 })
}
