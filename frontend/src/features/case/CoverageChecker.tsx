import { useEffect, useState } from "react";
import { ShieldCheck, AlertCircle, FileCheck, FileQuestion } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/EmptyState";
import { casesApi, ApiError } from "../../services/api";
import type { CoverageResult } from "../../types";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  "Appears Covered": { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
  "Potentially Covered": { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
  "Requires Verification": { bg: "bg-rose-50 border-rose-200", text: "text-rose-800", dot: "bg-rose-500" },
  "Not Typically Required": { bg: "bg-slate-100 border-slate-200", text: "text-slate-700", dot: "bg-slate-400" },
  "Likely Required": { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
  Initiated: { bg: "bg-blue-50 border-blue-200", text: "text-blue-800", dot: "bg-blue-500" },
  Documented: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
  "Verification Required": { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
};

export function CoverageChecker({ caseId }: { caseId: string }) {
  const [data, setData] = useState<CoverageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    casesApi
      .getCoverage(caseId)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load coverage information."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [caseId]);

  return (
    <div className="card-enterprise p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Coverage & Claimability</h3>
            <p className="text-2xs text-slate-400">Configured payer coverage guidelines</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-3xs font-medium text-slate-600">
          <FileCheck className="h-3 w-3 text-brand-500" />
          Pre-Submission Rules
        </span>
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="space-y-2.5">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-3/4 rounded-md" />
          </div>
        )}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && data && (
          <>
            <div className="space-y-2.5 divide-y divide-slate-100/70">
              <Row label="Procedure" value={data.procedure} />
              <div className="pt-2.5">
                <StatusRow label="Coverage Status" value={data.coverageStatus} />
              </div>
              <div className="pt-2.5">
                <StatusRow label="Prior Authorization" value={data.authorizationStatus} />
              </div>
              <div className="pt-2.5">
                <StatusRow label="Medical Necessity" value={data.medicalNecessityStatus} />
              </div>
            </div>

            {data.policyConcern && (
              <div className="mt-3.5 rounded-lg border border-amber-200/80 bg-amber-50/60 p-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <div>
                    <span className="text-2xs font-semibold uppercase tracking-wider text-amber-900">
                      Policy Rule Flag
                    </span>
                    <p className="mt-0.5 text-xs text-amber-800 leading-relaxed font-normal">
                      {data.policyConcern}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-1.5 pt-2 border-t border-slate-100 text-3xs text-slate-400">
              <FileQuestion className="h-3 w-3 shrink-0" />
              <span>{data.disclaimer}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-800 tracking-tight">{value}</span>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  const config = STATUS_CONFIG[value] || { bg: "bg-slate-100 border-slate-200", text: "text-slate-700", dot: "bg-slate-400" };
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="font-medium text-slate-500">{label}</span>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-semibold ${config.bg} ${config.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {value}
      </span>
    </div>
  );
}
