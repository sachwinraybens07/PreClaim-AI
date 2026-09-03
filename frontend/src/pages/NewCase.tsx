import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../utils/cn";
import { casesApi } from "../services/api";
import { useToast } from "../hooks/useToast";
import { ApiError } from "../services/api";

const STEPS = ["Patient", "Insurance", "Treatment", "Urgency", "Documents"];

const PAYERS = ["UnitedHealthcare", "Aetna", "Cigna", "Blue Cross Blue Shield", "Medicare", "Humana"];
const PROCEDURES = [
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
];

const DOCUMENT_OPTIONS = [
  { type: "INSURANCE_CARD", name: "Insurance Card" },
  { type: "PHYSICIAN_ORDER", name: "Physician Order" },
  { type: "DIAGNOSTIC_REPORT", name: "Diagnostic Report" },
  { type: "PRESCRIPTION", name: "Prescription" },
  { type: "MEDICAL_NECESSITY_LETTER", name: "Medical Necessity Letter" },
  { type: "PRIOR_AUTHORIZATION_FORM", name: "Prior Authorization Form" },
];

const ANALYSIS_STAGES = [
  "Analyzing insurance information",
  "Checking authorization requirements",
  "Reviewing documentation",
  "Comparing historical patterns",
  "Calculating risk",
  "Generating prevention plan",
];

interface FormState {
  patientName: string;
  patientIdentifier: string;
  dateOfBirth: string;
  payer: string;
  planName: string;
  memberId: string;
  diagnosis: string;
  diagnosisCode: string;
  procedure: string;
  procedureCode: string;
  provider: string;
  treatmentDate: string;
  urgency: "STANDARD" | "URGENT" | "EMERGENCY";
  availableDocumentTypes: string[];
}

