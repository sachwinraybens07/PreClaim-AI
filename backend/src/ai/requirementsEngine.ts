import { DocumentRequirement } from "../types";
import { getPayerProcedureProfile } from "./payerData";

const IMAGING_OR_SURGICAL = [
  "MRI Knee",
  "MRI Brain",
  "MRI Lumbar Spine",
  "CT Scan Abdomen",
  "Spinal Fusion Surgery",
  "Total Knee Replacement",
  "Cardiac Catheterization",
  "Sleep Study",
];

/**
 * Determines the document checklist for a case based on payer, procedure,
 * diagnosis and authorization requirements. Runs server-side so the
 * checklist is never hard-coded in the frontend.
 */
export function buildDocumentChecklist(payer: string, procedure: string, urgency: string): DocumentRequirement[] {
  const profile = getPayerProcedureProfile(payer, procedure);
  const isComplex = IMAGING_OR_SURGICAL.includes(procedure);
  const isEmergency = urgency === "EMERGENCY";

  const checklist: DocumentRequirement[] = [
    {
      type: "INSURANCE_CARD",
      name: "Insurance Card",
      required: true,
      priority: "LOW",
      weight: 4,
      source: "Patient / Front Desk",
      instructions: "Scan or photograph the front and back of the patient's insurance card at check-in.",
      why: "Confirms active coverage and correct payer/member ID before submission.",
    },
    {
      type: "PHYSICIAN_ORDER",
      name: "Physician Order",
      required: true,
      priority: "MEDIUM",
      weight: 6,
      source: "Ordering Physician",
      instructions: "Request the signed order from the ordering physician's office.",
      why: "Establishes the clinical order authorizing the procedure.",
    },
    {
      type: "PRESCRIPTION",
      name: "Prescription",
      required: true,
      priority: "MEDIUM",
      weight: 5,
      source: "Ordering Physician",
      instructions: "Obtain the prescription associated with the treatment plan.",
      why: "Supports the treatment plan tied to the diagnosis.",
    },
  ];

  if (isComplex) {
    checklist.push({
      type: "DIAGNOSTIC_REPORT",
      name: "Diagnostic Report",
      required: true,
      priority: "HIGH",
      weight: 14,
      source: "Diagnostic Center / Physician",
      instructions: "Request the diagnostic report (e.g. X-ray, prior imaging, or clinical exam findings) from the diagnostic center or referring physician.",
      why: "Supports medical necessity for the requested procedure.",
    });
    checklist.push({
      type: "MEDICAL_NECESSITY_LETTER",
      name: "Medical Necessity Letter",
      required: true,
      priority: "HIGH",
      weight: 19,
      source: "Treating Physician",
      instructions: "Ask the treating physician to draft a medical necessity letter citing conservative treatments tried and clinical justification.",
      why: "Payers require documented clinical justification for high-cost procedures.",
    });
  }

  if (profile.authRequired) {
    checklist.push({
      type: "PRIOR_AUTHORIZATION_FORM",
      name: "Prior Authorization Form",
      required: true,
      priority: "HIGH",
      weight: profile.authPenalty,
      source: "RCM / Payer Portal",
      instructions: isEmergency
        ? "Initiate retrospective authorization once the patient is stabilized. Emergency treatment must not be delayed."
        : "Submit a prior authorization request through the payer portal before the treatment date.",
      why: `${payer} requires prior authorization for ${procedure}.`,
    });
  }

  return checklist;
}
