import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ArrowUpDown,
  FolderKanban,
  X,
  ChevronRight,
  Filter,
} from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { RiskBadge, StatusBadge, PayerBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
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
  const [sortKey, setSortKey] = useState<SortKey>("currentRisk");

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
      title="Case Directory"
      subtitle="Search, triage, and evaluate pre-submission risk across active claims."
      primaryAction={{
        label: "New Case",
        icon: <Plus className="h-4 w-4" />,
        onClick: () => navigate("/cases/new"),
      }}
    >
      <div className="space-y-4 animate-fade-in">
        {/* Unified Enterprise Filter Toolbar */}
        <div className="card-enterprise p-4 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient name, case ID, CPT procedure, payer..."
                className="focus-ring w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-9 text-xs placeholder:text-slate-400 focus:bg-white transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Risk Segmented Selector */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
              {RISK_OPTIONS.map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={cn(
                    "focus-ring flex items-center gap-1.5 rounded-md px-2.5 py-1 text-2xs font-semibold transition-all",
                    riskFilter === level
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {level !== "ALL" && (
                    <span className={cn("h-1.5 w-1.5 rounded-full", RISK_META[level].dot)} />
                  )}
                  {level === "ALL" ? "All Risk" : level.charAt(0) + level.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CaseStatus | "ALL")}
              className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 font-medium hover:border-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTION_REQUIRED">Action Required</option>
              <option value="NEW">New</option>
              <option value="READY">Ready</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {/* Payer Dropdown */}
            <select
              value={payerFilter}
              onChange={(e) => setPayerFilter(e.target.value)}
              className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 font-medium hover:border-slate-300"
            >
              <option value="ALL">All Payers</option>
              {payerOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Procedure Dropdown */}
            <select
              value={procedureFilter}
              onChange={(e) => setProcedureFilter(e.target.value)}
              className="focus-ring hidden xl:block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 font-medium hover:border-slate-300"
            >
              <option value="ALL">All Procedures</option>
              {procedureOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortKey((k) => (k === "currentRisk" ? "createdAt" : "currentRisk"))}
              className="focus-ring flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 transition shrink-0"
            >
              <ArrowUpDown className="h-3 w-3 text-slate-400" />
              <span>{sortKey === "currentRisk" ? "Risk: High → Low" : "Newest First"}</span>
            </button>
          </div>

          {/* Active Filter Summary Bar */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Showing <strong className="text-slate-800 font-semibold">{filtered.length}</strong> of{" "}
                  {cases?.length ?? 0} cases
                </span>
              </div>
              <button
                onClick={clearFilters}
                className="focus-ring text-2xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error State */}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {/* Empty State: Filter mismatch */}
        {!loading && !error && filtered.length === 0 && cases && cases.length > 0 && (
          <EmptyState
            title="No cases match your filter criteria"
            description="Adjust or reset your search keywords, risk levels, or payer filters to inspect active cases."
            actionLabel="Reset Filters"
            onAction={clearFilters}
          />
        )}

        {/* Empty State: Zero cases in system */}
        {!loading && !error && cases && cases.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="No cases in pipeline"
            description="Create your first patient case to begin automated denial prediction."
            actionLabel="Create First Case"
            onAction={() => navigate("/cases/new")}
          />
        )}

        {/* Results: Responsive View (Table for Desktop, Touch Cards for Mobile) */}
        {!loading && !error && filtered.length > 0 && (
          <div className="card-enterprise overflow-hidden">
            {/* Desktop Table View (hidden on small mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Patient / Case ID</th>
                    <th className="px-5 py-3">Procedure</th>
                    <th className="px-5 py-3">Payer</th>
                    <th className="px-5 py-3">Assessed Risk</th>
                    <th className="px-5 py-3">Pipeline Status</th>
                    <th className="hidden px-5 py-3 md:table-cell">Date</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c, idx) => {
                    const riskChanged = c.currentRisk !== c.initialRisk;
                    return (
                      <tr
                        key={c.id}
                        className="cursor-pointer transition-colors duration-150 hover:bg-slate-50/80 group"
                        style={{
                          animationDelay: `${idx * 25}ms`,
                        }}
                        onClick={() => navigate(`/cases/${c.id}`)}
                      >
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <p className="font-bold text-slate-900 group-hover:text-brand-600 transition">
                            {c.patientName}
                          </p>
                          <p className="font-mono text-2xs text-slate-400">{c.caseNumber}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-700">
                          {c.procedure}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <PayerBadge payer={c.payer} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <RiskBadge level={c.riskLevel} score={c.currentRisk} size="sm" />
                          {riskChanged && (
                            <p className="mt-0.5 text-3xs text-slate-400">was {c.initialRisk}%</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="hidden whitespace-nowrap px-5 py-3.5 text-slate-500 md:table-cell font-mono text-2xs">
                          {new Date(c.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/cases/${c.id}`);
                            }}
                          >
                            Review Case
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Card View (shown below sm: 640px) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="p-4 active:bg-slate-50 transition cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{c.patientName}</p>
                      <p className="font-mono text-2xs text-slate-400">{c.caseNumber}</p>
                    </div>
                    <RiskBadge level={c.riskLevel} score={c.currentRisk} size="sm" />
                  </div>

                  <p className="text-xs font-medium text-slate-700">{c.procedure}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <PayerBadge payer={c.payer} />
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={c.status} />
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
