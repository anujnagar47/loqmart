import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { STATE_STORIES, stateStoryBySlug } from "@/lib/state-stories"
import { StateStoryPage } from "./StateStoryPage"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export function generateStaticParams() {
  return STATE_STORIES.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const story = stateStoryBySlug(slug)
  if (!story) return { title: "State story not found | LoqMart" }
  return {
    title: story.seoTitle,
    description: story.metaDescription,
    keywords: [story.primaryKeyword, ...story.relatedKeywords],
    alternates: { canonical: `/blog/states/${story.slug}` },
    openGraph: { title: story.seoTitle, description: story.metaDescription, images: story.image ? [story.image] : undefined, type: "article" },
  }
}

export default async function StateStoryRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const story = stateStoryBySlug(slug)
  if (!story) notFound()

  const articleLd = {
    "@context": "https://schema.org", "@type": "Article", headline: story.seoTitle,
    description: story.metaDescription, image: story.image ? `${SITE_URL}${story.image}` : undefined,
    author: { "@type": "Organization", name: "LoqMart Editorial" },
    publisher: { "@type": "Organization", name: "LoqMart" }, mainEntityOfPage: `${SITE_URL}/blog/states/${story.slug}`,
  }
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: story.faqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
  }
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} /><StateStoryPage story={story} /></>
}
