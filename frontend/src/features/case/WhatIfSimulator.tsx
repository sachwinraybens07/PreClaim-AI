import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from "recharts";
import { FlaskConical, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { casesApi, ApiError } from "../../services/api";
import type { DocumentItem, SimulationResult } from "../../types";
import { cn } from "../../utils/cn";

export function WhatIfSimulator({ caseId, documents, currentRisk }: { caseId: string; documents: DocumentItem[]; currentRisk: number }) {
  const missing = documents.filter((d) => d.required && d.status !== "AVAILABLE");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (type: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await casesApi.simulateRisk(caseId, [...selected]);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to run the simulation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (missing.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>What If?</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={FlaskConical} title="Nothing to simulate" description="All required documentation is already on file for this case." />
        </CardContent>
      </Card>
    );
  }

  const chartData = result ? result.steps.map((s, i) => ({ ...s, isFirst: i === 0 })) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>What If?</CardTitle>
        <span className="text-sm font-bold text-slate-700">Current Risk: {currentRisk}%</span>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="-mt-2 text-sm text-slate-500">See how corrective actions could change the predicted risk.</p>

        <div className="grid gap-2 sm:grid-cols-2">
          {missing.map((doc) => {
            const checked = selected.has(doc.type);
            return (
              <label
                key={doc.id}
                className={cn(
                  "focus-ring flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors",
                  checked ? "border-brand-500 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(doc.type)} />
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                    checked ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300"
                  )}
                >
                  {checked && "✓"}
                </span>
                {doc.name} obtained
              </label>
            );
          })}
        </div>

        {error && <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>}

        <Button onClick={runSimulation} isLoading={loading} disabled={selected.size === 0}>
          <FlaskConical className="h-4 w-4" />
          Run Simulation
        </Button>

        {result && (
          <div className="animate-fade-in space-y-4 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Simulated Risk</p>
                <p className="text-3xl font-extrabold text-green-600">{result.simulatedRisk}%</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-700">
                <TrendingDown className="h-4 w-4" />
                Potential Risk Reduction: {result.riskReduction} percentage points
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 20, left: -20 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} interval={0} angle={-10} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} formatter={(v: number) => [`${v}%`, "Risk"]} />
                <Bar dataKey="risk" radius={[6, 6, 0, 0]} fill="#4361ee" animationDuration={800}>
                  <LabelList dataKey="risk" position="top" formatter={(v: number) => `${v}%`} className="text-xs font-semibold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <p className="text-xs italic text-slate-400">Estimated simulation — not a guaranteed payer outcome.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
