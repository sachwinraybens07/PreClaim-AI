import { useState } from "react";
import { FlaskConical, TrendingDown, ArrowRight, Check } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { RiskScale } from "../../components/ui/RiskScale";
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
    setResult(null);
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
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <SectionHeader title="What-If Preview" className="mb-3" />
        <EmptyState icon={FlaskConical} title="Nothing to simulate" description="All required documentation is already on file for this case." />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <SectionHeader
        title="What-If Preview"
        description={`Current predicted risk: ${currentRisk}%. Select fixes below to preview their projected effect.`}
        className="mb-4"
      />

      <div className="grid gap-2 sm:grid-cols-2">
        {missing.map((doc) => {
          const checked = selected.has(doc.type);
          return (
            <label
              key={doc.id}
              className={cn(
                "focus-ring flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm font-medium transition-colors",
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
                {checked && <Check className="h-3.5 w-3.5" />}
              </span>
              {doc.name} obtained
            </label>
          );
        })}
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>}

      <Button onClick={runSimulation} isLoading={loading} disabled={selected.size === 0} className="mt-4">
        <FlaskConical className="h-4 w-4" />
        Run Simulation
      </Button>

      {result && (
        <div className="animate-fade-in mt-6 space-y-5 border-t border-slate-100 pt-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="w-full max-w-[180px] text-center">
              <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400">Current Risk</p>
              <p className="text-figure mt-1 text-4xl font-extrabold text-slate-700">{result.currentRisk}%</p>
              <RiskScale score={result.currentRisk} size="sm" showLabels={false} className="mt-3" />
            </div>
            <ArrowRight className="hidden h-6 w-6 shrink-0 text-slate-300 sm:block" />
            <div className="w-full max-w-[180px] text-center">
              <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400">Projected Risk</p>
              <p className="text-figure mt-1 text-4xl font-extrabold text-emerald-600">{result.simulatedRisk}%</p>
              <RiskScale score={result.simulatedRisk} size="sm" showLabels={false} className="mt-3" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
              <TrendingDown className="h-4 w-4" />
              Projected reduction: {result.riskReduction} points
            </span>
            {result.predictedOutcome && (
              <span className="text-sm text-slate-500">Predicted outcome: {result.predictedOutcome}</span>
            )}
          </div>

          {result.steps.length > 1 && (
            <div>
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-slate-400">Simulation Steps</p>
              <ol className="flex flex-wrap items-stretch gap-2">
                {result.steps.map((step, i) => (
                  <li key={`${step.label}-${i}`} className="flex items-center gap-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-medium text-slate-600">{step.label}</p>
                      <p className="text-figure text-sm font-bold text-slate-800">{step.risk}%</p>
                    </div>
                    {i < result.steps.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="text-center text-xs italic text-slate-400">
            PROJECTED RISK — SIMULATION ONLY. Estimated based on current rules, not a guaranteed payer outcome.
          </p>
        </div>
      )}
    </div>
  );
}
