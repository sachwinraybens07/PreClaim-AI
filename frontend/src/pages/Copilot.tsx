import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardContent } from "../components/ui/Card";
import { RiskBadge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ErrorState, EmptyState } from "../components/ui/EmptyState";
import { CopilotPanel } from "../features/case/CopilotPanel";
import { casesApi, ApiError } from "../services/api";
import type { CaseListItem } from "../types";
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="max-h-[560px] space-y-1.5 overflow-y-auto p-3">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`focus-ring flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm ${
                    selectedId === c.id ? "bg-brand-50 text-brand-800" : "hover:bg-slate-50"
                  }`}
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
            </CardContent>
          </Card>

          <div className="lg:col-span-2">{selectedId && <CopilotPanel caseId={selectedId} />}</div>
        </div>
      )}
    </AppLayout>
  );
}
