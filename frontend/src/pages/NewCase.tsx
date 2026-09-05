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

import { PayerBadge, UrgencyBadge } from "../components/ui/Badge";
import { ProgressBar } from "../components/ui/ProgressBar";

const STEPS = [
  { label: "Patient", sub: "Demographics" },
  { label: "Insurance", sub: "Payer Policy" },
  { label: "Treatment", sub: "Procedure & Codes" },
  { label: "Urgency", sub: "Scheduling Tier" },
  { label: "Documents", sub: "Clinical Manifest" },
];

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

  // Calculate intake completeness
  const completeness =
    (form.patientName ? 20 : 0) +
    (form.payer ? 20 : 0) +
    (form.procedure && form.diagnosis ? 20 : 0) +
    (form.urgency ? 20 : 0) +
    (form.availableDocumentTypes.length > 0 ? 20 : 0);

  return (
    <AppLayout title="New Case Intake" subtitle="Submit patient clinical and insurance telemetry for real-time denial prevention analysis.">
      {/* Top Stepper */}
      <div className="mb-6 overflow-x-auto pb-2">
        <ol className="flex min-w-[620px] items-center gap-3">
          {STEPS.map((s, i) => (
            <li
              key={s.label}
              className={cn(
                "flex flex-1 items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors",
                i === step
                  ? "border-brand-500/80 bg-brand-50/50 shadow-xs"
                  : i < step
                  ? "border-slate-200 bg-white"
                  : "border-slate-200/60 bg-slate-50/50 opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                  i < step
                    ? "bg-brand-600 text-white"
                    : i === step
                    ? "border-2 border-brand-600 text-brand-600"
                    : "border border-slate-300 text-slate-400"
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className="min-w-0">
                <p className={cn("truncate text-xs font-bold", i === step ? "text-slate-900" : "text-slate-600")}>
                  {s.label}
                </p>
                <p className="truncate text-2xs text-slate-400">{s.sub}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Intake Step Form */}
        <div className="lg:col-span-7 xl:col-span-8">
          <Card className="shadow-card">
            <div className="border-b border-slate-100/90 px-6 py-4">
              <span className="text-eyebrow text-brand-600">Step {step + 1} of {STEPS.length}</span>
              <h2 className="text-base font-bold text-slate-900">{STEPS[step].label} Verification</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {step === 0 && "Capture patient clinical identifiers and demographics for hospital record linkage."}
                {step === 1 && "Select the primary insurance payer to evaluate coverage guidelines and LCD policies."}
                {step === 2 && "Enter scheduled clinical procedure details with ICD-10 and CPT code pairings."}
                {step === 3 && "Specify the operational urgency tier to calibrate triage and scheduling rules."}
                {step === 4 && "Select clinical documents currently archived in the patient electronic medical record."}
              </p>
            </div>

            <CardContent className="space-y-5 p-6">
              {form.urgency === "EMERGENCY" && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Emergency Protocol Engaged</p>
                    <p className="mt-0.5 text-xs text-red-600 leading-relaxed">
                      Pre-claim risk predictions must never delay emergency care. Clinical interventions proceed immediately;
                      all AI risk telemetry supports post-care administrative claims assembly.
                    </p>
                  </div>
                </div>
              )}

              {step === 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Patient Full Name">
                      <input
                        className={inputClass}
                        value={form.patientName}
                        onChange={(e) => update({ patientName: e.target.value })}
                        placeholder="e.g. Jane Doe"
                        autoFocus
                      />
                    </Field>
                  </div>
                  <Field label="Medical Record Number (MRN / Patient ID)">
                    <input
                      className={inputClass}
                      value={form.patientIdentifier}
                      onChange={(e) => update({ patientIdentifier: e.target.value })}
                      placeholder="PT-10492"
                    />
                  </Field>
                  <Field label="Date of Birth">
                    <input
                      type="date"
                      className={inputClass}
                      value={form.dateOfBirth}
                      onChange={(e) => update({ dateOfBirth: e.target.value })}
                    />
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Primary Insurance Payer">
                      <select
                        className={inputClass}
                        value={form.payer}
                        onChange={(e) => update({ payer: e.target.value })}
                        autoFocus
                      >
                        <option value="">Select insurance payer...</option>
                        {PAYERS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label="Plan Name">
                    <input
                      className={inputClass}
                      value={form.planName}
                      onChange={(e) => update({ planName: e.target.value })}
                      placeholder="Choice Plus POS / Commercial"
                    />
                  </Field>
                  <Field label="Member / Policy ID">
                    <input
                      className={inputClass}
                      value={form.memberId}
                      onChange={(e) => update({ memberId: e.target.value })}
                      placeholder="MBR-48210-A"
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Planned Clinical Procedure">
                      <select
                        className={inputClass}
                        value={form.procedure}
                        onChange={(e) => update({ procedure: e.target.value })}
                        autoFocus
                      >
                        <option value="">Select procedure...</option>
                        {PROCEDURES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label="CPT / HCPCS Procedure Code">
                    <input
                      className={inputClass}
                      value={form.procedureCode}
                      onChange={(e) => update({ procedureCode: e.target.value })}
                      placeholder="e.g. 73721"
                    />
                  </Field>
                  <Field label="Primary Clinical Diagnosis">
                    <input
                      className={inputClass}
                      value={form.diagnosis}
                      onChange={(e) => update({ diagnosis: e.target.value })}
                      placeholder="e.g. Chronic Knee Pain"
                    />
                  </Field>
                  <Field label="ICD-10-CM Diagnosis Code">
                    <input
                      className={inputClass}
                      value={form.diagnosisCode}
                      onChange={(e) => update({ diagnosisCode: e.target.value })}
                      placeholder="e.g. M25.561"
                    />
                  </Field>
                  <Field label="Ordering / Attending Provider">
                    <input
                      className={inputClass}
                      value={form.provider}
                      onChange={(e) => update({ provider: e.target.value })}
                      placeholder="Dr. Karen Osei, MD"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Scheduled Treatment Date">
                      <input
                        type="date"
                        className={inputClass}
                        value={form.treatmentDate}
                        onChange={(e) => update({ treatmentDate: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  {(
                    [
                      {
                        level: "STANDARD" as const,
                        label: "Standard Routine",
                        desc: "Routine scheduling window (>48 hours). Full automated pre-claim policy evaluation and remediation plan.",
                      },
                      {
                        level: "URGENT" as const,
                        label: "Urgent Expedited",
                        desc: "Expedited scheduling window (<24 hours). Parallel pre-authorization tracking and expedited clinical order verification.",
                      },
                      {
                        level: "EMERGENCY" as const,
                        label: "Emergency Care",
                        desc: "Immediate point-of-care delivery. Treatment is never delayed; risk models execute for post-encounter documentation.",
                      },
                    ] as const
                  ).map(({ level, label, desc }) => (
                    <button
                      type="button"
                      key={level}
                      onClick={() => update({ urgency: level })}
                      className={cn(
                        "focus-ring flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all",
                        form.urgency === level
                          ? "border-brand-500 bg-brand-50/60 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                      )}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{label}</p>
                          <UrgencyBadge urgency={level} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{desc}</p>
                      </div>
                      {form.urgency === level && (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {step === 4 && (
                <div>
                  <p className="mb-3 text-xs text-slate-500">
                    Check all clinical documents currently on file. PreClaim AI cross-references these against payer LCD
                    mandates and flags missing artifacts before submission.
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {DOCUMENT_OPTIONS.map((doc) => {
                      const checked = form.availableDocumentTypes.includes(doc.type);
                      return (
                        <label
                          key={doc.type}
                          className={cn(
                            "focus-ring flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs font-semibold transition-all",
                            checked
                              ? "border-brand-500 bg-brand-50/60 text-brand-900 shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/80"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() => toggleDocument(doc.type)}
                          />
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                              checked ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white"
                            )}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </span>
                          {doc.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* Navigation controls */}
              <div className="flex items-center justify-between border-t border-slate-100/90 pt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0 || creating || analyzing}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>

                {step < STEPS.length - 1 && (
                  <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                )}

                {step === STEPS.length - 1 && !caseId && (
                  <Button size="sm" onClick={handleCreateCase} isLoading={creating}>
                    Register Case <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Analysis Launch Section */}
              {caseId && !analyzing && (
                <div className="animate-fade-in rounded-xl border border-brand-200 bg-brand-50/50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700">
                        Case Registered Successfully
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-600">
                        Ready to evaluate configured payer rules and generate pre-submission risk assessment.
                      </p>
                    </div>
                  </div>
                  <Button size="lg" className="mt-4 w-full font-bold shadow-sm" onClick={handleAnalyze}>
                    <Sparkles className="h-4 w-4" />
                    Run Pre-Submission Risk Assessment
                  </Button>
                </div>
              )}

              {/* Analysis In Progress Telemetry */}
              {analyzing && (
                <div className="animate-fade-in space-y-3.5 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <span className="text-2xs font-bold uppercase tracking-wider text-brand-600">
                      Pre-Submission Assessment In Progress
                    </span>
                    <span className="text-2xs font-semibold text-slate-500">
                      Stage {Math.min(stageIndex + 1, ANALYSIS_STAGES.length)} of {ANALYSIS_STAGES.length}
                    </span>
                  </div>
                  {ANALYSIS_STAGES.map((stage, i) => (
                    <div key={stage} className="flex items-center gap-3 text-xs">
                      {i < stageIndex ? (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white text-2xs font-bold">
                          ✓
                        </div>
                      ) : i === stageIndex ? (
                        <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      ) : (
                        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-200 bg-white" />
                      )}
                      <span className={i <= stageIndex ? "font-semibold text-slate-900" : "text-slate-400"}>
                        {stage}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Telemetry Intake Preview */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20 space-y-5">
            <Card className="shadow-card">
              <div className="border-b border-slate-100/90 px-5 py-4">
                <span className="text-eyebrow text-slate-400">Live Intake Telemetry</span>
                <h3 className="text-sm font-bold text-slate-900">Pre-Claim Case Summary</h3>
              </div>

              <CardContent className="space-y-4 p-5 text-xs">
                {/* Completeness Bar */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-2xs font-semibold">
                    <span className="text-slate-500">Intake Readiness</span>
                    <span className="text-brand-600">{completeness}% Complete</span>
                  </div>
                  <ProgressBar value={completeness} barClassName="bg-brand-600" />
                </div>

                {/* Patient Summary */}
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3">
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Patient</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {form.patientName || <span className="font-normal italic text-slate-400">Not specified yet</span>}
                  </p>
                  <p className="text-2xs text-slate-500">
                    MRN: {form.patientIdentifier || "—"} · DOB: {form.dateOfBirth || "—"}
                  </p>
                </div>

                {/* Insurance Summary */}
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3">
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Insurance & Policy</p>
                  <div className="mt-1 flex items-center gap-2">
                    {form.payer ? <PayerBadge payer={form.payer} /> : <span className="italic text-slate-400">Payer pending</span>}
                  </div>
                  <p className="mt-1 text-2xs text-slate-500">
                    Plan: {form.planName || "—"} · Member ID: {form.memberId || "—"}
                  </p>
                </div>

                {/* Procedure & Coding */}
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3">
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Procedure & Clinical Code</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {form.procedure || <span className="font-normal italic text-slate-400">Procedure pending</span>}
                  </p>
                  <p className="text-2xs text-slate-500">
                    CPT: {form.procedureCode || "—"} · ICD-10: {form.diagnosisCode || "—"}
                  </p>
                </div>

                {/* Urgency & Manifest */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/60 p-3">
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Urgency Tier</p>
                    <div className="mt-1">
                      <UrgencyBadge urgency={form.urgency} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Documents Attached</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {form.availableDocumentTypes.length} / {DOCUMENT_OPTIONS.length} on file
                    </p>
                  </div>
                </div>

                {/* Clinical Disclaimer */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-2xs leading-relaxed text-slate-400">
                    PreClaim AI validates submitted data against Medicare LCDs and commercial payer clinical coverage criteria.
                    Data stored in synthetic HIPAA-ready sandbox.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
