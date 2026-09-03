import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { FileWarning, ShieldAlert } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/EmptyState";
import { denialsApi, ApiError } from "../services/api";
import type { DenialAnalytics } from "../types";

const COLORS = ["#4361ee", "#ea580c", "#ca8a04", "#0891b2", "#dc2626"];

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
    <AppLayout title="Denial Intelligence" subtitle="Historical denial patterns across payers and procedures.">
      {loading && <SkeletonCard />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-wrap gap-2">
            <select value={payer} onChange={(e) => setPayer(e.target.value)} className="focus-ring rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">All payers</option>
              {data.filters.payers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select value={procedure} onChange={(e) => setProcedure(e.target.value)} className="focus-ring rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">All procedures</option>
              {data.filters.procedures.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="focus-ring rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">All reasons</option>
              {data.filters.reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <FileWarning className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Most Common Denial Factor</p>
                  <p className="text-lg font-bold text-slate-900">{data.insights.mostCommonDenialFactor}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Highest Risk Workflow</p>
                  <p className="text-lg font-bold text-slate-900">{data.insights.highestRiskWorkflow}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Denial Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topDenialReasons.length === 0 ? (
                <p className="text-sm text-slate-400">No historical records match these filters.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.topDenialReasons} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
                    <YAxis dataKey="reason" type="category" width={160} tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} formatter={(v: number) => [`${v}%`, "Share"]} />
                    <Bar dataKey="percentage" radius={[0, 6, 6, 0]}>
                      {data.topDenialReasons.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Historical Records</CardTitle>
              <span className="text-sm font-medium text-slate-400">{data.insights.totalRecords} total</span>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Payer</th>
                    <th className="px-5 py-3">Procedure</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Outcome</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.slice(0, 12).map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-700">{r.payer}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{r.procedure}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{r.reason}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className={r.outcome === "DENIED" ? "font-semibold text-red-600" : "font-semibold text-green-600"}>
                          {r.outcome}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{new Date(r.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
