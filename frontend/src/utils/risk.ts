import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { RiskLevel } from "../types";

export const RISK_META: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string; icon: typeof ShieldCheck }
> = {
  LOW: { label: "Low Risk", color: "text-risk-low", bg: "bg-green-50", border: "border-green-200", icon: ShieldCheck },
  MEDIUM: {
    label: "Medium Risk",
    color: "text-risk-medium",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: ShieldQuestion,
  },
  HIGH: {
    label: "High Risk",
    color: "text-risk-high",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: "Critical Risk",
    color: "text-risk-critical",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: ShieldAlert,
  },
};

export function riskBarColor(level: RiskLevel): string {
  switch (level) {
    case "LOW":
      return "bg-risk-low";
    case "MEDIUM":
      return "bg-risk-medium";
    case "HIGH":
      return "bg-risk-high";
    case "CRITICAL":
      return "bg-risk-critical";
  }
}

export const STATUS_META: Record<string, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-slate-100 text-slate-700" },
  ANALYZING: { label: "Analyzing", className: "bg-blue-50 text-blue-700" },
  ACTION_REQUIRED: { label: "Action Required", className: "bg-orange-50 text-orange-700" },
  READY: { label: "Ready", className: "bg-green-50 text-green-700" },
  SUBMITTED: { label: "Submitted", className: "bg-indigo-50 text-indigo-700" },
  COMPLETED: { label: "Completed", className: "bg-slate-100 text-slate-600" },
};

export const PRIORITY_META: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
};
