import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export function MetricCard({
  icon,
  label,
  value,
  tone = "neutral",
  variant = "card",
  className,
}: {
  icon?: ReactNode;
  label: string;
  value: string | number;
  tone?: "neutral" | "brand" | "orange" | "amber" | "emerald" | "red";
  variant?: "card" | "plain";
  className?: string;
}) {
  const toneClass: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-600",
    brand: "bg-brand-50 text-brand-600",
    orange: "bg-orange-50 text-orange-600",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        variant === "card" && "rounded-lg border border-slate-200 bg-white p-4",
        className
      )}
    >
      {icon && (
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneClass[tone])}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-figure text-xl font-bold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}
