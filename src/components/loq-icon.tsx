import type { SVGProps } from "react"

export type LoqIconName =
  | "artisan-seal" | "buyer-basket" | "seller-studio" | "origin-pin"
  | "gi-seal" | "precision-compass" | "carved-door" | "loom-shuttle"
  | "pottery-vessel" | "madhubani-lotus" | "wood-carving" | "regional-arch"
  | "delivery-box" | "secure-payment" | "craft-threads"

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

export function LoqIcon({
  name,
  interactive = true,
  className = "",
  ...props
}: SVGProps<SVGSVGElement> & { name: LoqIconName; interactive?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      data-icon={name}
      viewBox="0 0 48 48"
      fill="none"
      className={`loq-icon ${interactive ? "loq-icon--interactive" : ""} ${className}`.trim()}
      {...props}
    >
      <g {...common}>
        {name === "artisan-seal" && <>
          <path className="loq-icon__accent" d="m24 4 4 3 5-.7 2.2 4.5 4.7 2.1-.7 5 3 4-3 4 .7 5-4.7 2.1-2.2 4.5-5-.7-4 3-4-3-5 .7-2.2-4.5-4.7-2.1.7-5-3-4 3-4-.7-5 4.7-2.1L15 6.3l5 .7z" />
          <circle cx="24" cy="24" r="11" /><path d="M16 24h16M18 20l6 8 6-8M20 18l4 3 4-3" />
        </>}
        {name === "buyer-basket" && <>
          <path className="loq-icon__accent" d="M9 21h30l-3.2 20H12.2z" />
          <path className="loq-icon__handle" d="m15 21 9-13 9 13" />
          <path d="M14 28h20M16 34h16M19 23l2 16M29 23l-2 16" />
        </>}
        {name === "seller-studio" && <>
          <path d="M7 40h34M10 40V23a14 14 0 0 1 28 0v17M14 40V24a10 10 0 0 1 20 0v16" />
          <path className="loq-icon__accent" d="M18 20h12v3H18z" />
          <path className="loq-icon__shuttle" d="m11 27 9-3 5 3-5 3zM25 30l9-5 3 4-9 5z" />
          <path d="M18 27h4M29 30l3-2" />
        </>}
        {name === "origin-pin" && <>
          <path className="loq-icon__accent" d="M24 44S9 28.2 9 18a15 15 0 1 1 30 0c0 10.2-15 26-15 26" />
          <path d="M24 36S14 25.3 14 18a10 10 0 0 1 20 0c0 7.3-10 18-10 18z" />
          <path d="M18 24V19a6 6 0 0 1 12 0v5M18 24h12M21 24v-4M27 24v-4" />
        </>}
        {name === "gi-seal" && <>
          <circle className="loq-icon__accent" cx="24" cy="24" r="19" />
          <circle cx="24" cy="24" r="14" /><path d="m24 14 2.6 6.2 6.4.5-4.9 4.2 1.6 6.3-5.7-3.4-5.7 3.4 1.6-6.3-4.9-4.2 6.4-.5z" />
          <path d="M18 36 16 44l8-4 8 4-2-8" />
        </>}
        {name === "precision-compass" && <>
          <path d="M12 9 24 20 36 9M12 9l4 30 8-10 8 10 4-30M24 20v9" />
          <circle className="loq-icon__accent" cx="24" cy="21" r="4" />
          <path d="M8 9h8M32 9h8M12 39h24" />
        </>}
        {name === "carved-door" && <>
          <path d="M8 42h32M12 42V21a12 12 0 0 1 24 0v21M17 42V22a7 7 0 0 1 14 0v20" />
          <path className="loq-icon__door" d="M18 23 29 20v20l-11 2z" />
          <circle cx="26" cy="32" r=".9" fill="currentColor" />
        </>}
        {name === "loom-shuttle" && <>
          <path d="M7 12h34M7 36h34M11 12v24M17 12v24M23 12v24M29 12v24M35 12v24M41 12v24" />
          <path className="loq-icon__accent" d="m12 24 12-6 12 6-12 6z" />
          <path className="loq-icon__shuttle" d="M12 24h24M24 18v12" />
        </>}
        {name === "pottery-vessel" && <>
          <path className="loq-icon__accent" d="M18 12h12c-1 4 1 6 4 10 3 4 2 11-1 16-2 3-5 5-9 5s-7-2-9-5c-3-5-4-12-1-16 3-4 5-6 4-10z" />
          <path d="M18 12h12M20 8h8M17 24c4 2 10 2 14 0M16 34c5 2 11 2 16 0" />
        </>}
        {name === "madhubani-lotus" && <>
          <path className="loq-icon__accent" d="M24 41c-8-6-14-12-13-19 7 0 12 4 13 11 1-7 6-11 13-11 1 7-5 13-13 19z" />
          <path d="M24 39C16 28 16 19 24 8c8 11 8 20 0 31zM11 22c-4-7-3-12 1-16 7 5 10 10 9 17M37 22c4-7 3-12-1-16-7 5-10 10-9 17M8 41h32M17 32l-7-1M31 32l7-1" />
        </>}
        {name === "wood-carving" && <>
          <path className="loq-icon__accent" d="M24 6c3 8 6 11 14 14-8 3-11 6-14 14-3-8-6-11-14-14 8-3 11-6 14-14z" />
          <path d="M24 12c2 5 5 8 10 10-5 2-8 5-10 10-2-5-5-8-10-10 5-2 8-5 10-10zM9 39l8-8M39 39l-8-8" />
          <circle cx="24" cy="20" r="2" />
        </>}
        {name === "regional-arch" && <>
          <path d="M7 41h34M11 41V24a13 13 0 0 1 26 0v17M17 41V25a7 7 0 0 1 14 0v16" />
          <path className="loq-icon__accent" d="M17 18a7 7 0 0 1 14 0v4H17z" />
          <path d="m20 30 4-4 4 4-4 4zM20 38h8" />
        </>}
        {name === "delivery-box" && <>
          <path className="loq-icon__accent" d="m7 16 17-9 17 9v20l-17 9-17-9z" />
          <path d="m7 16 17 9 17-9M24 25v20M15 12l17 10M12 27v5l7 4" />
        </>}
        {name === "secure-payment" && <>
          <path className="loq-icon__accent" d="M24 5 40 11v12c0 10-7 16-16 20C15 39 8 33 8 23V11z" />
          <path d="M24 11 34 15v8c0 7-4 11-10 15-6-4-10-8-10-15v-8zM18 24l4 4 8-9" />
        </>}
        {name === "craft-threads" && <>
          <path className="loq-icon__accent" d="M8 12h32v24H8z" />
          <path d="M8 18c8 0 8 12 16 12s8-12 16-12M8 30c8 0 8-12 16-12s8 12 16 12M14 12v24M22 12v24M30 12v24M38 12v24" />
        </>}
      </g>
    </svg>
  )
}
