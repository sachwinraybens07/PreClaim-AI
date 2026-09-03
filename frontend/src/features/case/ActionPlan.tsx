import { CheckCircle2, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { PriorityBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { cn } from "../../utils/cn";
import type { ActionItem } from "../../types";

export function ActionPlan({
  actions,
  onComplete,
  pendingId,
}: {
  actions: ActionItem[];
  onComplete: (action: ActionItem) => void;
  pendingId: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prevention Action Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.length === 0 ? (
          <EmptyState icon={ListChecks} title="No outstanding actions" description="This case is ready for submission, pending standard payer verification." />
        ) : (
          actions.map((action) => {
            const complete = action.status === "COMPLETED";
            return (
              <div
                key={action.id}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
                  complete ? "border-green-200 bg-green-50/40" : "border-slate-200"
                )}
              >
                <div className="flex items-start gap-3">
                  {complete ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-slate-300" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{action.title}</span>
                      {!complete && <PriorityBadge priority={action.priority} />}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{action.description}</p>
                    <p className="mt-0.5 text-xs font-medium text-brand-600">{action.estimatedImpact}</p>
                  </div>
                </div>
                {!complete && (
                  <Button size="sm" onClick={() => onComplete(action)} isLoading={pendingId === action.id} className="shrink-0">
                    Complete
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
