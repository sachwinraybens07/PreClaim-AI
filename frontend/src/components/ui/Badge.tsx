import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { RISK_META, STATUS_META } from "../../utils/risk";
import type { RiskLevel } from "../../types";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tracking-tight border",
        className
      )}
      {...props}
    />
  );
}

export function RiskBadge({
  level,
  size = "md",
  score,
  variant = "pill",
}: {
  level: RiskLevel;
  size?: "sm" | "md";
  score?: number;
  variant?: "pill" | "text";
}) {
  const meta = RISK_META[level] || RISK_META.LOW;

  if (variant === "text") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold",
          size === "sm" ? "text-xs" : "text-sm",
          meta.color
        )}
      >
        <span className={cn("inline-block shrink-0 rounded-full", meta.dot, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
        {typeof score === "number" && <span className="text-figure font-bold">{score}%</span>}
        <span>{meta.label}</span>
      </span>
    );
  }

  // Pill variant with refined border & background
  const pillColors = {
    LOW: "bg-emerald-50 text-emerald-800 border-emerald-200/90",
    MEDIUM: "bg-amber-50 text-amber-800 border-amber-200/90",
    HIGH: "bg-orange-50 text-orange-800 border-orange-200/90",
    CRITICAL: "bg-red-50 text-red-800 border-red-200/90",
  }[level] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-tight shadow-xs",
        size === "sm" ? "px-2 py-0.5 text-2xs" : "px-2.5 py-1 text-xs",
        pillColors
      )}
    >
      <span className={cn("inline-block shrink-0 rounded-full", meta.dot, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      {typeof score === "number" && <span className="text-figure font-bold">{score}%</span>}
      <span>{meta.label}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, className: "bg-slate-50 text-slate-700 border-slate-200" };

  const statusStyles: Record<string, string> = {
    NEW: "bg-slate-50 text-slate-700 border-slate-200",
    ANALYZING: "bg-blue-50 text-blue-800 border-blue-200/80",
    ACTION_REQUIRED: "bg-orange-50 text-orange-800 border-orange-200/80",
    READY: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    SUBMITTED: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
    COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider",
        statusStyles[status] || meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const priorityStyles: Record<string, string> = {
    LOW: "bg-slate-50 text-slate-600 border-slate-200",
    MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
    HIGH: "bg-orange-50 text-orange-800 border-orange-200",
    CRITICAL: "bg-red-50 text-red-800 border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider",
        priorityStyles[priority] || "bg-slate-50 text-slate-600 border-slate-200"
      )}
    >
      {priority}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const urgencyStyles: Record<string, string> = {
    STANDARD: "bg-slate-100 text-slate-700 border-slate-200",
    URGENT: "bg-amber-50 text-amber-800 border-amber-200",
    EMERGENCY: "bg-red-50 text-red-800 border-red-200 animate-pulse-subtle",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider",
        urgencyStyles[urgency] || "bg-slate-50 text-slate-600 border-slate-200"
      )}
    >
      {urgency}
    </span>
  );
}

const PAYER_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  "UnitedHealthcare": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200" },
  "Blue Cross Blue Shield": { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  "Aetna": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  "Cigna": { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
  "Medicare": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" },
  "Humana": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
};

export function PayerBadge({ payer }: { payer: string }) {
  const theme = PAYER_THEMES[payer] || { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-tight",
        theme.bg,
        theme.text,
        theme.border
      )}
    >
      {payer}
    </span>
  );
}
