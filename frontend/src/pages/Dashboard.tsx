import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileWarning,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
  Plus,
  FolderKanban,
  AlertTriangle,
  Activity,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { MetricCard } from "../components/ui/MetricCard";
import { RiskDistributionBar } from "../components/ui/RiskScale";
import { Button } from "../components/ui/Button";
import { RiskBadge, PayerBadge } from "../components/ui/Badge";
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
      subtitle="Pre-Submission Risk Assessment & Denial Prevention"
      primaryAction={{
        label: "New Case",
        icon: <Plus className="h-4 w-4" />,
        onClick: () => navigate("/cases/new"),
      }}
    >
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard className="h-64" />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="animate-fade-in space-y-7">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              variant="tile"
              tone="red"
              icon={<AlertTriangle className="h-4 w-4" />}
              label="High-Risk Cases"
              value={data.kpis.highRisk}
              subtext={`${data.kpis.highRisk} of ${data.kpis.activeCases} active cases need attention`}
            />
            <MetricCard
              variant="tile"
              tone="amber"
              icon={<FileWarning className="h-4 w-4" />}
              label="Missing Documentation"
              value={data.kpis.missingDocuments}
              subtext="Cases missing required clinical records"
            />
            <MetricCard
              variant="tile"
              tone="orange"
              icon={<ClipboardCheck className="h-4 w-4" />}
              label="Prior Auth Required"
              value={data.kpis.authorizationRequired}
              subtext="Cases pending required authorizations"
            />
            <MetricCard
              variant="tile"
              tone="emerald"
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Denials Prevented"
              value={data.kpis.potentialDenialsPrevented}
              subtext="Resolved prior to claim submission"
            />
          </div>

          {/* Portfolio Risk Profile & Distribution */}
          <section className="card-enterprise p-6 sm:p-7">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
              <div className="border-b border-slate-100 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-700">
                    <Activity className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                    Portfolio Risk Summary
                  </p>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-figure text-4xl font-extrabold text-slate-900">
                    {data.kpis.highRisk}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    / {data.kpis.activeCases} active cases
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Active cases evaluated against configured payer and documentation rules.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-2xs font-semibold text-amber-800 border border-amber-200/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>
                    {Math.round((data.kpis.highRisk / (data.kpis.activeCases || 1)) * 100)}% high-risk concentration
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                    Risk Distribution
                  </p>
                  <div className="flex items-center gap-3 text-2xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low: {data.riskDistribution.LOW || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Med: {data.riskDistribution.MEDIUM || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-orange-500" /> High: {data.riskDistribution.HIGH || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-600" /> Critical: {data.riskDistribution.CRITICAL || 0}
                    </span>
                  </div>
                </div>
                <RiskDistributionBar distribution={data.riskDistribution} />
                <p className="mt-4 text-3xs text-slate-400 italic">
                  Analysis based on configured payer and workflow rules.
                </p>
              </div>
            </div>
          </section>

          {/* Cases Requiring Attention */}
          <section className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Cases Requiring Attention</h2>
                <p className="text-xs text-slate-500">
                  Highest-risk cases ranked by estimated denial risk and pending actions.
                </p>
              </div>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => navigate("/cases")}
                className="self-start text-xs text-brand-600 hover:text-brand-700"
              >
                View all cases <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="card-enterprise overflow-hidden">
              {data.priorityCases.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={FolderKanban}
                    title="No high-risk cases in queue"
                    description="All active pre-submission cases meet configured documentation requirements."
                    actionLabel="Create Case"
                    onAction={() => navigate("/cases/new")}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-3 w-12">#</th>
                        <th className="px-5 py-3">Patient / Case</th>
                        <th className="px-5 py-3">Procedure</th>
                        <th className="px-5 py-3">Payer</th>
                        <th className="px-5 py-3">Risk Level</th>
                        <th className="px-5 py-3">Recommended Next Action</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.priorityCases.map((c, idx) => (
                        <tr
                          key={c.id}
                          className="cursor-pointer transition-colors duration-150 hover:bg-slate-50/80 animate-fade-in"
                          style={{ animationDelay: `${idx * 40}ms` }}
                          onClick={() => navigate(`/cases/${c.id}`)}
                        >
                          <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <p className="font-bold text-slate-900 hover:text-brand-600 transition-colors">
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
                            <RiskBadge level={c.riskLevel} score={c.riskScore} size="sm" />
                          </td>
                          <td className="max-w-[240px] truncate px-5 py-3.5 text-slate-600 font-medium">
                            {c.nextAction}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Operational Prevention Impact */}
          <section className="card-enterprise p-6 bg-linear-to-r from-white via-slate-50/40 to-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Operational Impact Summary
                  </h3>
                  <p className="text-2xs text-slate-400">
                    Cumulative prevention metrics across demo dataset
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Demo Metrics
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              <div className="px-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Cases Analyzed</p>
                <p className="text-figure mt-1.5 text-2xl font-black text-slate-800">
                  {data.preventionImpact.casesAnalyzed}
                </p>
                <p className="mt-1 text-3xs text-slate-500">Evaluated against rules</p>
              </div>

              <div className="px-2 pt-3 sm:pt-0 sm:pl-4">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Potential Denials</p>
                <p className="text-figure mt-1.5 text-2xl font-black text-amber-600">
                  {data.preventionImpact.potentialDenialsDetected}
                </p>
                <p className="mt-1 text-3xs text-slate-500">Flagged before submission</p>
              </div>

              <div className="px-2 pt-3 sm:pt-0 sm:pl-4">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Cases Corrected</p>
                <p className="text-figure mt-1.5 text-2xl font-black text-slate-800">
                  {data.preventionImpact.casesCorrected}
                </p>
                <p className="mt-1 text-3xs text-slate-500">Documented or updated</p>
              </div>

              <div className="px-2 pt-3 sm:pt-0 sm:pl-4">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Risk Reduction</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <TrendingDown className="h-5 w-5 text-emerald-600" />
                  <span className="text-figure text-2xl font-black text-emerald-600">
                    -{data.preventionImpact.estimatedRiskReduction}%
                  </span>
                </div>
                <p className="mt-1 text-3xs text-slate-500">Average projected reduction</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
