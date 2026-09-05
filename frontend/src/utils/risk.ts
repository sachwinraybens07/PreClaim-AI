import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { RiskLevel } from "../types";

export const RISK_META: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string; dot: string; fill: string; icon: typeof ShieldCheck }
> = {
  LOW: {
    label: "Low Risk",
    color: "text-risk-low",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    fill: "bg-emerald-500",
    icon: ShieldCheck,
  },
  MEDIUM: {
    label: "Medium Risk",
    color: "text-risk-medium",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    fill: "bg-amber-500",
    icon: ShieldQuestion,
  },
  HIGH: {
    label: "High Risk",
    color: "text-risk-high",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
    fill: "bg-orange-500",
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: "Critical Risk",
    color: "text-risk-critical",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-600",
    fill: "bg-red-600",
    icon: ShieldAlert,
  },
};

export function riskBarColor(level: RiskLevel): string {
  return RISK_META[level].fill;
}

export const STATUS_META: Record<string, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-slate-100 text-slate-700" },
  ANALYZING: { label: "Analyzing", className: "bg-blue-50 text-blue-700" },
  ACTION_REQUIRED: { label: "Action Required", className: "bg-orange-50 text-orange-700" },
  READY: { label: "Ready", className: "bg-emerald-50 text-emerald-700" },
  SUBMITTED: { label: "Submitted", className: "bg-indigo-50 text-indigo-700" },
  COMPLETED: { label: "Completed", className: "bg-slate-100 text-slate-600" },
};

export const PRIORITY_META: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
};

/** Short, severity-anchored interpretation of what the predicted risk level implies operationally. */
export const RISK_INTERPRETATION: Record<RiskLevel, string> = {
  LOW: "Unlikely to require additional intervention before submission.",
  MEDIUM: "May require additional documentation before submission.",
  HIGH: "Likely to require intervention before submission.",
  CRITICAL: "Very likely to be denied without immediate corrective action.",
};

/** Ordered risk levels, low to critical — used to render segmented risk scales. */
export const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

/** Risk score thresholds matching the backend's risk engine bands (0-39 / 40-59 / 60-84 / 85-100). */
export const RISK_BANDS: { level: RiskLevel; min: number; max: number }[] = [
  { level: "LOW", min: 0, max: 39 },
  { level: "MEDIUM", min: 40, max: 59 },
  { level: "HIGH", min: 60, max: 84 },
  { level: "CRITICAL", min: 85, max: 100 },
];
