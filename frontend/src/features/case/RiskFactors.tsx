import { ShieldCheck } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { cn } from "../../utils/cn";
import type { RiskFactorItem } from "../../types";

const IMPACT_META: Record<string, { border: string; text: string; label: string }> = {
  HIGH: { border: "border-l-orange-500", text: "text-orange-700", label: "High Impact" },
  MEDIUM: { border: "border-l-amber-500", text: "text-amber-700", label: "Medium Impact" },
  LOW: { border: "border-l-slate-300", text: "text-slate-500", label: "Low Impact" },
};

export function RiskFactors({ factors }: { factors: RiskFactorItem[] }) {
  return (
    <section>
      <SectionHeader
        title="Why is this case risky?"
        description="Each factor below contributes to the predicted score above."
        className="mb-3"
      />
      {factors.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No risk factors identified" description="This case currently has no identified denial-risk drivers." />
      ) : (
        <div className="space-y-2.5">
          {factors.map((factor) => {
            const impact = IMPACT_META[factor.impact] || IMPACT_META.LOW;
            return (
              <div key={factor.id} className={cn("rounded-md border border-l-4 border-slate-200 bg-white p-4", impact.border)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{factor.title}</h3>
                  <span className={cn("text-2xs font-semibold uppercase tracking-wide", impact.text)}>{impact.label}</span>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3">
                  {factor.evidence && (
                    <div>
                      <dt className="text-2xs font-semibold uppercase tracking-wide text-slate-400">Why</dt>
                      <dd className="mt-0.5 text-sm text-slate-600">{factor.evidence}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-2xs font-semibold uppercase tracking-wide text-slate-400">What&rsquo;s missing</dt>
                    <dd className="mt-0.5 text-sm text-slate-600">{factor.description}</dd>
                  </div>
                  {factor.action && (
                    <div>
                      <dt className="text-2xs font-semibold uppercase tracking-wide text-slate-400">Recommended action</dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-700">{factor.action}</dd>
                    </div>
                  )}
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
