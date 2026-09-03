interface CopilotContext {
  caseNumber: string;
  patientName: string;
  payer: string;
  procedure: string;
  diagnosis: string;
  riskScore: number;
  riskLevel: string;
  confidence: number;
  predictedOutcome: string;
  missingDocuments: string[];
  riskFactorTitles: string[];
  recommendedActions: string[];
  urgency: string;
}

const LLM_API_KEY = process.env.LLM_API_KEY;

/**
 * AI abstraction. When an LLM API key is configured this can be swapped
 * to call an external provider. Without one, PreClaim AI falls back to a
 * deterministic, case-aware response generator so the product remains
 * fully functional offline.
 */
export async function generateCopilotResponse(userMessage: string, ctx: CopilotContext): Promise<string> {
  if (LLM_API_KEY) {
    try {
      return await callExternalLLM(userMessage, ctx);
    } catch {
      // fall through to deterministic engine if the external call fails
    }
  }
  return deterministicCopilotResponse(userMessage, ctx);
}

async function callExternalLLM(_userMessage: string, _ctx: CopilotContext): Promise<string> {
  throw new Error("No LLM provider configured");
}

function deterministicCopilotResponse(userMessage: string, ctx: CopilotContext): string {
  const msg = userMessage.toLowerCase();
  const missing = ctx.missingDocuments.join(", ") || "no outstanding documents";

  if (msg.includes("why") && msg.includes("high risk") || (msg.includes("why") && msg.includes("risk"))) {
    return `This case has an estimated ${ctx.riskScore}% denial risk (${ctx.riskLevel}). The main contributors are ${ctx.riskFactorTitles.join(", ").toLowerCase()}. Predicted outcome: ${ctx.predictedOutcome}. Completing the outstanding actions could materially reduce the predicted risk.`;
  }

  if (msg.includes("missing") && msg.includes("document")) {
    return ctx.missingDocuments.length
      ? `The following documents are still missing for ${ctx.patientName}'s case: ${missing}. Each is required to support medical necessity and/or authorization for ${ctx.procedure} with ${ctx.payer}.`
      : `All required documents are currently on file for this case.`;
  }

  if (msg.includes("what should i do") || msg.includes("next")) {
    return ctx.recommendedActions.length
      ? `Recommended next steps: ${ctx.recommendedActions.join("; ")}. Prioritize the highest-impact items first to reduce the predicted risk fastest.`
      : `No further corrective actions are outstanding. The case appears ready for submission, pending standard payer verification.`;
  }

  if (msg.includes("prior authorization") || msg.includes("authorization")) {
    return `${ctx.payer} may require prior authorization for ${ctx.procedure}. This is a decision-support prediction based on payer patterns — verify current requirements directly with the payer before submission.`;
  }

  if (msg.includes("reduce") && msg.includes("risk")) {
    return `Completing the outstanding items — ${missing || "none currently outstanding"} — is estimated to reduce this case's risk from ${ctx.riskScore}% toward the low-risk range. Use the What-If Simulator to see the estimated impact of each action before committing.`;
  }

  if (msg.includes("summarize") || msg.includes("summary")) {
    return `Case ${ctx.caseNumber}: ${ctx.patientName}, ${ctx.procedure} (${ctx.diagnosis}) with ${ctx.payer}. Current estimated denial risk is ${ctx.riskScore}% (${ctx.riskLevel}), confidence ${ctx.confidence}%. Predicted outcome: ${ctx.predictedOutcome}. Outstanding: ${missing}.`;
  }

  return `This case has an estimated ${ctx.riskScore}% denial risk (${ctx.riskLevel}) for ${ctx.patientName}'s ${ctx.procedure} with ${ctx.payer}. Predicted outcome: ${ctx.predictedOutcome}. Ask me why it's high risk, what documents are missing, or what to do next — I'm case-aware and can walk you through the prevention plan.`;
}
