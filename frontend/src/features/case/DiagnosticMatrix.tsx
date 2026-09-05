import { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { PriorityBadge } from "../../components/ui/Badge";
import { cn } from "../../utils/cn";
import type { RiskFactorItem, DocumentItem, ActionItem } from "../../types";

interface DiagnosticMatrixProps {
  factors: RiskFactorItem[];
  documents: DocumentItem[];
  actions: ActionItem[];
  onMarkObtained: (doc: DocumentItem) => void;
  onCompleteAction: (action: ActionItem) => void;
  pendingDocId: string | null;
  pendingActionId: string | null;
}

type FilterTab = "ALL" | "ACTION_REQUIRED" | "VERIFIED";

export function DiagnosticMatrix({
  factors,
  documents,
  actions,
  onMarkObtained,
  onCompleteAction,
  pendingDocId,
  pendingActionId,
}: DiagnosticMatrixProps) {
  const [tab, setTab] = useState<FilterTab>("ALL");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build unified triage items by mapping factors with documents and actions
  const triageItems = useMemo(() => {
    // Track which documents are matched to factors
    const matchedDocIds = new Set<string>();
    const matchedActionIds = new Set<string>();

    const items = factors.map((factor) => {
      // Find matching document by title or type similarity
      const fTitleLower = factor.title.toLowerCase();
      const matchedDoc = documents.find((doc) => {
        const dNameLower = doc.name.toLowerCase();
        return (
          fTitleLower.includes(dNameLower) ||
          dNameLower.includes(fTitleLower.replace("missing ", "")) ||
          (factor.title.includes("Diagnostic") && doc.type === "DIAGNOSTIC_REPORT") ||
          (factor.title.includes("Necessity") && doc.type === "MEDICAL_NECESSITY_LETTER") ||
          (factor.title.includes("Authorization") && doc.type === "PRIOR_AUTHORIZATION_FORM")
        );
      });
      if (matchedDoc) matchedDocIds.add(matchedDoc.id);

      // Find matching action
      const matchedAction = actions.find((act) => {
        const aTitleLower = act.title.toLowerCase();
        return (
          aTitleLower.includes(factor.title.toLowerCase().replace("missing ", "")) ||
          (matchedDoc && aTitleLower.includes(matchedDoc.name.toLowerCase()))
        );
      });
      if (matchedAction) matchedActionIds.add(matchedAction.id);

      const isDocAvailable = matchedDoc?.status === "AVAILABLE";
      const isActionCompleted = matchedAction?.status === "COMPLETED";
      const isResolved = isDocAvailable || isActionCompleted;
      const isPendingReview = matchedDoc?.status === "PENDING_REVIEW";

      return {
        id: factor.id,
        type: "RISK_FACTOR" as const,
        title: factor.title,
        severity: factor.severity,
        impact: factor.impact,
        reason: factor.evidence || "Clinical guidelines and payer documentation policy require prior evidence on file.",
        missingEvidence: matchedDoc ? matchedDoc.name : factor.description,
        source: matchedDoc?.source || "Treating Physician / Provider",
        instructions: matchedDoc?.instructions || null,
        recommendedAction: matchedAction ? matchedAction.title : factor.action || "Obtain and attach required clinical documentation",
        actionDescription: matchedAction?.description || factor.description,
        isResolved,
        isPendingReview,
        matchedDoc,
        matchedAction,
      };
    });

    // Also include remaining baseline documents (e.g. Insurance Card, Orders) as readiness checkpoints
    const baselineDocs = documents
      .filter((d) => !matchedDocIds.has(d.id))
      .map((doc) => {
        const isResolved = doc.status === "AVAILABLE";
        return {
          id: `doc-${doc.id}`,
          type: "BASELINE_DOCUMENT" as const,
          title: doc.name,
          severity: (doc.priority === "HIGH" ? "HIGH" : "LOW") as "LOW" | "HIGH",
          impact: (doc.priority === "HIGH" ? "HIGH" : "LOW") as "LOW" | "HIGH",
          reason: isResolved ? "Verified on file for this claim submission." : "Standard claim intake requirement.",
          missingEvidence: doc.name,
          source: doc.source || "Patient Intake",
          instructions: doc.instructions || null,
          recommendedAction: `Verify and upload ${doc.name}`,
          actionDescription: doc.instructions || `Submit valid ${doc.name}`,
          isResolved,
          isPendingReview: doc.status === "PENDING_REVIEW",
          matchedDoc: doc,
          matchedAction: null,
        };
      });

    return [...items, ...baselineDocs];
  }, [factors, documents, actions]);

  const filteredItems = useMemo(() => {
    if (tab === "ACTION_REQUIRED") return triageItems.filter((item) => !item.isResolved);
    if (tab === "VERIFIED") return triageItems.filter((item) => item.isResolved);
    return triageItems;
  }, [triageItems, tab]);

  const actionRequiredCount = triageItems.filter((i) => !i.isResolved).length;
  const verifiedCount = triageItems.filter((i) => i.isResolved).length;

  return (
    <section className="card-enterprise overflow-hidden">
      {/* Header & Tabs */}
      <div className="border-b border-slate-100/90 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                <Activity className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                Diagnostic Matrix
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Causal chain: <span className="font-semibold text-slate-700">Risk</span> →{" "}
              <span className="font-semibold text-slate-700">Reason</span> →{" "}
              <span className="font-semibold text-slate-700">Required Evidence</span> →{" "}
              <span className="font-semibold text-slate-700">Corrective Action</span>
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-100/80 p-1">
            <button
              onClick={() => setTab("ALL")}
              className={cn(
                "focus-ring rounded-md px-3 py-1 text-xs font-semibold tracking-tight transition-all",
                tab === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              All ({triageItems.length})
            </button>
            <button
              onClick={() => setTab("ACTION_REQUIRED")}
              className={cn(
                "focus-ring flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold tracking-tight transition-all",
                tab === "ACTION_REQUIRED" ? "bg-white text-orange-950 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Action Required ({actionRequiredCount})
            </button>
            <button
              onClick={() => setTab("VERIFIED")}
              className={cn(
                "focus-ring flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold tracking-tight transition-all",
                tab === "VERIFIED" ? "bg-white text-emerald-950 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Verified ({verifiedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Triage Rows */}
      <div className="divide-y divide-slate-100">
        {filteredItems.map((item, idx) => {
          const isExpanded = expandedIds.has(item.id);
          const isPending =
            (item.matchedDoc && pendingDocId === item.matchedDoc.id) ||
            (item.matchedAction && pendingActionId === item.matchedAction.id);

          return (
            <div
              key={item.id}
              className={cn(
                "group/row p-5 transition-all duration-200 sm:p-6",
                item.isResolved
                  ? "bg-emerald-50/20 hover:bg-emerald-50/30"
                  : "bg-white hover:bg-slate-50/60"
              )}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Item Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {item.isResolved ? (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-transform duration-200 group-hover/row:scale-105">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : item.isPendingReview ? (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 transition-transform duration-200 group-hover/row:scale-105">
                      <Clock className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 transition-transform duration-200 group-hover/row:scale-105">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold tracking-tight text-slate-900">{item.title}</h3>
                      {!item.isResolved && item.impact === "HIGH" && (
                        <PriorityBadge priority="HIGH" />
                      )}
                      {item.isResolved ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-2xs font-bold text-emerald-800 transition-colors">
                          <CheckCircle2 className="h-3 w-3" /> Completed ✓
                        </span>
                      ) : item.isPendingReview ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-2xs font-bold text-amber-800">
                          <Clock className="h-3 w-3" /> Processing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-2xs font-bold text-orange-800">
                          <AlertTriangle className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleExpand(item.id)}
                  className="focus-ring flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <span>{isExpanded ? "Hide Details" : "View Details & Policy"}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* 3-Stage Pipeline: Reason -> Evidence -> Action */}
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 transition-colors group-hover/row:border-slate-300 group-hover/row:bg-white sm:grid-cols-12">
                {/* 1. Reason */}
                <div className="space-y-1 sm:col-span-4 border-slate-200/80 sm:border-r sm:pr-4">
                  <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-500">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-3xs font-black text-slate-700">
                      1
                    </span>
                    Reason
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{item.reason}</p>
                </div>

                {/* 2. Required Evidence */}
                <div className="space-y-1 sm:col-span-4 border-slate-200/80 sm:border-r sm:px-4">
                  <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-500">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-3xs font-black text-slate-700">
                      2
                    </span>
                    Required Evidence
                  </div>
                  <p className="text-xs font-semibold text-slate-900">{item.missingEvidence}</p>
                  <p className="text-2xs text-slate-500">Source: {item.source}</p>
                </div>

                {/* 3. Corrective Action */}
                <div className="flex flex-col justify-between gap-2 sm:col-span-4 sm:pl-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-500">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-3xs font-black text-slate-700">
                        3
                      </span>
                      Corrective Action
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{item.recommendedAction}</p>
                  </div>

                  {item.isResolved ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Verified ✓</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
                      {item.matchedDoc && (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => onMarkObtained(item.matchedDoc!)}
                          isLoading={Boolean(isPending)}
                          className="shadow-2xs transition-all duration-150 active:scale-95"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Evidence Obtained
                        </Button>
                      )}
                      {item.matchedAction && !item.matchedDoc && (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => onCompleteAction(item.matchedAction!)}
                          isLoading={Boolean(isPending)}
                          className="shadow-2xs transition-all duration-150 active:scale-95"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Expandable Clinical Evidence Drawer */}
              {isExpanded && (
                <div className="animate-fade-in mt-3 rounded-lg border border-slate-200 bg-white p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>Evidence Details & Provider Instructions</span>
                  </div>
                  {item.instructions && (
                    <p className="text-slate-600 pl-6 leading-relaxed">
                      <strong className="text-slate-700">Submission Guidance: </strong>
                      {item.instructions}
                    </p>
                  )}
                  {item.actionDescription && item.actionDescription !== item.instructions && (
                    <p className="text-slate-600 pl-6 leading-relaxed">
                      <strong className="text-slate-700">Operational Scope: </strong>
                      {item.actionDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}