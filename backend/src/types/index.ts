export type Urgency = "STANDARD" | "URGENT" | "EMERGENCY";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type CaseStatus =
  | "NEW"
  | "ANALYZING"
  | "ACTION_REQUIRED"
  | "READY"
  | "SUBMITTED"
  | "COMPLETED";

export interface PayerProcedureProfile {
  baseRisk: number;
  authRequired: boolean;
  authPenalty: number;
}

export interface DocumentRequirement {
  type: string;
  name: string;
  required: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  weight: number;
  source: string;
  instructions: string;
  why: string;
}

export interface RiskFactorResult {
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  impact: "LOW" | "MEDIUM" | "HIGH";
  evidence: string;
  action: string;
}

export interface RiskEngineResult {
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  predictedOutcome: string;
  riskFactors: RiskFactorResult[];
  readiness: number;
}
