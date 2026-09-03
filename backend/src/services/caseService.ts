import prisma from "../database/prisma";
import { ApiError } from "../middleware/errorHandler";
import { buildDocumentChecklist } from "../ai/requirementsEngine";
import { runRiskAnalysis, DocumentSnapshot } from "../ai/riskEngine";
import { getPayerProcedureProfile } from "../ai/payerData";

interface CreateCaseInput {
  patientName: string;
  patientIdentifier?: string;
  dateOfBirth?: string;
  payer: string;
  planName?: string;
  memberId?: string;
  diagnosis: string;
  diagnosisCode?: string;
  procedure: string;
  procedureCode?: string;
  provider?: string;
  treatmentDate?: string;
  urgency: string;
  availableDocumentTypes?: string[];
}

async function nextCaseNumber(): Promise<string> {
  const count = await prisma.case.count();
  return `CASE-${1041 + count}`;
}

function severityFromPriority(priority: string): string {
  if (priority === "CRITICAL" || priority === "HIGH") return priority;
  if (priority === "MEDIUM") return "MEDIUM";
  return "LOW";
}

export async function createCase(input: CreateCaseInput) {
  if (!input.patientName || !input.payer || !input.procedure || !input.diagnosis) {
    throw new ApiError(400, "Invalid case information");
  }

  const patient = await prisma.patient.create({
    data: {
      name: input.patientName,
      patientIdentifier: input.patientIdentifier || `PT-${Date.now()}`,
      dateOfBirth: input.dateOfBirth || "",
    },
  });

  const insurance = await prisma.insurance.create({
    data: {
      patientId: patient.id,
      payer: input.payer,
      planName: input.planName || "",
      memberId: input.memberId || "",
    },
  });

  const caseNumber = await nextCaseNumber();

  const newCase = await prisma.case.create({
    data: {
      caseNumber,
      patientId: patient.id,
      insuranceId: insurance.id,
      diagnosis: input.diagnosis,
      diagnosisCode: input.diagnosisCode || "",
      procedure: input.procedure,
      procedureCode: input.procedureCode || "",
      provider: input.provider || "",
      urgency: input.urgency || "STANDARD",
      treatmentDate: input.treatmentDate || null,
      status: "NEW",
    },
  });

  const checklist = buildDocumentChecklist(input.payer, input.procedure, input.urgency || "STANDARD");
  const available = new Set(input.availableDocumentTypes || []);

  await prisma.document.createMany({
    data: checklist.map((item) => ({
      caseId: newCase.id,
      name: item.name,
      type: item.type,
      required: item.required,
      priority: item.priority,
      source: item.source,
      instructions: item.instructions,
      status: available.has(item.type) ? "AVAILABLE" : "MISSING",
    })),
  });

  return getCaseById(newCase.id);
}

export async function listCases() {
  const cases = await prisma.case.findMany({
    include: { patient: true, insurance: true },
    orderBy: { createdAt: "desc" },
  });
  return cases.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    patientName: c.patient.name,
    procedure: c.procedure,
    payer: c.insurance.payer,
    initialRisk: c.riskScore,
    currentRisk: c.riskScore,
    riskLevel: c.riskLevel,
    status: c.status,
    urgency: c.urgency,
    createdAt: c.createdAt,
  }));
}

export async function getCaseById(id: string) {
  const c = await prisma.case.findUnique({
    where: { id },
    include: {
      patient: true,
      insurance: true,
      documents: true,
      riskFactors: true,
      actions: true,
    },
  });
  if (!c) throw new ApiError(404, "Case not found");
  return c;
}

async function buildDocumentSnapshots(caseId: string): Promise<DocumentSnapshot[]> {
  const docs = await prisma.document.findMany({ where: { caseId } });
  const checklistLookup = new Map<string, number>();
  const c = await prisma.case.findUnique({ where: { id: caseId }, include: { insurance: true } });
  if (c) {
    const checklist = buildDocumentChecklist(c.insurance.payer, c.procedure, c.urgency);
    checklist.forEach((item) => checklistLookup.set(item.type, item.weight));
  }
  return docs.map((d) => ({
    type: d.type,
    name: d.name,
    status: d.status,
    required: d.required,
    priority: d.priority,
    weight: checklistLookup.get(d.type) ?? 5,
  }));
}

