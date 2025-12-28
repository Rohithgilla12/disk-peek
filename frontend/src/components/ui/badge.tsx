import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-accent)] text-white shadow",
        secondary:
          "border-transparent bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]",
        destructive:
          "border-transparent bg-[var(--color-danger)] text-white shadow",
        success:
          "border-transparent bg-[var(--color-success)] text-white shadow",
        warning:
          "border-transparent bg-[var(--color-warning)] text-black shadow",
        outline:
          "border-[var(--color-border)] text-[var(--color-text)]",
        ghost:
          "border-transparent bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
