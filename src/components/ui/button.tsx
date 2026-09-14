"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Amazon/Flipkart-style flat buttons: thin border, small radius, subtle
// gradient on the primary action rather than a flat fill — LoqMart's own
// yellow/black palette, Amazon's shape language (per the confirmed "full
// Amazon/Flipkart functional style" direction).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] border text-sm font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:brightness-95",
  {
    variants: {
      variant: {
        // Primary CTA — "Add to Cart" style: gold gradient, thin border
        default: "border-[#a88734]/50 bg-gradient-to-b from-[#f8db6b] to-[#fcd020] text-[#1a1c1c] shadow-[0_1px_0_rgba(255,255,255,0.5)_inset] hover:from-[#f6d34e] hover:to-[#f0c700]",
        // "Buy Now" style: solid dark, flat
        secondary: "border-transparent bg-[#1a1c1c] text-white hover:bg-[#1a1c1c]/88",
        outline: "border-outline-variant bg-white text-on-surface hover:bg-surface-container-low",
        ghost: "border-transparent text-on-surface hover:bg-surface-container-low",
        link: "border-transparent h-auto p-0 text-[#0a6ac9] underline-offset-2 hover:underline",
        destructive: "border-transparent bg-error text-on-error hover:brightness-95",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        xl: "h-12 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
