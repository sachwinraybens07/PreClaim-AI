export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Urgency = "STANDARD" | "URGENT" | "EMERGENCY";
export type CaseStatus = "NEW" | "ANALYZING" | "ACTION_REQUIRED" | "READY" | "SUBMITTED" | "COMPLETED";
export type DocumentStatus = "MISSING" | "AVAILABLE" | "PENDING_REVIEW";
export type ActionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface Patient {
  id: string;
  name: string;
  patientIdentifier: string;
  dateOfBirth: string;
}

export interface Insurance {
  id: string;
  payer: string;
  planName: string;
  memberId: string;
}

export interface DocumentItem {
  id: string;
  caseId: string;
  name: string;
  type: string;
  status: DocumentStatus;
  required: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source: string | null;
  instructions: string | null;
}

export interface RiskFactorItem {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  impact: "LOW" | "MEDIUM" | "HIGH";
  evidence: string | null;
  action: string | null;
}

export interface ActionItem {
  id: string;
  caseId: string;
  title: string;
  description: string;
  priority: string;
  status: ActionStatus;
  estimatedImpact: string;
}

export interface CaseDetail {
  id: string;
  caseNumber: string;
  patient: Patient;
  insurance: Insurance;
  diagnosis: string;
  diagnosisCode: string;
  procedure: string;
  procedureCode: string;
  provider: string;
  urgency: Urgency;
  status: CaseStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  predictedOutcome: string | null;
  readiness: number;
  treatmentDate: string | null;
  createdAt: string;
  documents: DocumentItem[];
  riskFactors: RiskFactorItem[];
  actions: ActionItem[];
}

export interface CaseListItem {
  id: string;
  caseNumber: string;
  patientName: string;
  procedure: string;
  payer: string;
  initialRisk: number;
  currentRisk: number;
  riskLevel: RiskLevel;
  status: CaseStatus;
  urgency: Urgency;
  createdAt: string;
}

export interface DashboardData {
  kpis: {
    activeCases: number;
    highRisk: number;
    missingDocuments: number;
    authorizationRequired: number;
    potentialDenialsPrevented: number;
  };
  priorityCases: {
    id: string;
    caseNumber: string;
    patientName: string;
    procedure: string;
    payer: string;
    riskScore: number;
    riskLevel: RiskLevel;
    status: CaseStatus;
    nextAction: string;
  }[];
  riskDistribution: Record<RiskLevel, number>;
  preventionImpact: {
    casesAnalyzed: number;
    potentialDenialsDetected: number;
    casesCorrected: number;
    estimatedRiskReduction: number;
  };
}

export interface SimulationResult {
  currentRisk: number;
  simulatedRisk: number;
  riskReduction: number;
  steps: { label: string; risk: number }[];
  predictedOutcome: string;
}

export interface CoverageResult {
  procedure: string;
  payer: string;
  coverageStatus: string;
  authorizationStatus: string;
  medicalNecessityStatus: string;
  policyConcern: string;
  disclaimer: string;
}

export interface CopilotMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface DenialAnalytics {
  topDenialReasons: { reason: string; count: number; percentage: number }[];
  records: {
    id: string;
    payer: string;
    procedure: string;
    diagnosis: string;
    reason: string;
    outcome: string;
    date: string;
  }[];
  filters: { payers: string[]; procedures: string[]; reasons: string[] };
  insights: { mostCommonDenialFactor: string; highestRiskWorkflow: string; totalRecords: number };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
