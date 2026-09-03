import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { cn } from "../../utils/cn";
import type { RiskFactorItem } from "../../types";
import { ShieldCheck } from "lucide-react";

const IMPACT_CLASS: Record<string, string> = {
  HIGH: "bg-red-50 text-red-700",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  LOW: "bg-slate-100 text-slate-600",
};

export function RiskFactors({ factors }: { factors: RiskFactorItem[] }) {
  const [openId, setOpenId] = useState<string | null>(factors[0]?.id ?? null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Why is this case high risk?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {factors.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No risk factors identified" description="This case currently has no identified denial-risk drivers." />
        ) : (
          factors.map((factor) => {
            const isOpen = openId === factor.id;
            return (
              <div key={factor.id} className="rounded-lg border border-slate-200">
                <button
                  className="focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3.5 text-left"
                  onClick={() => setOpenId(isOpen ? null : factor.id)}
                  aria-expanded={isOpen}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Badge className={IMPACT_CLASS[factor.impact] || IMPACT_CLASS.LOW}>{factor.impact} IMPACT</Badge>
                    <span className="truncate text-sm font-semibold text-slate-800">{factor.title}</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="animate-fade-in space-y-2.5 border-t border-slate-100 px-4 py-4 text-sm">
                    <p>
                      <span className="font-semibold text-slate-700">Problem: </span>
                      <span className="text-slate-600">{factor.description}</span>
                    </p>
                    {factor.evidence && (
                      <p>
                        <span className="font-semibold text-slate-700">Why it matters: </span>
                        <span className="text-slate-600">{factor.evidence}</span>
                      </p>
                    )}
                    {factor.action && (
                      <p>
                        <span className="font-semibold text-slate-700">Recommended action: </span>
                        <span className="text-slate-600">{factor.action}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
