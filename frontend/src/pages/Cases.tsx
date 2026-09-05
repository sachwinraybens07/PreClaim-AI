import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ArrowUpDown, FolderKanban } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { RiskBadge, StatusBadge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ErrorState, EmptyState } from "../components/ui/EmptyState";
import { RISK_META } from "../utils/risk";
import { cn } from "../utils/cn";
import { casesApi, ApiError } from "../services/api";
import type { CaseListItem, RiskLevel, CaseStatus } from "../types";

type SortKey = "createdAt" | "currentRisk" | "patientName";

const RISK_OPTIONS: (RiskLevel | "ALL")[] = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "ALL">("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "ALL">("ALL");
  const [payerFilter, setPayerFilter] = useState<string>("ALL");
  const [procedureFilter, setProcedureFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");

  const load = () => {
    setLoading(true);
    setError(null);
    casesApi
      .getCases()
      .then(setCases)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load cases. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const payerOptions = useMemo(
    () => (cases ? Array.from(new Set(cases.map((c) => c.payer))).sort() : []),
    [cases]
  );
  const procedureOptions = useMemo(
    () => (cases ? Array.from(new Set(cases.map((c) => c.procedure))).sort() : []),
    [cases]
  );

  const filtered = useMemo(() => {
    if (!cases) return [];
    return cases
      .filter((c) => (statusFilter === "ALL" ? true : c.status === statusFilter))
      .filter((c) => (riskFilter === "ALL" ? true : c.riskLevel === riskFilter))
      .filter((c) => (payerFilter === "ALL" ? true : c.payer === payerFilter))
      .filter((c) => (procedureFilter === "ALL" ? true : c.procedure === procedureFilter))
      .filter((c) => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
          c.caseNumber.toLowerCase().includes(q) ||
          c.patientName.toLowerCase().includes(q) ||
          c.procedure.toLowerCase().includes(q) ||
          c.payer.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortKey === "currentRisk") return b.currentRisk - a.currentRisk;
        if (sortKey === "patientName") return a.patientName.localeCompare(b.patientName);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [cases, search, statusFilter, riskFilter, payerFilter, procedureFilter, sortKey]);

  const hasActiveFilters =
    statusFilter !== "ALL" || riskFilter !== "ALL" || payerFilter !== "ALL" || procedureFilter !== "ALL" || search.trim() !== "";

  const clearFilters = () => {
    setStatusFilter("ALL");
    setRiskFilter("ALL");
    setPayerFilter("ALL");
    setProcedureFilter("ALL");
    setSearch("");
  };

  return (
    <AppLayout
      title="Cases"
      subtitle="Search, filter, and review every case in the pipeline."
      primaryAction={{ label: "New Case", icon: <Plus className="h-4 w-4" />, onClick: () => navigate("/cases/new") }}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, case, procedure..."
                className="focus-ring w-full rounded-md border border-slate-300 py-2 pl-9 pr-3.5 text-sm placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-md bg-slate-100 p-1">
              {RISK_OPTIONS.map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={cn(
                    "focus-ring flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    riskFilter === level ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {level !== "ALL" && <span className={cn("h-1.5 w-1.5 rounded-full", RISK_META[level].dot)} />}
                  {level === "ALL" ? "All Risk" : level.charAt(0) + level.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStatusFilter((s) => (s === "ACTION_REQUIRED" ? "ALL" : "ACTION_REQUIRED"))}
              className={cn(
                "focus-ring rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                statusFilter === "ACTION_REQUIRED"
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              )}
            >
              Needs Attention
            </button>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CaseStatus | "ALL")}
              className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              {["NEW", "ACTION_REQUIRED", "READY", "SUBMITTED", "COMPLETED"].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={payerFilter}
              onChange={(e) => setPayerFilter(e.target.value)}
              className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">All payers</option>
              {payerOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={procedureFilter}
              onChange={(e) => setProcedureFilter(e.target.value)}
              className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">All procedures</option>
              {procedureOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortKey((k) => (k === "currentRisk" ? "createdAt" : "currentRisk"))}
              className="focus-ring flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 lg:ml-auto"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortKey === "currentRisk" ? "Risk: high to low" : "Newest first"}
            </button>
          </div>
          {hasActiveFilters && (
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5">
              <p className="text-xs font-medium text-slate-400">
                Showing {filtered.length} of {cases?.length ?? 0} cases
              </p>
              <button onClick={clearFilters} className="focus-ring text-xs font-semibold text-brand-600 hover:underline">
                Clear filters
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && filtered.length === 0 && cases && cases.length > 0 && (
          <EmptyState
            title="No cases match your filters"
            description="Try adjusting your search or filters."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        )}
        {!loading && !error && cases && cases.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="No cases yet"
            description="Create your first case to begin analyzing denial risk."
            actionLabel="Create Case"
            onAction={() => navigate("/cases/new")}
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="animate-fade-in overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-2xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Case</th>
                    <th className="px-5 py-3">Procedure</th>
                    <th className="hidden px-5 py-3 lg:table-cell">Payer</th>
                    <th className="px-5 py-3">Risk</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="hidden px-5 py-3 md:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const riskChanged = c.currentRisk !== c.initialRisk;
                    return (
                      <tr
                        key={c.id}
                        className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50"
                        onClick={() => navigate(`/cases/${c.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-800">{c.patientName}</p>
                          <p className="text-xs text-slate-400">{c.caseNumber}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{c.procedure}</td>
                        <td className="hidden px-5 py-3.5 text-slate-600 lg:table-cell">{c.payer}</td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <RiskBadge level={c.riskLevel} score={c.currentRisk} size="sm" />
                          {riskChanged && <p className="mt-0.5 text-2xs text-slate-400">was {c.initialRisk}%</p>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="hidden whitespace-nowrap px-5 py-3.5 text-slate-500 md:table-cell">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