export async function analyzeCase(caseId: string) {
  const c = await prisma.case.findUnique({ where: { id: caseId }, include: { insurance: true } });
  if (!c) throw new ApiError(404, "Case not found");

  const documents = await buildDocumentSnapshots(caseId);
  const result = await runRiskAnalysis({
    payer: c.insurance.payer,
    procedure: c.procedure,
    diagnosis: c.diagnosis,
    urgency: c.urgency,
    documents,
  });

  const status = result.readiness === 100 ? "READY" : "ACTION_REQUIRED";

  await prisma.case.update({
    where: { id: caseId },
    data: {
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
      predictedOutcome: result.predictedOutcome,
      readiness: result.readiness,
      status,
    },
  });

  await prisma.riskFactor.deleteMany({ where: { caseId } });
  if (result.riskFactors.length) {
    await prisma.riskFactor.createMany({
      data: result.riskFactors.map((rf) => ({
        caseId,
        title: rf.title,
        description: rf.description,
        severity: rf.severity,
        impact: rf.impact,
        evidence: rf.evidence,
        action: rf.action,
      })),
    });
  }

  const existingActions = await prisma.action.findMany({ where: { caseId } });
  const existingByTitle = new Map(existingActions.map((a) => [a.title, a]));
  const desiredTitles = new Set(result.riskFactors.map((rf) => rf.action));

  for (const rf of result.riskFactors) {
    const existing = existingByTitle.get(rf.action);
    if (existing) {
      if (existing.status !== "COMPLETED") {
        await prisma.action.update({
          where: { id: existing.id },
          data: {
            priority: severityFromPriority(rf.severity),
            estimatedImpact: `${rf.impact === "HIGH" ? "High" : rf.impact === "MEDIUM" ? "Medium" : "Low"} expected impact`,
          },
        });
      }
    } else {
      await prisma.action.create({
        data: {
          caseId,
          title: rf.action,
          description: rf.description,
          priority: severityFromPriority(rf.severity),
          status: "PENDING",
          estimatedImpact: `${rf.impact === "HIGH" ? "High" : rf.impact === "MEDIUM" ? "Medium" : "Low"} expected impact`,
        },
      });
    }
  }
  // remove actions that are no longer relevant (and not yet completed)
  for (const existing of existingActions) {
    if (!desiredTitles.has(existing.title) && existing.status !== "COMPLETED") {
      await prisma.action.delete({ where: { id: existing.id } });
    }
  }

  return getCaseById(caseId);
}

export async function getDocuments(caseId: string) {
  return prisma.document.findMany({ where: { caseId }, orderBy: { createdAt: "asc" } });
}

export async function addDocument(caseId: string, data: { name: string; type: string; status?: string }) {
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) throw new ApiError(404, "Case not found");
  return prisma.document.create({
    data: {
      caseId,
      name: data.name,
      type: data.type,
      status: data.status || "AVAILABLE",
      required: true,
      priority: "MEDIUM",
    },
  });
}

export async function updateDocumentStatus(documentId: string, status: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new ApiError(404, "Document not found");
  const updated = await prisma.document.update({ where: { id: documentId }, data: { status } });
  await analyzeCase(doc.caseId);
  return updated;
}

export async function getActions(caseId: string) {
  return prisma.action.findMany({ where: { caseId }, orderBy: { createdAt: "asc" } });
}

const ACTION_TO_DOC_TYPE: Record<string, string> = {
  "Obtain Diagnostic Report": "DIAGNOSTIC_REPORT",
  "Add Medical Necessity Documentation": "MEDICAL_NECESSITY_LETTER",
  "Initiate Prior Authorization": "PRIOR_AUTHORIZATION_FORM",
};

export async function updateActionStatus(actionId: string, status: string) {
  const action = await prisma.action.findUnique({ where: { id: actionId } });
  if (!action) throw new ApiError(404, "Action not found");
  const updated = await prisma.action.update({ where: { id: actionId }, data: { status } });

  if (status === "COMPLETED") {
    const docType = ACTION_TO_DOC_TYPE[action.title];
    if (docType) {
      const doc = await prisma.document.findFirst({ where: { caseId: action.caseId, type: docType } });
      if (doc && doc.status !== "AVAILABLE") {
        await prisma.document.update({ where: { id: doc.id }, data: { status: "AVAILABLE" } });
      }
    }
  }

  await analyzeCase(action.caseId);
  return updated;
}

