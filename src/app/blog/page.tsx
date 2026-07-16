import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/admin"
import { mapBlogPostRow } from "@/lib/blog"
import { BlogClient, type BlogPost } from "./BlogClient"

export const metadata: Metadata = {
  title: "The Craft Chronicles – LoqMart Blog",
  description: "Stories on Indian artisanship, manufacturing heritage, and the makers behind LoqMart's handmade and machine-made products, state by state.",
}

// Re-fetch periodically so newly published posts show up without a full redeploy.
export const revalidate = 300

async function fetchInitialPosts(): Promise<BlogPost[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) { console.error("Blog initial fetch error:", error); return [] }
    return (data || []).map(mapBlogPostRow)
  } catch (err) {
    console.error("Blog initial fetch failed:", err)
    return []
  }
}

export default async function BlogPage() {
  const initialPosts = await fetchInitialPosts()
  return <BlogClient initialPosts={initialPosts} />
}
