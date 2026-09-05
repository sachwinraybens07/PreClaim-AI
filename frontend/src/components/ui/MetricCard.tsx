import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";

export function useCountUp(end: number, duration: number = 700): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(end);
      return;
    }

    if (!end || isNaN(end)) {
      setCount(0);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return count;
}

export function MetricCard({
  icon,
  label,
  value,
  subtext,
  tone = "neutral",
  variant = "card",
  animate = true,
  className,
}: {
  icon?: ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  tone?: "neutral" | "brand" | "orange" | "amber" | "emerald" | "red";
  variant?: "card" | "plain" | "tile";
  animate?: boolean;
  className?: string;
}) {
  const toneClass: Record<string, { iconBg: string; text: string }> = {
    neutral: { iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
    brand: { iconBg: "bg-brand-50 text-brand-600 border border-brand-200/60", text: "text-brand-900" },
    orange: { iconBg: "bg-orange-50 text-orange-600 border border-orange-200/60", text: "text-orange-950" },
    amber: { iconBg: "bg-amber-50 text-amber-600 border border-amber-200/60", text: "text-amber-950" },
    emerald: { iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/60", text: "text-emerald-950" },
    red: { iconBg: "bg-red-50 text-red-600 border border-red-200/60", text: "text-red-950" },
  };

  const currentTone = toneClass[tone] || toneClass.neutral;
  const isNumber = typeof value === "number";
  const animatedNumber = useCountUp(isNumber ? value : 0);
  const displayValue = isNumber && animate ? animatedNumber : value;

  if (variant === "tile") {
    return (
      <div
        className={cn(
          "flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card-hover",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          {icon && (
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105", currentTone.iconBg)}>
              {icon}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-figure text-2xl font-extrabold tracking-tight text-slate-900">{displayValue}</p>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3.5",
        variant === "card" && "rounded-xl border border-slate-200/80 bg-white p-4 shadow-card",
        className
      )}
    >
      {icon && (
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", currentTone.iconBg)}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-figure text-xl font-extrabold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        {subtext && <p className="mt-0.5 text-2xs text-slate-400">{subtext}</p>}
      </div>
    </div>
  );
}
