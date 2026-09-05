import { useState, useEffect } from "react";
import {
  FlaskConical,
  TrendingDown,
  Check,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";
import { RiskScale } from "../../components/ui/RiskScale";
import { casesApi, ApiError } from "../../services/api";
import type { DocumentItem, SimulationResult } from "../../types";
import { cn } from "../../utils/cn";
import { useCountUp } from "../../components/ui/MetricCard";

function ProjectedRiskValue({ value }: { value: number }) {
  const animated = useCountUp(value, 450);
  return <span>{animated}</span>;
}

export function WhatIfSimulator({
  caseId,
  documents,
  currentRisk,
}: {
  caseId: string;
  documents: DocumentItem[];
  currentRisk: number;
}) {
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

  const selectAll = () => {
    setSelected(new Set(missing.map((d) => d.type)));
  };

  const reset = () => {
    setSelected(new Set());
    setResult(null);
  };

  // Run simulation whenever selected items change
  const runSimulation = async () => {
    if (selected.size === 0) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await casesApi.simulateRisk(caseId, [...selected]);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to run the simulation.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-run simulation on selection change for immediate feedback
  useEffect(() => {
    if (selected.size > 0) {
      runSimulation();
    } else {
      setResult(null);
    }
  }, [selected, caseId]);

  if (missing.length === 0) {
    return (
      <div className="card-enterprise p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-bold text-slate-900">What-If Risk Modeling</h3>
        </div>
        <EmptyState
          icon={CheckCircle2}
          title="Optimal Claim State Reached"
          description="All mandatory clinical and administrative documentation is already verified on file."
        />
      </div>
    );
  }

  return (
    <div className="card-enterprise overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100/90 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-600">
              <FlaskConical className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                What-If Risk Simulator
              </h3>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={selectAll}
              className="focus-ring text-2xs font-semibold text-brand-600 hover:text-brand-700 hover:underline px-1.5 py-0.5"
            >
              Select All
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={reset}
              className="focus-ring flex items-center gap-1 text-2xs font-semibold text-slate-500 hover:text-slate-700 px-1.5 py-0.5"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Baseline risk is <span className="font-semibold text-slate-700">{currentRisk}%</span>. Select prospective document verifications below to model projected risk reduction prior to claim submission.
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Compact Toggle Grid */}
        <div className="space-y-2">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Select Corrective Interventions
          </p>
          <div className="grid gap-2 sm:grid-cols-1">
            {missing.map((doc) => {
              const checked = selected.has(doc.type);
              return (
                <label
                  key={doc.id}
                  className={cn(
                    "focus-ring flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-xs font-semibold transition-all",
                    checked
                      ? "border-brand-500/80 bg-brand-50/70 text-brand-900 shadow-2xs"
                      : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggle(doc.type)}
                    />
                    <span
                      className={cn(
                        "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all",
                        checked
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{doc.name}</span>
                  </div>

                  <span
                    className={cn(
                      "text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                      checked ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {checked ? "Included" : "Pending"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200/80 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Live Simulation Results */}
        {result ? (
          <div className="animate-fade-in space-y-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
            {/* Before / After Telemetry */}
            <div className="grid grid-cols-2 gap-3 divide-x divide-slate-200">
              {/* Current */}
              <div className="text-center pr-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Current Risk</p>
                <p className="text-figure mt-1 text-3xl font-black text-slate-800">{result.currentRisk}%</p>
                <div className="mt-2">
                  <RiskScale score={result.currentRisk} size="sm" showLabels={false} />
                </div>
              </div>

              {/* Projected */}
              <div className="text-center pl-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-emerald-700">Projected Risk</p>
                <p className="text-figure mt-1 text-3xl font-black text-emerald-600">
                  <ProjectedRiskValue value={result.simulatedRisk} />%
                </p>
                <div className="mt-2">
                  <RiskScale score={result.simulatedRisk} size="sm" showLabels={false} />
                </div>
              </div>
            </div>

            {/* Impact Metric Callout */}
            <div className="flex flex-col items-center justify-center gap-1.5 border-t border-slate-200/70 pt-3 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 border border-emerald-300/80 px-3 py-1 text-xs font-bold text-emerald-900 shadow-2xs transition-transform hover:scale-102">
                <TrendingDown className="h-3.5 w-3.5 text-emerald-700" />
                Risk Reduction: -{result.riskReduction} points
              </span>
              {result.predictedOutcome && (
                <p className="text-xs font-medium text-slate-600">
                  Projected Outcome: <strong className="text-slate-800">{result.predictedOutcome}</strong>
                </p>
              )}
            </div>

            {/* Linear Step Reduction Timeline (Never Breaks or Wraps Awkwardly) */}
            {result.steps.length > 1 && (
              <div className="border-t border-slate-200/70 pt-3">
                <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Stepwise Risk Reduction Sequence
                </p>
                <div className="space-y-1.5">
                  {result.steps.map((step, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === result.steps.length - 1;
                    return (
                      <div
                        key={`${step.label}-${idx}`}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs transition-all",
                          isLast
                            ? "border-emerald-200 bg-emerald-50/70 font-semibold text-emerald-900"
                            : isFirst
                            ? "border-slate-200 bg-white text-slate-700"
                            : "border-slate-200/60 bg-white/70 text-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-3xs font-black",
                              isLast ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                            )}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate">{step.label}</span>
                        </div>
                        <span className="text-figure font-bold shrink-0 pl-2">{step.risk}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500">
              Select one or more corrective documents above to model claim approval impact.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

