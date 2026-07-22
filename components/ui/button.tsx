import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "danger" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-bold border-[3px] border-black transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          
          // Size variants
          size === "default" && "h-11 px-4 py-2",
          size === "sm" && "h-9 px-3 text-sm",
          size === "lg" && "h-14 px-8 text-lg",
          size === "icon" && "h-11 w-11",
          
          // Color variants (Neo-brutalist)
          variant === "default" && "bg-white text-black shadow-brutal hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-1 active:translate-x-1 active:shadow-brutal-active",
          variant === "primary" && "bg-brand-blue text-black shadow-brutal hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-1 active:translate-x-1 active:shadow-brutal-active",
          variant === "secondary" && "bg-brand-yellow text-black shadow-brutal hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-1 active:translate-x-1 active:shadow-brutal-active",
          variant === "danger" && "bg-brand-pink text-black shadow-brutal hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-1 active:translate-x-1 active:shadow-brutal-active",
          variant === "ghost" && "border-transparent bg-transparent hover:bg-gray-100",
          
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
