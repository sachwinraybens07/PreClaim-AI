import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { FileWarning, ShieldAlert, Activity, Filter, CheckCircle2, XCircle } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { MetricCard } from "../components/ui/MetricCard";
import { PayerBadge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/EmptyState";
import { denialsApi, ApiError } from "../services/api";
import type { DenialAnalytics } from "../types";

const COLORS = ["#2563eb", "#ea580c", "#d97706", "#0891b2", "#dc2626"];

export default function DenialIntelligence() {
  const [data, setData] = useState<DenialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payer, setPayer] = useState("");
  const [procedure, setProcedure] = useState("");
  const [reason, setReason] = useState("");

  const load = () => {
    setLoading(true);
    setError(null);
    denialsApi
      .getDenialAnalytics({ payer: payer || undefined, procedure: procedure || undefined, reason: reason || undefined })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load denial analytics."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [payer, procedure, reason]);

  return (
    <AppLayout
      title="Denial Intelligence"
      subtitle="Historical denial patterns, recurring root causes, and demo benchmark analytics."
    >
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard className="h-72" />
        </div>
      )}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="animate-fade-in space-y-6">
          {/* Filter Bar */}
          <div className="card-enterprise p-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
                <Filter className="h-3.5 w-3.5" />
                <span className="font-semibold text-slate-500">Filter By:</span>
              </div>

              <select
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                className="focus-ring rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300"
              >
                <option value="">All Payers</option>
                {data.filters.payers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                className="focus-ring rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300"
              >
                <option value="">All Procedures</option>
                {data.filters.procedures.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="focus-ring rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300"
              >
                <option value="">All Root Denial Reasons</option>
                {data.filters.reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {(payer || procedure || reason) && (
                <button
                  onClick={() => {
                    setPayer("");
                    setProcedure("");
                    setReason("");
                  }}
                  className="focus-ring text-2xs font-semibold text-brand-600 hover:underline ml-auto"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Key Insights Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard
              variant="tile"
              icon={<FileWarning className="h-4.5 w-4.5" />}
              tone="amber"
              label="Primary Denial Factor"
              value={data.insights.mostCommonDenialFactor}
              subtext="Highest recurring denial category across demo audit sample"
            />
            <MetricCard
              variant="tile"
              icon={<ShieldAlert className="h-4.5 w-4.5" />}
              tone="red"
              label="Highest Risk Specialty Workflow"
              value={data.insights.highestRiskWorkflow}
              subtext="Clinical specialty with highest concentration of prior authorization requirements"
            />
          </div>

          {/* Top Denial Reasons Chart */}
          <section className="card-enterprise p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Activity className="h-4 w-4 text-brand-600" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Prevalent Denial Drivers (% Share)
                  </h3>
                  <p className="text-2xs text-slate-400">
                    Distribution of denial occurrences across demo records
                  </p>
                </div>
              </div>
            </div>

            {data.topDenialReasons.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No historical records match the selected filter combination.
              </p>
            ) : (
              <div className="pt-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.topDenialReasons} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
                    <YAxis
                      dataKey="reason"
                      type="category"
                      width={180}
                      tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                        fontSize: 12,
                      }}
                      formatter={(value: unknown) => {
                        const num = Array.isArray(value) ? Number(value[0]) : Number(value);
                        return [Number.isFinite(num) ? `${num}%` : "—", "Adjudication Share"];
                      }}
                    />
                    <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={18}>
                      {data.topDenialReasons.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Historical Adjudication Records Table */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Historical Adjudication Records
                </h3>
                <p className="text-2xs text-slate-500">
                  Demo denial dataset — {data.insights.totalRecords} records evaluated
                </p>
              </div>
            </div>

            <div className="card-enterprise overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Payer</th>
                      <th className="px-5 py-3">Procedure</th>
                      <th className="px-5 py-3">Adjudication Reason</th>
                      <th className="px-5 py-3">Outcome</th>
                      <th className="px-5 py-3">Audit Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.records.slice(0, 12).map((r, idx) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/70 transition-colors duration-150"
                        style={{
                          animationDelay: `${idx * 25}ms`,
                        }}
                      >
                        <td className="whitespace-nowrap px-5 py-3">
                          <PayerBadge payer={r.payer} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">
                          {r.procedure}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600 font-normal">
                          {r.reason}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3">
                          {r.outcome === "DENIED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-3xs font-bold text-rose-800 uppercase tracking-wider">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              Denied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-3xs font-bold text-emerald-800 uppercase tracking-wider">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Approved
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-2xs text-slate-500">
                          {new Date(r.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
