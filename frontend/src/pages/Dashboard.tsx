import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  AlertTriangle,
  FileWarning,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { RiskBadge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ErrorState, EmptyState } from "../components/ui/EmptyState";
import { dashboardApi } from "../services/api";
import type { DashboardData } from "../types";
import { useAuth } from "../hooks/useAuth";

const RISK_COLORS: Record<string, string> = {
  LOW: "#16a34a",
  MEDIUM: "#ca8a04",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

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

  const distributionData = data
    ? (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((level) => ({
        level,
        count: data.riskDistribution[level] || 0,
      }))
    : [];

  return (
    <AppLayout title={`${greeting}, ${firstName}`} subtitle="Here's your claim prevention overview.">
      {loading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <KpiCard icon={FolderKanban} label="Active Cases" value={data.kpis.activeCases} accent="bg-blue-50 text-blue-600" />
            <KpiCard icon={AlertTriangle} label="High Risk" value={data.kpis.highRisk} accent="bg-orange-50 text-orange-600" />
            <KpiCard icon={FileWarning} label="Missing Documents" value={data.kpis.missingDocuments} accent="bg-yellow-50 text-yellow-700" />
            <KpiCard icon={ClipboardCheck} label="Authorization Required" value={data.kpis.authorizationRequired} accent="bg-purple-50 text-purple-600" />
            <KpiCard icon={ShieldCheck} label="Denials Prevented" value={data.kpis.potentialDenialsPrevented} accent="bg-green-50 text-green-600" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Priority Cases</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => navigate("/cases")}>
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {data.priorityCases.length === 0 ? (
                  <div className="p-5">
                    <EmptyState title="No active cases yet" description="Create your first case to see AI risk analysis here." />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-3">Case</th>
                          <th className="px-5 py-3">Patient</th>
                          <th className="px-5 py-3">Procedure</th>
                          <th className="px-5 py-3">Payer</th>
                          <th className="px-5 py-3">Risk</th>
                          <th className="px-5 py-3">Next Action</th>
                          <th className="px-5 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {data.priorityCases.map((c) => (
                          <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                            <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800">{c.caseNumber}</td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-slate-700">{c.patientName}</td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{c.procedure}</td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{c.payer}</td>
                            <td className="whitespace-nowrap px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{c.riskScore}%</span>
                                <RiskBadge level={c.riskLevel} size="sm" />
                              </div>
                            </td>
                            <td className="max-w-[220px] truncate px-5 py-3.5 text-slate-600">{c.nextAction}</td>
                            <td className="whitespace-nowrap px-5 py-3.5">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/cases/${c.id}`)}>
                                Review Case
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distributionData} margin={{ left: -20 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="level" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {distributionData.map((entry) => (
                        <Cell key={entry.level} fill={RISK_COLORS[entry.level]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Prevention Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.preventionImpact.casesAnalyzed}</p>
                  <p className="text-xs font-medium text-slate-500">Cases Analyzed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.preventionImpact.potentialDenialsDetected}</p>
                  <p className="text-xs font-medium text-slate-500">Potential Denials Detected</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.preventionImpact.casesCorrected}</p>
                  <p className="text-xs font-medium text-slate-500">Cases Corrected</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">-{data.preventionImpact.estimatedRiskReduction}%</p>
                  <p className="text-xs font-medium text-slate-500">Estimated Risk Reduction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
