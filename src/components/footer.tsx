"use client"

import Link from "next/link"
import { MapPin, Mail, Phone } from "lucide-react"

// Social icons as inline SVGs (lucide-react doesn't include social brand icons)
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
)
const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

const footerLinks = {
  "Buyers": [
    { label: "How to Buy", href: "/how-to-buy" },
    { label: "Shipping Policy", href: "/shipping" },
    { label: "Return Policy", href: "/returns" },
    { label: "Track Order", href: "/account" },
    { label: "LoqCoins Program", href: "/loqcoins" },
  ],
  "Sellers": [
    { label: "Sell on LoqMart", href: "/seller/register" },
    { label: "Seller Dashboard", href: "/seller/dashboard" },
    { label: "Seller Agreement", href: "/seller/terms" },
    { label: "Commission Structure", href: "/seller/commission" },
    { label: "Swadeshi Rank", href: "/seller/swadeshi-rank" },
  ],
  "Discover": [
    { label: "India Map", href: "/india-map" },
    { label: "Best Sellers", href: "/best-sellers" },
    { label: "New Arrivals", href: "/new" },
    { label: "Craft Chronicles Blog", href: "/blog" },
    { label: "All Categories", href: "/category" },
  ],
  "Company": [
    { label: "About LoqMart", href: "/about" },
    { label: "Our Mission", href: "/mission" },
    { label: "Press & Media", href: "/press" },
    { label: "Careers", href: "/careers" },
    { label: "Contact Us", href: "/contact" },
  ],
}

const legalLinks = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Seller Agreement", href: "/seller/terms" },
  { label: "Shipping Policy", href: "/shipping" },
  { label: "Return & Refund Policy", href: "/returns" },
  { label: "Grievance Redressal", href: "/grievance" },
]

const socialLinks = [
  { Icon: InstagramIcon, href: "#", label: "Instagram" },
  { Icon: TwitterIcon, href: "#", label: "Twitter" },
  { Icon: FacebookIcon, href: "#", label: "Facebook" },
  { Icon: YoutubeIcon, href: "#", label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="w-full bg-[#1a1c1c] text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-black tracking-wide uppercase text-white block mb-4">
              LoqMart
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              India's own Swadeshi marketplace. Connecting verified Indian manufacturers, artisans and MSMEs directly to buyers - state by state.
            </p>
            <div className="space-y-2 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>New Delhi, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>support@loqmart.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>1800-LOQMART (toll-free)</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 bg-white/10 hover:bg-[#fcd020] hover:text-[#231b00] rounded-lg flex items-center justify-center transition-all duration-200"
                >
                  <s.Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-bold uppercase text-xs tracking-widest text-white/40 mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white hover:underline underline-offset-2 decoration-[#fcd020] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* GI certification strip */}
        <div className="border border-white/10 rounded-xl p-5 mb-8">
          <div className="flex flex-wrap gap-6 justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Trusted & Verified</p>
              <div className="flex flex-wrap gap-4 text-sm font-bold text-white">
                <span>&#10003; GST Verified Sellers</span>
                <span>&#10003; All sellers MSME registered</span>
                <span>&#10003; PAN verified</span>
                <span>&#10003; Razorpay secured payments</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/30 uppercase tracking-widest">Payment Partners</p>
              <p className="text-white/60 font-bold text-sm mt-1">Razorpay · UPI · IMPS · NEFT</p>
            </div>
          </div>
        </div>

        {/* Legal strip */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-white/30 text-xs">
            &copy; 2024 LoqMart India Pvt. Ltd. All rights reserved. CIN: U74999DL2024PTC123456
          </p>
          <div className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/30 hover:text-white/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
