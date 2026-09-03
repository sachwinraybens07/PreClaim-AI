import { RiskEngineResult, RiskFactorResult, RiskLevel } from "../types";
import { getPayerProcedureProfile } from "./payerData";
import prisma from "../database/prisma";

export interface DocumentSnapshot {
  type: string;
  name: string;
  status: string;
  required: boolean;
  priority: string;
  weight: number;
}

export interface RiskEngineInput {
  payer: string;
  procedure: string;
  diagnosis: string;
  urgency: string;
  documents: DocumentSnapshot[];
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function runRiskAnalysis(input: RiskEngineInput): Promise<RiskEngineResult> {
  const profile = getPayerProcedureProfile(input.payer, input.procedure);
  const missingRequired = input.documents.filter((d) => d.required && d.status !== "AVAILABLE");
  const missingWeightSum = missingRequired.reduce((sum, d) => sum + d.weight, 0);

  const rawScore = profile.baseRisk + missingWeightSum;
  const riskScore = Math.round(clamp(rawScore, 3, 97));
  const riskLevel = riskLevelFromScore(riskScore);

  const historicalRecords = await prisma.denialRecord.findMany({
    where: { payer: input.payer, procedure: input.procedure },
  });
  const deniedCount = historicalRecords.filter((r) => r.outcome === "DENIED").length;
  const historicalMatchCount = historicalRecords.length;

  const riskFactors: RiskFactorResult[] = [];

  const missingDiagnostic = missingRequired.find((d) => d.type === "DIAGNOSTIC_REPORT");
  if (missingDiagnostic) {
    riskFactors.push({
      title: "Missing Diagnostic Report",
      description: "Diagnostic report is not currently available to support medical necessity.",
      severity: "HIGH",
      impact: "HIGH",
      evidence: `${input.procedure} claims without an on-file diagnostic report are frequently flagged by payers for insufficient clinical support.`,
      action: "Obtain Diagnostic Report",
    });
  }

  const missingNecessity = missingRequired.find((d) => d.type === "MEDICAL_NECESSITY_LETTER");
  if (missingNecessity) {
    riskFactors.push({
      title: "Medical Necessity Documentation",
      description: "Required clinical justification has not been identified.",
      severity: "HIGH",
      impact: "HIGH",
      evidence: "Payers require a documented clinical rationale, including conservative treatments attempted, before approving this procedure.",
      action: "Add Medical Necessity Documentation",
    });
  }

  const missingAuth = missingRequired.find((d) => d.type === "PRIOR_AUTHORIZATION_FORM");
  if (profile.authRequired && missingAuth) {
    riskFactors.push({
      title: "Prior Authorization",
      description: `Procedure may require prior authorization for ${input.payer}.`,
      severity: "HIGH",
      impact: "HIGH",
      evidence: `${input.payer} policy requires prior authorization for ${input.procedure} in most cases.`,
      action: "Initiate Prior Authorization",
    });
  }

  if (historicalMatchCount > 0 && deniedCount / historicalMatchCount >= 0.4) {
    riskFactors.push({
      title: "Historical Pattern",
      description: "Similar incomplete submissions in the historical dataset have shown elevated denial risk.",
      severity: "MEDIUM",
      impact: "MEDIUM",
      evidence: `${deniedCount} of ${historicalMatchCount} similar historical claims for ${input.payer} / ${input.procedure} were denied, most often for missing documentation or authorization.`,
      action: "Review similar historical cases before submission",
    });
  }

  let predictedOutcome: string;
  if (profile.authRequired && missingAuth) {
    predictedOutcome = "Prior Authorization Likely Required";
  } else if (missingDiagnostic || missingNecessity) {
    predictedOutcome = "Additional Documentation Likely Required";
  } else if (riskScore >= 60) {
    predictedOutcome = "Elevated Denial Risk — Review Recommended";
  } else if (riskScore >= 40) {
    predictedOutcome = "Moderate Risk — Verify Requirements";
  } else {
    predictedOutcome = "Likely to Process Cleanly";
  }

  const riskFactorCount = riskFactors.length;
  const confidence = Math.round(
    clamp(59 + riskFactorCount * 4 + Math.min(12, historicalMatchCount * 4), 50, 96)
  );

  const requiredDocs = input.documents.filter((d) => d.required);
  const completedRequired = requiredDocs.filter((d) => d.status === "AVAILABLE");
  const readiness = requiredDocs.length
    ? Math.round((completedRequired.length / requiredDocs.length) * 100)
    : 100;

  return {
    riskScore,
    riskLevel,
    confidence,
    predictedOutcome,
    riskFactors,
    readiness,
  };
}

export interface SimulationInput extends RiskEngineInput {
  documents: DocumentSnapshot[];
}

export async function simulateRisk(input: SimulationInput) {
  const result = await runRiskAnalysis(input);
  return result;
}
