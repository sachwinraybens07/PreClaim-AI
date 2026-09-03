import prisma from "../database/prisma";
import { ApiError } from "../middleware/errorHandler";
import { generateCopilotResponse } from "../ai/aiService";

export async function askCopilot(caseId: string, userId: string | undefined, message: string) {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: { patient: true, insurance: true, documents: true, riskFactors: true, actions: true },
  });
  if (!c) throw new ApiError(404, "Case not found");
  if (!message || !message.trim()) throw new ApiError(400, "Message cannot be empty");

  await prisma.copilotMessage.create({
    data: { caseId, userId, role: "USER", content: message },
  });

  const missingDocuments = c.documents.filter((d) => d.required && d.status !== "AVAILABLE").map((d) => d.name);
  const recommendedActions = c.actions.filter((a) => a.status !== "COMPLETED").map((a) => a.title);

  const response = await generateCopilotResponse(message, {
    caseNumber: c.caseNumber,
    patientName: c.patient.name,
    payer: c.insurance.payer,
    procedure: c.procedure,
    diagnosis: c.diagnosis,
    riskScore: c.riskScore,
    riskLevel: c.riskLevel,
    confidence: c.confidence,
    predictedOutcome: c.predictedOutcome || "Pending analysis",
    missingDocuments,
    riskFactorTitles: c.riskFactors.map((rf) => rf.title),
    recommendedActions,
    urgency: c.urgency,
  });

  const saved = await prisma.copilotMessage.create({
    data: { caseId, userId, role: "ASSISTANT", content: response },
  });

  return saved;
}

export async function getCopilotHistory(caseId: string) {
  return prisma.copilotMessage.findMany({ where: { caseId }, orderBy: { createdAt: "asc" } });
}
