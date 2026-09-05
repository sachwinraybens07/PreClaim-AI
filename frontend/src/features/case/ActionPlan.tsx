import { CheckCircle2, ListChecks } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { cn } from "../../utils/cn";
import type { ActionItem } from "../../types";

const PRIORITY_BORDER: Record<string, string> = {
  CRITICAL: "border-l-red-600",
  HIGH: "border-l-orange-500",
  MEDIUM: "border-l-amber-500",
  LOW: "border-l-slate-300",
};

const PRIORITY_TEXT: Record<string, string> = {
  CRITICAL: "text-red-700",
  HIGH: "text-orange-700",
  MEDIUM: "text-amber-700",
  LOW: "text-slate-500",
};

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
    <section>
      <SectionHeader
        title="Recommended Actions"
        description="What to do next to reduce this case's risk, in priority order."
        className="mb-3"
      />
      {actions.length === 0 ? (
        <EmptyState icon={ListChecks} title="No outstanding actions" description="This case is ready for submission, pending standard payer verification." />
      ) : (
        <div className="space-y-2.5">
          {actions.map((action) => {
            const complete = action.status === "COMPLETED";
            return (
              <div
                key={action.id}
                className={cn(
                  "flex flex-col gap-3 rounded-md border border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between",
                  complete ? "border-slate-200 border-l-emerald-500 bg-emerald-50/20" : cn("border-slate-200", PRIORITY_BORDER[action.priority] || PRIORITY_BORDER.LOW)
                )}
              >
                <div className="flex items-start gap-3">
                  {complete ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <div className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-slate-300" />
                  )}
                  <div>
                    {!complete && (
                      <p className={cn("text-2xs font-semibold uppercase tracking-wide", PRIORITY_TEXT[action.priority] || PRIORITY_TEXT.LOW)}>
                        {action.priority} Priority
                      </p>
                    )}
                    <p className="mt-0.5 text-sm font-bold text-slate-900">{action.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{action.description}</p>
                    <p className="mt-1 text-xs font-medium text-brand-600">Expected impact: {action.estimatedImpact}</p>
                  </div>
                </div>
                {!complete && (
                  <Button size="sm" onClick={() => onComplete(action)} isLoading={pendingId === action.id} className="shrink-0 sm:ml-4">
                    Take Action
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
