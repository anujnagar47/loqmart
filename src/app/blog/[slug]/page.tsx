import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/admin"
import { BlogPostClient, type BlogPostDetail } from "./BlogPostClient"

async function getPost(slug: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Story Not Found — LoqMart" }

  return {
    title: `${post.title} — LoqMart Craft Chronicles`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.image_url ? [post.image_url] : undefined,
      type: "article",
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  // Fire-and-forget view count — the column has existed since the schema
  // was created but nothing was ever incrementing it.
  const supabase = createServiceClient()
  void supabase.from("blog_posts").update({ view_count: (post.view_count || 0) + 1 }).eq("id", post.id)

  const detail: BlogPostDetail = {
    title: post.title,
    excerpt: post.excerpt,
    image: post.image_url || "",
    state: post.state || "",
    stateCode: post.state_code || "",
    category: post.category,
    readTime: post.read_time || "",
    date: new Date(post.published_at || post.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    }),
    author: post.author,
    content: (post.content || post.excerpt)
      .split(/\n\s*\n/)
      .map((p: string) => p.trim())
      .filter(Boolean),
  }

  return <BlogPostClient post={detail} />
}
