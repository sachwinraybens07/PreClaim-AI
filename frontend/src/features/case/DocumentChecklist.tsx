import { CheckCircle2, Clock, FileWarning } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Button } from "../../components/ui/Button";
import { PriorityBadge } from "../../components/ui/Badge";
import { cn } from "../../utils/cn";
import type { DocumentItem } from "../../types";

export function DocumentChecklist({
  documents,
  onMarkObtained,
  pendingId,
}: {
  documents: DocumentItem[];
  onMarkObtained: (doc: DocumentItem) => void;
  pendingId: string | null;
}) {
  const required = documents.filter((d) => d.required);
  const available = required.filter((d) => d.status === "AVAILABLE");
  const readiness = required.length ? Math.round((available.length / required.length) * 100) : 100;

  return (
    <section>
      <SectionHeader
        title="Document Readiness"
        description="What's on file for this claim, and what still needs to be obtained."
        action={
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn("h-full rounded-full transition-all duration-700 ease-out", readiness === 100 ? "bg-emerald-500" : "bg-brand-500")}
                style={{ width: `${readiness}%` }}
              />
            </div>
            <span className="text-figure text-sm font-bold text-slate-700">
              {available.length}/{required.length}
            </span>
          </div>
        }
        className="mb-3"
      />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {required.map((doc) => {
          const complete = doc.status === "AVAILABLE";
          const pendingReview = doc.status === "PENDING_REVIEW";
          return (
            <div
              key={doc.id}
              className={cn(
                "flex items-start gap-3 rounded-md border p-3.5",
                complete && "border-emerald-200 bg-emerald-50/30",
                pendingReview && "border-amber-200 bg-amber-50/30",
                !complete && !pendingReview && "border-slate-200 bg-white"
              )}
            >
              {complete ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : pendingReview ? (
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              ) : (
                <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{doc.name}</span>
                  {!complete && !pendingReview && <PriorityBadge priority={doc.priority} />}
                </div>
                {complete && <p className="mt-0.5 text-xs font-medium text-emerald-700">Verified</p>}
                {pendingReview && <p className="mt-0.5 text-xs font-medium text-amber-700">Processing — awaiting review</p>}
                {!complete && !pendingReview && doc.instructions && (
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.instructions}
                    {doc.source && <span className="text-slate-400"> — via {doc.source}</span>}
                  </p>
                )}
                {!complete && !pendingReview && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2.5"
                    onClick={() => onMarkObtained(doc)}
                    isLoading={pendingId === doc.id}
                  >
                    {pendingId !== doc.id && <CheckCircle2 className="h-3.5 w-3.5" />}
                    Mark as Obtained
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
