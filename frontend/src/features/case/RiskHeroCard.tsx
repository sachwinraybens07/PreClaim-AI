import { RiskScale } from "../../components/ui/RiskScale";
import { RiskBadge } from "../../components/ui/Badge";
import { RISK_META, RISK_INTERPRETATION } from "../../utils/risk";
import { cn } from "../../utils/cn";
import type { CaseDetail } from "../../types";
import { ShieldAlert, AlertCircle, Zap } from "lucide-react";
import { useCountUp } from "../../components/ui/MetricCard";

function topDrivers(caseDetail: CaseDetail): string[] {
  return caseDetail.riskFactors.filter((f) => f.impact === "HIGH").map((f) => f.title);
}

export function RiskHeroCard({ caseDetail }: { caseDetail: CaseDetail }) {
  const meta = RISK_META[caseDetail.riskLevel] || RISK_META.LOW;
  const drivers = topDrivers(caseDetail);
  const animatedScore = useCountUp(caseDetail.riskScore, 850);
  const animatedReadiness = useCountUp(caseDetail.readiness, 850);

  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-card transition-all">
      {/* Top severity accent stripe */}
      <div className={cn("absolute inset-x-0 top-0 h-1.5", meta.fill)} />

      <div className="p-6 sm:p-7">
        {/* Header telemetry band */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Pre-Submission Risk Telemetry
            </span>
          </div>

          <div className="flex items-center gap-2">
            <RiskBadge level={caseDetail.riskLevel} size="md" score={caseDetail.riskScore} variant="pill" />
          </div>
        </div>

        {/* Primary metrics grid */}
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Risk Score block */}
          <div className="flex flex-col justify-center border-slate-100 lg:col-span-4 lg:border-r lg:pr-8">
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Current Risk</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-figure text-6xl font-black tracking-tight text-slate-900 sm:text-7xl">
                {animatedScore}
              </span>
              <span className="text-3xl font-extrabold text-slate-400">%</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
              <span className={cn("text-xs font-bold tracking-tight", meta.color)}>
                {meta.label} Threshold
              </span>
            </div>

            {/* Quick Readiness bar */}
            <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">Claim Readiness</span>
                <span className="text-figure font-bold text-slate-900">{animatedReadiness}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    caseDetail.readiness >= 80 ? "bg-emerald-500" : caseDetail.readiness >= 50 ? "bg-brand-500" : "bg-amber-500"
                  )}
                  style={{ width: `${animatedReadiness}%` }}
                />
              </div>
            </div>
          </div>

          {/* Calibrated Gauge & Breakdown */}
          <div className="flex flex-col justify-between space-y-5 lg:col-span-8">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {RISK_INTERPRETATION[caseDetail.riskLevel]}
                  </h3>
                  {caseDetail.predictedOutcome && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-900">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>Potential outcome: {caseDetail.predictedOutcome}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Analysis Confidence</p>
                  <p className="text-figure text-xl font-black text-slate-900">{caseDetail.confidence}%</p>
                </div>
              </div>
            </div>

            {/* Actuarial Risk Scale */}
            <div>
              <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-slate-400">
                Risk Threshold Scale
              </p>
              <RiskScale score={caseDetail.riskScore} />
            </div>

            {/* Primary Denial Drivers */}
            {drivers.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-slate-400">
                  Primary Risk Drivers
                </p>
                <div className="flex flex-wrap gap-2">
                  {drivers.map((driver, idx) => (
                    <span
                      key={driver}
                      className="inline-flex items-center gap-1.5 rounded-md border border-orange-200/90 bg-orange-50/80 px-2.5 py-1 text-xs font-semibold text-orange-950 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-2xs animate-fade-in"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                      {driver}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer footer */}
        <div className="mt-6 border-t border-slate-100 pt-3 text-center sm:text-left">
          <p className="text-2xs text-slate-400">
            Pre-submission risk estimates are generated from configured payer and documentation rules — they do not represent formal payer claim adjudication.
          </p>
        </div>
      </div>
    </section>
  );
}
