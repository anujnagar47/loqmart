import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/admin"
import { mapBlogPostRow } from "@/lib/blog"
import { STATE_STORIES } from "@/lib/state-stories"
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
    const cmsPosts = (data || []).map(mapBlogPostRow)
    const editorialPosts = STATE_STORIES.map((story) => ({
      id: `state-story-${story.slug}`, slug: `states/${story.slug}`, title: `${story.state}: ${story.focus}`,
      excerpt: story.intro, image: story.image, state: story.state, stateCode: story.stateCode,
      category: "Heritage", readTime: "8 min", date: "State story", author: "LoqMart Editorial",
    }))
    return [...editorialPosts, ...cmsPosts.filter((post) => !STATE_STORIES.some((story) => post.slug === story.slug))]
  } catch (err) {
    console.error("Blog initial fetch failed:", err)
    return []
  }
}

export default async function BlogPage() {
  const initialPosts = await fetchInitialPosts()
  return <BlogClient initialPosts={initialPosts} />
}
