import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardContent } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/EmptyState";
import { RiskHeroCard } from "../features/case/RiskHeroCard";
import { RiskFactors } from "../features/case/RiskFactors";
import { DocumentChecklist } from "../features/case/DocumentChecklist";
import { ActionPlan } from "../features/case/ActionPlan";
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
      <AppLayout title="Insurance Risk Analysis">
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </AppLayout>
    );
  }

  if (error || !caseDetail) {
    return (
      <AppLayout title="Insurance Risk Analysis">
        <ErrorState message={error || "Case not found."} onRetry={load} />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Insurance Risk Analysis"
      subtitle={`${caseDetail.patient.name} · ${caseDetail.procedure} · ${caseDetail.insurance.payer}`}
    >
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">{caseDetail.caseNumber}</span>
            <StatusBadge status={caseDetail.status} />
          </div>
          <button onClick={() => navigate("/cases")} className="focus-ring text-sm font-medium text-brand-600 hover:underline">
            Back to Cases
          </button>
        </div>

        {caseDetail.urgency === "EMERGENCY" && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-bold text-red-700">Emergency Workflow Activated</p>
                <p className="mt-0.5 text-sm text-red-600">
                  Insurance risk predictions must not delay emergency medical care. This analysis supports
                  administrative/payer follow-up only, separate from the clinical workflow.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <RiskHeroCard caseDetail={caseDetail} />

        <RiskFactors factors={caseDetail.riskFactors} />

        <DocumentChecklist documents={caseDetail.documents} onMarkObtained={handleMarkObtained} pendingId={pendingDocId} />

        <ActionPlan actions={caseDetail.actions} onComplete={handleCompleteAction} pendingId={pendingActionId} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WhatIfSimulator caseId={caseDetail.id} documents={caseDetail.documents} currentRisk={caseDetail.riskScore} />
          <CoverageChecker caseId={caseDetail.id} />
        </div>

        <CopilotPanel caseId={caseDetail.id} />
      </div>
    </AppLayout>
  );
}
