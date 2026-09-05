import { cn } from "../../utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/70", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200/80 bg-white p-5 shadow-card", className)}>
      <Skeleton className="mb-3 h-4 w-1/4" />
      <Skeleton className="mb-2 h-7 w-1/2" />
      <Skeleton className="h-3.5 w-3/4" />
    </div>
  );
}

export function SkeletonCaseAnalysis() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
        <div className="flex gap-6">
          <Skeleton className="h-20 w-28 rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
