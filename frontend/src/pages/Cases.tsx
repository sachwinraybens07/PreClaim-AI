import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ArrowUpDown } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { RiskBadge, StatusBadge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ErrorState, EmptyState } from "../components/ui/EmptyState";
import { casesApi, ApiError } from "../services/api";
import type { CaseListItem, RiskLevel, CaseStatus } from "../types";

type SortKey = "createdAt" | "currentRisk" | "patientName";

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "ALL">("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "ALL">("ALL");
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

  const filtered = useMemo(() => {
    if (!cases) return [];
    return cases
      .filter((c) => (statusFilter === "ALL" ? true : c.status === statusFilter))
      .filter((c) => (riskFilter === "ALL" ? true : c.riskLevel === riskFilter))
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
  }, [cases, search, statusFilter, riskFilter, sortKey]);

  return (
    <AppLayout title="Cases" subtitle="Search, filter, and review every case in the pipeline.">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, case, procedure..."
              className="focus-ring w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3.5 text-sm placeholder:text-slate-400"
            />
          </div>
          <Button onClick={() => navigate("/cases/new")}>
            <Plus className="h-4 w-4" /> New Case
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CaseStatus | "ALL")}
            className="focus-ring rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            {["NEW", "ACTION_REQUIRED", "READY", "SUBMITTED", "COMPLETED"].map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as RiskLevel | "ALL")}
            className="focus-ring rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All risk levels</option>
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortKey((k) => (k === "currentRisk" ? "createdAt" : "currentRisk"))}
            className="focus-ring flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort: {sortKey === "currentRisk" ? "Risk (high to low)" : "Newest"}
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState title="No cases match your filters" description="Try adjusting your search or filters, or create a new case." />
        )}

        {!loading && !error && filtered.length > 0 && (
          <Card className="animate-fade-in">
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Case ID</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Procedure</th>
                    <th className="px-5 py-3">Payer</th>
                    <th className="px-5 py-3">Initial Risk</th>
                    <th className="px-5 py-3">Current Risk</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                      onClick={() => navigate(`/cases/${c.id}`)}
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800">{c.caseNumber}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-700">{c.patientName}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{c.procedure}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{c.payer}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{c.initialRisk}%</td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{c.currentRisk}%</span>
                          <RiskBadge level={c.riskLevel} size="sm" />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
