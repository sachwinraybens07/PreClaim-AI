import { Response } from "express";
import { z } from "zod";
import * as caseService from "../services/caseService";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

const createCaseSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  patientIdentifier: z.string().optional(),
  dateOfBirth: z.string().optional(),
  payer: z.string().min(1, "Payer is required"),
  planName: z.string().optional(),
  memberId: z.string().optional(),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  diagnosisCode: z.string().optional(),
  procedure: z.string().min(1, "Procedure is required"),
  procedureCode: z.string().optional(),
  provider: z.string().optional(),
  treatmentDate: z.string().optional(),
  urgency: z.enum(["STANDARD", "URGENT", "EMERGENCY"]).default("STANDARD"),
  availableDocumentTypes: z.array(z.string()).optional(),
});

export async function createCase(req: AuthedRequest, res: Response) {
  const parsed = createCaseSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid case information");
  }
  const created = await caseService.createCase(parsed.data);
  res.status(201).json(created);
}

export async function listCases(_req: AuthedRequest, res: Response) {
  const cases = await caseService.listCases();
  res.json(cases);
}

export async function getCase(req: AuthedRequest, res: Response) {
  const c = await caseService.getCaseById(req.params.id);
  res.json(c);
}

export async function analyzeCase(req: AuthedRequest, res: Response) {
  const c = await caseService.analyzeCase(req.params.id);
  res.json(c);
}

export async function getRisk(req: AuthedRequest, res: Response) {
  const c = await caseService.getCaseById(req.params.id);
  res.json({
    riskScore: c.riskScore,
    riskLevel: c.riskLevel,
    confidence: c.confidence,
    predictedOutcome: c.predictedOutcome,
    readiness: c.readiness,
    riskFactors: c.riskFactors,
  });
}

export async function getDocuments(req: AuthedRequest, res: Response) {
  const docs = await caseService.getDocuments(req.params.id);
  res.json(docs);
}

export async function addDocument(req: AuthedRequest, res: Response) {
  const schema = z.object({ name: z.string().min(1), type: z.string().min(1), status: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid document information");
  const doc = await caseService.addDocument(req.params.id, parsed.data);
  res.status(201).json(doc);
}

export async function getActions(req: AuthedRequest, res: Response) {
  const actions = await caseService.getActions(req.params.id);
  res.json(actions);
}

export async function simulate(req: AuthedRequest, res: Response) {
  const schema = z.object({ selectedDocumentTypes: z.array(z.string()).default([]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid simulation request");
  const result = await caseService.simulateCaseRisk(req.params.id, parsed.data.selectedDocumentTypes);
  res.json(result);
}

export async function getCoverage(req: AuthedRequest, res: Response) {
  const result = await caseService.getCoverage(req.params.id);
  res.json(result);
}
