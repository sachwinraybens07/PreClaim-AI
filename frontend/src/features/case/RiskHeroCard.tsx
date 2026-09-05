import { RiskScale } from "../../components/ui/RiskScale";
import { RISK_META, RISK_INTERPRETATION } from "../../utils/risk";
import { cn } from "../../utils/cn";
import type { CaseDetail } from "../../types";

function topDrivers(caseDetail: CaseDetail): string[] {
  return caseDetail.riskFactors.filter((f) => f.impact === "HIGH").map((f) => f.title);
}

export function RiskHeroCard({ caseDetail }: { caseDetail: CaseDetail }) {
  const meta = RISK_META[caseDetail.riskLevel];
  const drivers = topDrivers(caseDetail);

  return (
    <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className={cn("absolute inset-x-0 top-0 h-1", meta.fill)} />
      <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,220px)_1fr]">
        <div className="flex flex-row items-center gap-6 lg:flex-col lg:items-start lg:gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-figure text-6xl font-extrabold leading-none tracking-tight text-slate-900 sm:text-7xl">
              {caseDetail.riskScore}
            </span>
            <span className="text-2xl font-bold text-slate-400">%</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={cn("inline-block h-2 w-2 rounded-full", meta.dot)} />
              <span className={cn("text-sm font-bold uppercase tracking-wide", meta.color)}>{meta.label}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Predicted Risk Score</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-slate-100 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div>
            <p className="text-base font-semibold text-slate-800">{RISK_INTERPRETATION[caseDetail.riskLevel]}</p>
            {caseDetail.predictedOutcome && (
              <p className="mt-1 text-sm text-slate-500">Predicted outcome: {caseDetail.predictedOutcome}</p>
            )}
          </div>

          <RiskScale score={caseDetail.riskScore} />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div>
              <p className="text-xs font-medium text-slate-400">Confidence</p>
              <p className="text-figure text-lg font-bold text-slate-800">{caseDetail.confidence}%</p>
            </div>
            {drivers.length > 0 && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">Primary drivers</p>
                <p className="truncate text-sm font-semibold text-slate-700">{drivers.join(" · ")}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Predicted risk score based on current case information and configured payer and documentation rules —
            not a guaranteed claim outcome.
          </p>
        </div>
      </div>
    </section>
  );
}
