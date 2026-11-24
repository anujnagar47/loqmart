import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, MapPin } from "lucide-react"
import { STATE_STORIES, type StateStory } from "@/lib/state-stories"

export function StateStoryPage({ story }: { story: StateStory }) {
  const relatedStories = STATE_STORIES.filter((item) => item.slug !== story.slug).slice(0, 2)
  return (
    <main className="min-h-screen bg-[#fbf9f5] text-[#1a1c1c]">
      <section className="relative isolate min-h-[430px] overflow-hidden bg-[#4d4632] md:min-h-[540px]">
        {story.image && <Image src={story.image} alt={story.imageAlt} fill priority sizes="100vw" className="-z-10 object-cover" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
        {story.image && <span className="absolute bottom-3 right-4 rounded-sm bg-black/50 px-2 py-1 text-[10px] font-medium text-white/90">Illustrative artwork</span>}
        <div className="mx-auto flex min-h-[430px] max-w-7xl items-end px-5 pb-10 md:min-h-[540px] md:px-8 md:pb-16">
          <div className="max-w-3xl text-white">
            <Link href="/blog" className="mb-7 inline-flex items-center gap-2 text-sm text-white/85 hover:text-white"><BookOpen size={16} /> The Craft Chronicles</Link>
            <p className="mb-3 text-sm font-semibold tracking-wide text-white/85">{story.greeting}</p>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80"><MapPin size={14} /> State story</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">{story.state}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 md:text-lg">{story.focus}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-10 md:grid-cols-[minmax(0,1fr)_280px] md:px-8 md:py-16">
        <article className="min-w-0">
          <p className="mb-10 border-l-4 border-[#fcd020] pl-5 text-xl leading-8 text-[#4d4632]">{story.intro}</p>
          <div className="space-y-12">
            {story.sections.map((section, index) => <section key={section.heading} id={`section-${index + 1}`} className="scroll-mt-24">
              <h2 className="mb-5 text-2xl font-bold tracking-tight md:text-3xl">{section.heading}</h2>
              <div className="space-y-5 text-[16px] leading-8 text-[#34332d]">
                {section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
              </div>
            </section>)}
          </div>

          <section className="mt-14 border-t border-[#d0c6ac] pt-9" aria-labelledby="story-faq-heading">
            <h2 id="story-faq-heading" className="mb-6 text-2xl font-bold tracking-tight">Questions about {story.state}</h2>
            <div className="divide-y divide-[#e5dfd2]">
              {story.faqs.map((faq) => <details key={faq.question} className="py-4">
                <summary className="cursor-pointer font-semibold">{faq.question}</summary>
                <p className="mt-3 leading-7 text-[#4d4632]">{faq.answer}</p>
              </details>)}
            </div>
          </section>

          <div className="mt-12 rounded-md bg-[#fcd020] p-6 md:p-8">
            <h2 className="text-xl font-bold">Discover products from {story.state}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4d4632]">Browse current listings from independent sellers and read the origin and material details shared on each product page.</p>
            <Link href={`/state/${story.stateCode.toLowerCase()}`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-sm bg-[#231b00] px-5 text-sm font-semibold text-white hover:bg-[#3b300c]">Explore {story.state} products <ArrowRight size={16} /></Link>
          </div>
        </article>

        <aside className="space-y-6 md:sticky md:top-24 md:self-start">
          <div className="rounded-md border border-[#d0c6ac] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#4d4632]">In this story</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {story.sections.map((section, index) => <li key={section.heading}><a className="text-[#4d4632] hover:text-[#725c00] hover:underline" href={`#section-${index + 1}`}>{section.heading}</a></li>)}
              <li><a className="text-[#4d4632] hover:text-[#725c00] hover:underline" href="#story-faq-heading">Frequently asked questions</a></li>
            </ol>
          </div>
          <div className="rounded-md border border-[#d0c6ac] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#4d4632]">Explore related collections</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {story.categories.map((category) => <Link key={category.href} href={category.href} className="rounded-sm border border-[#d0c6ac] px-3 py-2 text-xs font-semibold text-[#4d4632] hover:border-[#725c00]">{category.label}</Link>)}
            </div>
          </div>
          <div className="rounded-md border border-[#d0c6ac] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#4d4632]">Continue across India</h2>
            <div className="mt-4 space-y-3">
              {relatedStories.map((related) => <Link key={related.slug} href={`/blog/states/${related.slug}`} className="block text-sm font-semibold leading-5 text-[#4d4632] hover:text-[#725c00] hover:underline">{related.state}: {related.focus}</Link>)}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