const SIMULATION_ORDER = ["DIAGNOSTIC_REPORT", "MEDICAL_NECESSITY_LETTER", "PRIOR_AUTHORIZATION_FORM"];

export async function simulateCaseRisk(caseId: string, selectedDocTypes: string[]) {
  const c = await prisma.case.findUnique({ where: { id: caseId }, include: { insurance: true } });
  if (!c) throw new ApiError(404, "Case not found");

  const baseDocuments = await buildDocumentSnapshots(caseId);
  const selectedSet = new Set(selectedDocTypes);

  const applyOverrides = (types: Set<string>): DocumentSnapshot[] =>
    baseDocuments.map((d) => (types.has(d.type) ? { ...d, status: "AVAILABLE" } : d));

  const baseline = await runRiskAnalysis({
    payer: c.insurance.payer,
    procedure: c.procedure,
    diagnosis: c.diagnosis,
    urgency: c.urgency,
    documents: baseDocuments,
  });

  const orderedSelected = SIMULATION_ORDER.filter((t) => selectedSet.has(t)).concat(
    [...selectedSet].filter((t) => !SIMULATION_ORDER.includes(t))
  );

  const steps: { label: string; risk: number }[] = [{ label: "Current", risk: baseline.riskScore }];
  const applied = new Set<string>();
  const labelFor: Record<string, string> = {
    DIAGNOSTIC_REPORT: "Diagnostic report obtained",
    MEDICAL_NECESSITY_LETTER: "Medical necessity letter added",
    PRIOR_AUTHORIZATION_FORM: "Prior authorization initiated",
  };

  for (const type of orderedSelected) {
    applied.add(type);
    const result = await runRiskAnalysis({
      payer: c.insurance.payer,
      procedure: c.procedure,
      diagnosis: c.diagnosis,
      urgency: c.urgency,
      documents: applyOverrides(applied),
    });
    steps.push({ label: labelFor[type] || type, risk: result.riskScore });
  }

  const finalResult = await runRiskAnalysis({
    payer: c.insurance.payer,
    procedure: c.procedure,
    diagnosis: c.diagnosis,
    urgency: c.urgency,
    documents: applyOverrides(selectedSet),
  });

  const riskReduction = Math.max(0, baseline.riskScore - finalResult.riskScore);

  await prisma.simulation.create({
    data: {
      caseId,
      selectedActions: JSON.stringify([...selectedSet]),
      predictedRisk: finalResult.riskScore,
      riskReduction,
    },
  });

  return {
    currentRisk: baseline.riskScore,
    simulatedRisk: finalResult.riskScore,
    riskReduction,
    steps,
    predictedOutcome: finalResult.predictedOutcome,
  };
}

export async function getCoverage(caseId: string) {
  const c = await prisma.case.findUnique({ where: { id: caseId }, include: { insurance: true, documents: true } });
  if (!c) throw new ApiError(404, "Case not found");
  const profile = getPayerProcedureProfile(c.insurance.payer, c.procedure);
  const authDoc = c.documents.find((d) => d.type === "PRIOR_AUTHORIZATION_FORM");
  const necessityDoc = c.documents.find((d) => d.type === "MEDICAL_NECESSITY_LETTER");

  const coverageStatus = c.riskScore >= 70 ? "Requires Verification" : c.riskScore >= 40 ? "Potentially Covered" : "Appears Covered";
  const authorizationStatus = profile.authRequired
    ? authDoc?.status === "AVAILABLE"
      ? "Initiated"
      : "Likely Required"
    : "Not Typically Required";
  const necessityStatus = !necessityDoc || necessityDoc.status === "AVAILABLE" ? "Documented" : "Verification Required";
  const policyConcern = c.riskScore >= 60 ? "Verify payer requirements before submission" : "No major concerns identified";

  return {
    procedure: c.procedure,
    payer: c.insurance.payer,
    coverageStatus,
    authorizationStatus,
    medicalNecessityStatus: necessityStatus,
    policyConcern,
    disclaimer: "This is decision support and does not replace payer verification.",
  };
}
