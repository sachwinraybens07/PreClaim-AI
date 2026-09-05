import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Calendar,
  User,
  Activity,
} from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { StatusBadge, UrgencyBadge, PayerBadge } from "../components/ui/Badge";
import { SkeletonCaseAnalysis } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/EmptyState";
import { Drawer } from "../components/ui/Drawer";
import { RiskHeroCard } from "../features/case/RiskHeroCard";
import { DiagnosticMatrix } from "../features/case/DiagnosticMatrix";
import { WhatIfSimulator } from "../features/case/WhatIfSimulator";
import { CoverageChecker } from "../features/case/CoverageChecker";
import { CopilotPanel } from "../features/case/CopilotPanel";
import { casesApi, ApiError } from "../services/api";
import type { CaseDetail, DocumentItem, ActionItem } from "../types";
import { useToast } from "../hooks/useToast";

export default function CaseAnalysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDocId, setPendingDocId] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    casesApi
      .getCase(id)
      .then(setCaseDetail)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Unable to load this case. Please verify the case information and try again.")
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkObtained = async (doc: DocumentItem) => {
    if (!caseDetail) return;
    setPendingDocId(doc.id);
    const beforeReadiness = caseDetail.readiness;
    try {
      await casesApi.updateDocument(doc.id, "AVAILABLE");
      const updated = await casesApi.getCase(caseDetail.id);
      setCaseDetail(updated);
      showToast(`${doc.name} marked as obtained. Readiness ${beforeReadiness}% → ${updated.readiness}%.`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Unable to update this document.", "error");
    } finally {
      setPendingDocId(null);
    }
  };

  const handleCompleteAction = async (action: ActionItem) => {
    if (!caseDetail) return;
    setPendingActionId(action.id);
    const beforeReadiness = caseDetail.readiness;
    try {
      await casesApi.updateAction(action.id, "COMPLETED");
      const updated = await casesApi.getCase(caseDetail.id);
      setCaseDetail(updated);
      showToast(`${action.title} completed. Readiness ${beforeReadiness}% → ${updated.readiness}%.`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Unable to complete this action.", "error");
    } finally {
      setPendingActionId(null);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Case Analysis">
        <SkeletonCaseAnalysis />
      </AppLayout>
    );
  }

  if (error || !caseDetail) {
    return (
      <AppLayout title="Case Analysis">
        <ErrorState message={error || "Case not found."} onRetry={load} />
      </AppLayout>
    );
  }

  const patientAge = caseDetail.patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(caseDetail.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <AppLayout
      title={caseDetail.patient.name}
      subtitle={`Diagnostic Triage & Denial Prevention · ${caseDetail.caseNumber}`}
      primaryAction={{
        label: "Case Copilot",
        icon: <Sparkles className="h-4 w-4 text-brand-500" />,
        onClick: () => setCopilotOpen(true),
      }}
    >
      <div className="animate-fade-in space-y-6">
        {/* Navigation & Patient Telemetry Bar */}
        <div className="card-enterprise p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Breadcrumbs + Core Patient Facts */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/cases")}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
                <span>Cases</span>
              </button>

              <span className="text-slate-300">/</span>

              <span className="font-mono text-xs font-semibold text-slate-500">
                {caseDetail.caseNumber}
              </span>

              <div className="hidden h-4 w-px bg-slate-200 sm:block" />

              {/* Patient metadata pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-medium">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {patientAge ? `${patientAge} y/o · ` : ""}MRN: {caseDetail.patient.patientIdentifier || caseDetail.patient.id.slice(0, 8).toUpperCase()}
                </span>

                <span className="text-slate-300">·</span>

                <span className="inline-flex items-center gap-1 font-medium">
                  <Activity className="h-3.5 w-3.5 text-slate-400" />
                  {caseDetail.procedure}
                </span>

                <span className="text-slate-300">·</span>

                <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(caseDetail.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Right: Badges & Status */}
            <div className="flex flex-wrap items-center gap-2">
              <PayerBadge payer={caseDetail.insurance.payer} />
              <UrgencyBadge urgency={caseDetail.urgency} />
              <StatusBadge status={caseDetail.status} />
            </div>
          </div>
        </div>

        {/* Emergency clinical workflow disclaimer banner */}
        {caseDetail.urgency === "EMERGENCY" && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 shadow-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-800">Emergency Workflow Activated</p>
              <p className="mt-0.5 text-xs text-red-700 leading-relaxed">
                Pre-submission risk assessments must not delay emergency medical care or triage. This analysis supports
                administrative reimbursement verification and downstream payer follow-up only.
              </p>
            </div>
          </div>
        )}

        {/* Two-Column Command Center: 7 cols Left (Diagnostic Matrix) vs 5 cols Right (Simulator & Coverage) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Risk Telemetry + 4-Stage Diagnostic Pipeline (~60-65%) */}
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            <RiskHeroCard caseDetail={caseDetail} />

            {/* Unified 4-Stage Pipeline: Predict → Explain → Detect → Fix */}
            <DiagnosticMatrix
              factors={caseDetail.riskFactors}
              documents={caseDetail.documents}
              actions={caseDetail.actions}
              onMarkObtained={handleMarkObtained}
              onCompleteAction={handleCompleteAction}
              pendingDocId={pendingDocId}
              pendingActionId={pendingActionId}
            />
          </div>

          {/* RIGHT COLUMN: What-If Simulator + Payer Policy Evaluation (~35-40%) */}
          <div className="space-y-6 lg:col-span-5 xl:col-span-4">
            <div className="sticky top-6 space-y-6">
              <WhatIfSimulator
                caseId={caseDetail.id}
                documents={caseDetail.documents}
                currentRisk={caseDetail.riskScore}
              />
              <CoverageChecker caseId={caseDetail.id} />
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        title="Pre-Submission Copilot"
        subtitle={`Pre-submission guidance for ${caseDetail.patient.name} (${caseDetail.caseNumber})`}
        icon={<Sparkles className="h-4 w-4 text-brand-500" />}
      >
        <CopilotPanel caseId={caseDetail.id} embedded />
      </Drawer>
    </AppLayout>
  );
}
