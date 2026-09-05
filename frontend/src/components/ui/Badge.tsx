import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { RISK_META, STATUS_META, PRIORITY_META } from "../../utils/risk";
import type { RiskLevel } from "../../types";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
        className
      )}
      {...props}
    />
  );
}

export function RiskBadge({ level, size = "md", score }: { level: RiskLevel; size?: "sm" | "md"; score?: number }) {
  const meta = RISK_META[level];
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
      <span className={size === "sm" ? "" : "tracking-tight"}>{meta.label}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, className: "bg-slate-100 text-slate-600" };
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const className = PRIORITY_META[priority] || "bg-slate-100 text-slate-600";
  return <Badge className={className}>{priority}</Badge>;
}
