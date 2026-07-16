import type { BlogPost } from "@/app/blog/BlogClient"

interface BlogPostRow {
  id: string
  slug: string
  title: string
  excerpt: string
  image_url: string | null
  state: string | null
  state_code: string | null
  category: string
  read_time: string | null
  author: string
  published_at: string | null
  created_at: string
}

// Maps a raw blog_posts DB row (snake_case) to the shape the blog UI expects.
export function mapBlogPostRow(p: BlogPostRow): BlogPost {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    image: p.image_url || "",
    state: p.state || "",
    stateCode: p.state_code || "",
    category: p.category,
    readTime: p.read_time || "",
    date: new Date(p.published_at || p.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    }),
    author: p.author,
  }
}
