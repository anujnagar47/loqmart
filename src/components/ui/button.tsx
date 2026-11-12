"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:brightness-95",
  {
    variants: {
      variant: {
        default: "border-[#EAB308] bg-[#FACC15] text-[#111827] hover:border-[#CA8A04] hover:bg-[#CA8A04]",
        secondary: "border-[#111827] bg-[#111827] text-white hover:bg-[#374151]",
        outline: "border-[#E5E7EB] bg-white text-[#111827] shadow-sm hover:bg-[#FBF9F5]",
        ghost: "border-transparent text-[#4B5563] hover:bg-[#FBF9F5]",
        link: "border-transparent h-auto p-0 text-primary underline-offset-2 hover:underline",
        destructive: "border-transparent bg-error text-on-error hover:brightness-95",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-6",
        xl: "h-12 px-8 text-base",
        icon: "h-10 w-10 shrink-0",
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
