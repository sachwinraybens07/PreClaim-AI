import { Card, CardContent } from "../../components/ui/Card";
import { RiskBadge } from "../../components/ui/Badge";
import { RISK_META, riskBarColor } from "../../utils/risk";
import type { CaseDetail } from "../../types";

export function RiskHeroCard({ caseDetail }: { caseDetail: CaseDetail }) {
  const meta = RISK_META[caseDetail.riskLevel];
  return (
    <Card className={`border-2 ${meta.border}`}>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                className={riskBarColor(caseDetail.riskLevel).replace("bg-", "stroke-")}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(caseDetail.riskScore / 100) * 264} 264`}
              />
            </svg>
            <span className="absolute text-2xl font-extrabold text-slate-900">{caseDetail.riskScore}%</span>
          </div>
          <div>
            <RiskBadge level={caseDetail.riskLevel} />
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {caseDetail.riskScore}% Estimated Denial Risk
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              Predicted Outcome: {caseDetail.predictedOutcome}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Estimated risk based on available case information and historical patterns.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 rounded-lg bg-slate-50 px-4 py-3 sm:items-end">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Confidence</p>
          <p className="text-2xl font-bold text-slate-800">{caseDetail.confidence}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
