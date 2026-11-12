import { InquiryPanel } from "@/components/inquiry/InquiryPanel"

export const metadata = { title: "My Inquiry List | LoqMart" }

export default function InquiryPage() {
  return <main className="min-h-[calc(100vh-10rem)] bg-[#FBF9F5] px-4 py-4 sm:px-6"><InquiryPanel page /></main>
}
