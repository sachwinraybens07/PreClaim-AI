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

export function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "sm" | "md" }) {
  const meta = RISK_META[level];
  const Icon = meta.icon;
  return (
    <Badge className={cn(meta.bg, meta.color, "border", meta.border, size === "sm" && "px-1.5 py-0.5 text-[11px]")}>
      <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {meta.label}
    </Badge>
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
