import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-xs border border-brand-700/20 active:scale-[0.98]",
  secondary:
    "bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 shadow-xs border border-navy-950/20 active:scale-[0.98]",
  outline:
    "border border-slate-300/90 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400/80 shadow-xs active:scale-[0.98]",
  subtle:
    "bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/70 active:scale-[0.98]",
  ghost:
    "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 active:scale-[0.98]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs border border-red-700/20 active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  xs: "text-2xs px-2.5 py-1 gap-1 rounded-md",
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-3.5 py-2 gap-2 rounded-lg",
  lg: "text-sm font-semibold px-5 py-2.5 gap-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "focus-ring inline-flex items-center justify-center font-medium tracking-tight transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
