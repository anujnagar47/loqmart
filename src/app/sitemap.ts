import type { MetadataRoute } from "next"
import { createServiceClient } from "@/lib/supabase/admin"
import { STATE_STORIES } from "@/lib/state-stories"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const STATIC_ROUTES = [
  "", "about", "mission", "careers", "press", "contact", "grievance",
  "how-to-buy", "shipping", "returns", "terms", "privacy",
  "category", "best-sellers", "new", "sellers", "blog", "india-map", "loqcoins",
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()

  const [products, categories, blogPosts, sellers] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("approval_status", "approved").order("created_at", { ascending: false }).limit(1000),
    supabase.from("categories").select("slug"),
    supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true),
    supabase.from("sellers").select("id, updated_at").eq("approval_status", "approved").limit(1000),
  ])

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(route => ({
    url: `${BASE_URL}/${route}`,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }))

  const productEntries: MetadataRoute.Sitemap = (products.data || []).map(p => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: p.updated_at || undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const categoryEntries: MetadataRoute.Sitemap = (categories.data || []).map(c => ({
    url: `${BASE_URL}/category/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  const blogEntries: MetadataRoute.Sitemap = (blogPosts.data || []).map(b => ({
    url: `${BASE_URL}/blog/${b.slug}`,
    lastModified: b.updated_at || undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }))

  const sellerEntries: MetadataRoute.Sitemap = (sellers.data || []).map(s => ({
    url: `${BASE_URL}/seller/${s.id}`,
    lastModified: s.updated_at || undefined,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  const stateStoryEntries: MetadataRoute.Sitemap = STATE_STORIES.map((story) => ({
    url: `${BASE_URL}/blog/states/${story.slug}`,
    changeFrequency: "monthly",
    priority: 0.65,
  }))

  return [...staticEntries, ...productEntries, ...categoryEntries, ...blogEntries, ...sellerEntries, ...stateStoryEntries]
}
