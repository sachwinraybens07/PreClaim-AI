import { CheckCircle2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
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
    <Card>
      <CardHeader>
        <CardTitle>Documentation Readiness</CardTitle>
        <span className="text-sm font-bold text-slate-700">
          {available.length}/{required.length} documents available
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBar value={readiness} barClassName={readiness === 100 ? "bg-green-600" : "bg-brand-500"} />

        <div className="space-y-3">
          {required.map((doc) => {
            const complete = doc.status === "AVAILABLE";
            return (
              <div
                key={doc.id}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
                  complete ? "border-green-200 bg-green-50/40" : "border-slate-200"
                )}
              >
                <div className="flex items-start gap-3">
                  {complete ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{doc.name}</span>
                      {!complete && <PriorityBadge priority={doc.priority} />}
                    </div>
                    {!complete && doc.instructions && (
                      <div className="mt-1.5 space-y-0.5 text-xs text-slate-500">
                        <p>
                          <span className="font-medium text-slate-600">Why needed: </span>
                          {doc.instructions}
                        </p>
                        {doc.source && (
                          <p>
                            <span className="font-medium text-slate-600">Provided by: </span>
                            {doc.source}
                          </p>
                        )}
                      </div>
                    )}
                    {complete && <p className="mt-1 text-xs font-medium text-green-700">Complete</p>}
                  </div>
                </div>
                {!complete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => onMarkObtained(doc)}
                    isLoading={pendingId === doc.id}
                  >
                    {pendingId !== doc.id && <CheckCircle2 className="h-3.5 w-3.5" />}
                    Mark as Obtained
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
