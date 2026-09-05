import { useEffect, useState } from "react";
import { ShieldQuestion } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/EmptyState";
import { casesApi, ApiError } from "../../services/api";
import type { CoverageResult } from "../../types";

const STATUS_CLASS: Record<string, string> = {
  "Appears Covered": "bg-emerald-50 text-emerald-700",
  "Potentially Covered": "bg-amber-50 text-amber-700",
  "Requires Verification": "bg-orange-50 text-orange-700",
  "Not Typically Required": "bg-slate-100 text-slate-600",
  "Likely Required": "bg-orange-50 text-orange-700",
  Initiated: "bg-emerald-50 text-emerald-700",
  Documented: "bg-emerald-50 text-emerald-700",
  "Verification Required": "bg-orange-50 text-orange-700",
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
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <SectionHeader title="Coverage & Claimability" action={<ShieldQuestion className="h-4 w-4 text-slate-400" />} className="mb-4" />
      <div className="space-y-3">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        )}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && data && (
          <>
            <Row label="Procedure" value={data.procedure} />
            <Row label="Coverage" badge value={data.coverageStatus} />
            <Row label="Authorization" badge value={data.authorizationStatus} />
            <Row label="Medical Necessity" badge value={data.medicalNecessityStatus} />
            <Row label="Policy Concern" value={data.policyConcern} />
            <p className="pt-1 text-xs italic text-slate-400">{data.disclaimer}</p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-medium text-slate-500">{label}</span>
      {badge ? (
        <Badge className={STATUS_CLASS[value] || "bg-slate-100 text-slate-600"}>{value}</Badge>
      ) : (
        <span className="text-right font-semibold text-slate-800">{value}</span>
      )}
    </div>
  );
}
