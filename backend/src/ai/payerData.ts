import { PayerProcedureProfile } from "../types";

/**
 * Deterministic knowledge base standing in for payer policy data.
 * Keys are `${payer}|${procedure}`. Falls back to genericProfile when absent.
 */
const profiles: Record<string, PayerProcedureProfile> = {
  "UnitedHealthcare|MRI Knee": { baseRisk: 27, authRequired: true, authPenalty: 22 },
  "UnitedHealthcare|MRI Brain": { baseRisk: 30, authRequired: true, authPenalty: 20 },
  "UnitedHealthcare|Physical Therapy": { baseRisk: 14, authRequired: false, authPenalty: 8 },
  "Aetna|CT Scan Abdomen": { baseRisk: 24, authRequired: true, authPenalty: 18 },
  "Aetna|Colonoscopy": { baseRisk: 12, authRequired: false, authPenalty: 6 },
  "Cigna|Spinal Fusion Surgery": { baseRisk: 38, authRequired: true, authPenalty: 24 },
  "Cigna|Sleep Study": { baseRisk: 20, authRequired: true, authPenalty: 14 },
  "Blue Cross Blue Shield|Cardiac Catheterization": { baseRisk: 33, authRequired: true, authPenalty: 21 },
  "Blue Cross Blue Shield|Physical Therapy": { baseRisk: 13, authRequired: false, authPenalty: 7 },
  "Medicare|Total Knee Replacement": { baseRisk: 29, authRequired: true, authPenalty: 19 },
  "Medicare|Colonoscopy": { baseRisk: 10, authRequired: false, authPenalty: 5 },
  "Humana|MRI Lumbar Spine": { baseRisk: 26, authRequired: true, authPenalty: 20 },
  "Humana|Emergency Trauma Evaluation": { baseRisk: 15, authRequired: false, authPenalty: 5 },
};

const genericProfile: PayerProcedureProfile = { baseRisk: 20, authRequired: false, authPenalty: 10 };

export function getPayerProcedureProfile(payer: string, procedure: string): PayerProcedureProfile {
  return profiles[`${payer}|${procedure}`] ?? genericProfile;
}

export const KNOWN_PAYERS = [
  "UnitedHealthcare",
  "Aetna",
  "Cigna",
  "Blue Cross Blue Shield",
  "Medicare",
  "Humana",
];

export const KNOWN_PROCEDURES = [
  "MRI Knee",
  "MRI Brain",
  "MRI Lumbar Spine",
  "CT Scan Abdomen",
  "Physical Therapy",
  "Colonoscopy",
  "Spinal Fusion Surgery",
  "Sleep Study",
  "Cardiac Catheterization",
  "Total Knee Replacement",
  "Emergency Trauma Evaluation",
];
