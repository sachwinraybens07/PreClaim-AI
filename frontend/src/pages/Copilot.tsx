import { useEffect, useState, useMemo } from "react";
import { Search, FolderKanban, Sparkles } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { RiskBadge, PayerBadge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ErrorState, EmptyState } from "../components/ui/EmptyState";
import { CopilotPanel } from "../features/case/CopilotPanel";
import { casesApi, ApiError } from "../services/api";
import type { CaseListItem } from "../types";
import { cn } from "../utils/cn";

export default function Copilot() {
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    const q = search.toLowerCase().trim();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.patientName.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.procedure.toLowerCase().includes(q) ||
        c.payer.toLowerCase().includes(q)
    );
  }, [cases, search]);

  const selectedCase = useMemo(
    () => cases?.find((c) => c.id === selectedId) || null,
    [cases, selectedId]
  );

  return (
    <AppLayout
      title="Pre-Submission Copilot"
      subtitle="Pre-submission case analysis, risk driver explanations, and corrective action guidance."
    >
      {loading && <SkeletonCard className="h-96" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && cases && cases.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No cases in pipeline"
          description="Create a case in your directory to start a conversation with PreClaim Copilot."
        />
      )}

      {!loading && !error && cases && cases.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-fade-in">
          {/* Left: Case Selector Sidebar (4 cols) */}
          <div className="card-enterprise overflow-hidden lg:col-span-4 flex flex-col h-[640px]">
            <div className="p-3.5 border-b border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                  Active Claim Queue
                </span>
                <span className="text-3xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {cases.length} Cases
                </span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter cases..."
                  className="focus-ring w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs placeholder:text-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 p-1.5 space-y-1">
              {filteredCases.map((c) => {
                const isSelected = selectedId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "focus-ring flex w-full flex-col gap-1.5 rounded-xl p-3 text-left transition-all",
                      isSelected
                        ? "bg-brand-50/90 border border-brand-200 shadow-2xs"
                        : "hover:bg-slate-50 hover:translate-x-0.5 border border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("font-bold text-xs truncate", isSelected ? "text-brand-900" : "text-slate-900")}>
                        {c.patientName}
                      </p>
                      <RiskBadge level={c.riskLevel} score={c.currentRisk} size="sm" />
                    </div>

                    <p className="text-3xs font-medium text-slate-500 truncate">
                      {c.caseNumber} · {c.procedure}
                    </p>

                    <div className="pt-0.5">
                      <PayerBadge payer={c.payer} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Copilot Conversation Console (8 cols) */}
          <div className="card-enterprise overflow-hidden lg:col-span-8 flex flex-col h-[640px]">
            {/* Telemetry Header */}
            {selectedCase && (
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {selectedCase.patientName}
                      </h3>
                      <span className="text-3xs font-mono text-slate-400">
                        {selectedCase.caseNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-2xs text-slate-500 mt-0.5">
                      <span className="truncate">{selectedCase.procedure}</span>
                      <span className="text-slate-300">·</span>
                      <PayerBadge payer={selectedCase.payer} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-2xs font-medium text-slate-500">Current Risk:</span>
                  <RiskBadge level={selectedCase.riskLevel} score={selectedCase.currentRisk} size="sm" />
                </div>
              </div>
            )}

            {/* Copilot Chat Body */}
            {selectedId && (
              <div className="flex-1 overflow-hidden">
                <CopilotPanel caseId={selectedId} embedded />
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
