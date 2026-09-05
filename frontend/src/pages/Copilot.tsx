import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { RiskBadge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ErrorState, EmptyState } from "../components/ui/EmptyState";
import { CopilotPanel } from "../features/case/CopilotPanel";
import { casesApi, ApiError } from "../services/api";
import type { CaseListItem } from "../types";
import { cn } from "../utils/cn";
import { FolderKanban } from "lucide-react";

export default function Copilot() {
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    casesApi
      .getCases()
      .then((data) => {
        setCases(data);
        if (data.length > 0) setSelectedId((prev) => prev ?? data[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load cases."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <AppLayout title="AI Copilot" subtitle="Select a case to ask your case-aware RCM assistant.">
      {loading && <SkeletonCard />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && cases && cases.length === 0 && (
        <EmptyState icon={FolderKanban} title="No cases yet" description="Create a case to start a conversation with PreClaim Copilot." />
      )}

      {!loading && !error && cases && cases.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white lg:col-span-1">
            <div className="max-h-[560px] space-y-1 overflow-y-auto p-2.5">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "focus-ring flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                    selectedId === c.id ? "bg-brand-50 text-brand-800" : "hover:bg-slate-50"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.patientName}</p>
                    <p className="truncate text-xs text-slate-400">
                      {c.caseNumber} · {c.procedure}
                    </p>
                  </div>
                  <RiskBadge level={c.riskLevel} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedId && (
              <div className="h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-white">
                <CopilotPanel caseId={selectedId} embedded />
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
