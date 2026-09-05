import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FileWarning, ClipboardCheck, ShieldCheck, ArrowRight, Plus, FolderKanban } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { SectionHeader } from "../components/ui/SectionHeader";
import { MetricCard } from "../components/ui/MetricCard";
import { RiskDistributionBar } from "../components/ui/RiskScale";
import { Button } from "../components/ui/Button";
import { RiskBadge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ErrorState, EmptyState } from "../components/ui/EmptyState";
import { dashboardApi } from "../services/api";
import type { DashboardData } from "../types";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    dashboardApi
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message || "Unable to load the dashboard. Please verify your connection and try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppLayout
      title={`${greeting}, ${firstName}`}
      subtitle="Monitor and reduce claim risk before submission."
      primaryAction={{ label: "New Case", icon: <Plus className="h-4 w-4" />, onClick: () => navigate("/cases/new") }}
    >
      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="animate-fade-in space-y-8">
          {/* Primary overview: how much risk exists across the portfolio right now */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 sm:p-7">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,240px)_1fr]">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400">Needs Attention</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-figure text-5xl font-extrabold leading-none tracking-tight text-slate-900">
                    {data.kpis.highRisk}
                  </span>
                  <span className="text-sm font-medium text-slate-400">/ {data.kpis.activeCases} active</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  High-risk cases likely to need intervention before submission.
                </p>
              </div>
              <div>
                <p className="mb-3 text-2xs font-semibold uppercase tracking-wide text-slate-400">Portfolio Risk Distribution</p>
                <RiskDistributionBar distribution={data.riskDistribution} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-100 pt-6 sm:grid-cols-3">
              <MetricCard
                variant="plain"
                icon={<FileWarning className="h-4.5 w-4.5" />}
                tone="amber"
                label="Documentation Issues"
                value={data.kpis.missingDocuments}
              />
              <MetricCard
                variant="plain"
                icon={<ClipboardCheck className="h-4.5 w-4.5" />}
                tone="orange"
                label="Authorization Required"
                value={data.kpis.authorizationRequired}
              />
              <MetricCard
                variant="plain"
                icon={<ShieldCheck className="h-4.5 w-4.5" />}
                tone="emerald"
                label="Denials Prevented"
                value={data.kpis.potentialDenialsPrevented}
              />
            </div>
          </section>

          {/* Primary work area: what to do next */}
          <section>
            <SectionHeader
              title="Cases Requiring Attention"
              description="Highest-risk cases, ranked by what needs action next."
              action={
                <Button size="sm" variant="ghost" onClick={() => navigate("/cases")}>
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              }
              className="mb-3"
            />
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {data.priorityCases.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={FolderKanban}
                    title="No active cases yet"
                    description="Create your first case to begin analyzing denial risk."
                    actionLabel="Create Case"
                    onAction={() => navigate("/cases/new")}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-2xs font-semibold uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3">Case</th>
                        <th className="px-5 py-3">Procedure</th>
                        <th className="px-5 py-3">Payer</th>
                        <th className="px-5 py-3">Risk</th>
                        <th className="px-5 py-3">Next Action</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.priorityCases.map((c) => (
                        <tr
                          key={c.id}
                          className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50"
                          onClick={() => navigate(`/cases/${c.id}`)}
                        >
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <p className="font-semibold text-slate-800">{c.patientName}</p>
                            <p className="text-xs text-slate-400">{c.caseNumber}</p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{c.procedure}</td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{c.payer}</td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <RiskBadge level={c.riskLevel} score={c.riskScore} size="sm" />
                          </td>
                          <td className="max-w-[220px] truncate px-5 py-3.5 text-slate-600">{c.nextAction}</td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/cases/${c.id}`);
                              }}
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Secondary: impact to date */}
          <section className="rounded-lg bg-slate-100/60 p-5 sm:p-6">
            <p className="mb-4 text-2xs font-semibold uppercase tracking-wide text-slate-400">Prevention Impact to Date</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-figure text-xl font-bold text-slate-800">{data.preventionImpact.casesAnalyzed}</p>
                <p className="text-xs font-medium text-slate-500">Cases Analyzed</p>
              </div>
              <div>
                <p className="text-figure text-xl font-bold text-slate-800">{data.preventionImpact.potentialDenialsDetected}</p>
                <p className="text-xs font-medium text-slate-500">Potential Denials Detected</p>
              </div>
              <div>
                <p className="text-figure text-xl font-bold text-slate-800">{data.preventionImpact.casesCorrected}</p>
                <p className="text-xs font-medium text-slate-500">Cases Corrected</p>
              </div>
              <div>
                <p className="text-figure text-xl font-bold text-emerald-600">-{data.preventionImpact.estimatedRiskReduction}%</p>
                <p className="text-xs font-medium text-slate-500">Estimated Risk Reduction</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