const initialState: FormState = {
  patientName: "",
  patientIdentifier: "",
  dateOfBirth: "",
  payer: "",
  planName: "",
  memberId: "",
  diagnosis: "",
  diagnosisCode: "",
  procedure: "",
  procedureCode: "",
  provider: "",
  treatmentDate: "",
  urgency: "STANDARD",
  availableDocumentTypes: [],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "focus-ring w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400";

export default function NewCase() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analyzing) return;
    if (stageIndex >= ANALYSIS_STAGES.length) return;
    const timer = setTimeout(() => setStageIndex((i) => i + 1), 650);
    return () => clearTimeout(timer);
  }, [analyzing, stageIndex]);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const toggleDocument = (type: string) => {
    update({
      availableDocumentTypes: form.availableDocumentTypes.includes(type)
        ? form.availableDocumentTypes.filter((t) => t !== type)
        : [...form.availableDocumentTypes, type],
    });
  };

  const canProceed = () => {
    if (step === 0) return form.patientName.trim().length > 0;
    if (step === 1) return form.payer.trim().length > 0;
    if (step === 2) return form.diagnosis.trim().length > 0 && form.procedure.trim().length > 0;
    return true;
  };

  const handleCreateCase = async () => {
    setError(null);
    setCreating(true);
    try {
      const created = await casesApi.createCase(form);
      setCaseId(created.id);
      showToast(`Case ${created.caseNumber} created for ${form.patientName}.`, "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create the case. Please verify the case information and try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!caseId) return;
    setError(null);
    setAnalyzing(true);
    setStageIndex(0);
    try {
      await Promise.all([
        casesApi.analyzeCase(caseId),
        new Promise((resolve) => setTimeout(resolve, ANALYSIS_STAGES.length * 650 + 300)),
      ]);
      showToast("Risk analysis completed.", "success");
      navigate(`/cases/${caseId}`);
    } catch (err) {
      setAnalyzing(false);
      setError(err instanceof ApiError ? err.message : "Unable to complete risk analysis. Please verify the case information and try again.");
    }
  };

  return (
    <AppLayout title="New Case" subtitle="Create a case and run AI risk analysis before treatment.">
      <div className="mx-auto max-w-3xl">
        <ol className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <li key={label} className="flex shrink-0 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  i < step ? "bg-brand-500 text-white" : i === step ? "border-2 border-brand-500 text-brand-600" : "bg-slate-100 text-slate-400"
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn("text-sm font-medium", i === step ? "text-slate-900" : "text-slate-400")}>{label}</span>
              {i < STEPS.length - 1 && <div className="mx-1 h-px w-6 bg-slate-200" />}
            </li>
          ))}
        </ol>

        <Card>
          <CardContent className="space-y-5">
            {form.urgency === "EMERGENCY" && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-bold text-red-700">Emergency Workflow Activated</p>
                  <p className="mt-0.5 text-sm text-red-600">
                    Insurance risk predictions must not delay emergency medical care. Clinical treatment proceeds
                    immediately; risk analysis supports administrative follow-up only.
                  </p>
                </div>
              </div>
            )}

            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Patient Name">
                  <input className={inputClass} value={form.patientName} onChange={(e) => update({ patientName: e.target.value })} placeholder="Jane Smith" />
                </Field>
                <Field label="Patient ID">
                  <input className={inputClass} value={form.patientIdentifier} onChange={(e) => update({ patientIdentifier: e.target.value })} placeholder="PT-10234" />
                </Field>
                <Field label="Date of Birth">
                  <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => update({ dateOfBirth: e.target.value })} />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Payer">
                  <select className={inputClass} value={form.payer} onChange={(e) => update({ payer: e.target.value })}>
                    <option value="">Select payer</option>
                    {PAYERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Plan Name">
                  <input className={inputClass} value={form.planName} onChange={(e) => update({ planName: e.target.value })} placeholder="Choice Plus" />
                </Field>
                <Field label="Member ID">
                  <input className={inputClass} value={form.memberId} onChange={(e) => update({ memberId: e.target.value })} placeholder="MBR-48210" />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Diagnosis">
                  <input className={inputClass} value={form.diagnosis} onChange={(e) => update({ diagnosis: e.target.value })} placeholder="Chronic knee pain" />
                </Field>
                <Field label="Diagnosis Code">
                  <input className={inputClass} value={form.diagnosisCode} onChange={(e) => update({ diagnosisCode: e.target.value })} placeholder="M25.561" />
                </Field>
                <Field label="Planned Procedure">
                  <select className={inputClass} value={form.procedure} onChange={(e) => update({ procedure: e.target.value })}>
                    <option value="">Select procedure</option>
                    {PROCEDURES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Procedure Code">
                  <input className={inputClass} value={form.procedureCode} onChange={(e) => update({ procedureCode: e.target.value })} placeholder="73721" />
                </Field>
                <Field label="Provider">
                  <input className={inputClass} value={form.provider} onChange={(e) => update({ provider: e.target.value })} placeholder="Dr. Karen Osei" />
                </Field>
                <Field label="Treatment Date">
                  <input type="date" className={inputClass} value={form.treatmentDate} onChange={(e) => update({ treatmentDate: e.target.value })} />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {(["STANDARD", "URGENT", "EMERGENCY"] as const).map((level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => update({ urgency: level })}
                    className={cn(
                      "focus-ring flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors",
                      form.urgency === level ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{level.charAt(0) + level.slice(1).toLowerCase()}</p>
                      <p className="text-xs text-slate-500">
                        {level === "STANDARD" && "Routine scheduling — full risk analysis and prevention workflow."}
                        {level === "URGENT" && "Expedited scheduling — risk analysis runs in parallel with scheduling."}
                        {level === "EMERGENCY" && "Immediate treatment — insurance analysis never delays care."}
                      </p>
                    </div>
                    {form.urgency === level && <Check className="h-5 w-5 shrink-0 text-brand-500" />}
                  </button>
                ))}
              </div>
            )}

            {step === 4 && (
              <div>
                <p className="mb-3 text-sm text-slate-500">
                  Select any documents already on file. PreClaim AI will determine which are required for this
                  payer and procedure, and build a prevention plan for anything missing.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {DOCUMENT_OPTIONS.map((doc) => {
                    const checked = form.availableDocumentTypes.includes(doc.type);
                    return (
                      <label
                        key={doc.type}
                        className={cn(
                          "focus-ring flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm font-medium transition-colors",
                          checked ? "border-brand-500 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleDocument(doc.type)} />
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                            checked ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300"
                          )}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                        {doc.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {error && <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>}

            <div className="flex items-center justify-between border-t border-slate-100 pt-5">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || creating || analyzing}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>

              {step < STEPS.length - 1 && (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              )}

              {step === STEPS.length - 1 && !caseId && (
                <Button onClick={handleCreateCase} isLoading={creating}>
                  Create Case <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {caseId && !analyzing && (
              <div className="animate-fade-in border-t border-slate-100 pt-5">
                <Button size="lg" className="w-full" onClick={handleAnalyze}>
                  <Sparkles className="h-5 w-5" />
                  ANALYZE INSURANCE RISK
                </Button>
              </div>
            )}

            {analyzing && (
              <div className="animate-fade-in space-y-3 border-t border-slate-100 pt-5">
                {ANALYSIS_STAGES.map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3 text-sm">
                    {i < stageIndex ? (
                      <Check className="h-4 w-4 shrink-0 text-green-600" />
                    ) : i === stageIndex ? (
                      <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    ) : (
                      <div className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-200" />
                    )}
                    <span className={i <= stageIndex ? "font-medium text-slate-800" : "text-slate-400"}>{stage}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
