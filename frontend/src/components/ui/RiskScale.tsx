import { useEffect, useState } from "react";
import { RISK_BANDS, RISK_META } from "../../utils/risk";
import { cn } from "../../utils/cn";
import { useCountUp } from "./MetricCard";

/**
 * A horizontal, segmented risk gauge: bands sized to the backend's actual
 * scoring thresholds, with a marker at the current score. Used anywhere a
 * single risk score needs a visual position, not just a number.
 */
export function RiskScale({
  score,
  size = "md",
  showLabels = true,
  animate = true,
  className,
}: {
  score: number;
  size?: "md" | "sm";
  showLabels?: boolean;
  animate?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const animatedScore = useCountUp(clamped, 850);
  const displayPosition = animate ? animatedScore : clamped;

  return (
    <div className={cn("w-full select-none", className)}>
      <div className="relative pt-4 pb-1">
        {/* Needle indicator with score pin */}
        <div
          className="absolute top-0 -translate-x-1/2 transition-all duration-700 ease-out"
          style={{ left: `${displayPosition}%` }}
        >
          <div className="flex flex-col items-center">
            <span className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-slate-800" />
            <span className="h-3 w-0.5 bg-slate-800" />
          </div>
        </div>

        {/* Calibrated Risk Track */}
        <div
          className={cn(
            "flex w-full gap-1 overflow-hidden rounded-full p-0.5 bg-slate-100 border border-slate-200/80 shadow-inner",
            size === "sm" ? "h-2" : "h-3"
          )}
        >
          {RISK_BANDS.map((band) => (
            <div
              key={band.level}
              className={cn(
                RISK_META[band.level].fill,
                "h-full rounded-full transition-all duration-500 ease-out opacity-90 hover:opacity-100"
              )}
              style={{ width: `${band.max - band.min + 1}%` }}
              title={`${RISK_META[band.level].label} (${band.min}%–${band.max}%)`}
            />
          ))}
        </div>
      </div>

      {showLabels && (
        <div className="mt-1 flex items-center justify-between text-2xs font-medium text-slate-400">
          <div className="flex items-center gap-1">
            <span className="text-figure text-slate-400">0%</span>
            <span className="text-emerald-700 font-semibold">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-figure text-slate-400">40%</span>
            <span className="text-amber-700 font-semibold">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-figure text-slate-400">60%</span>
            <span className="text-orange-700 font-semibold">High</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-figure text-slate-400">85%</span>
            <span className="text-red-700 font-semibold">Critical</span>
          </div>
          <span className="text-figure text-slate-400">100%</span>
        </div>
      )}
    </div>
  );
}

export function RiskDistributionBar({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const total = RISK_BANDS.reduce((sum, b) => sum + (distribution[b.level] || 0), 0);
  return (
    <div className="space-y-3.5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/80 shadow-inner">
        {RISK_BANDS.map((band) => {
          const count = distribution[band.level] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={band.level}
              className={cn(
                RISK_META[band.level].fill,
                "h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full hover:opacity-90"
              )}
              style={{ width: mounted ? `${pct}%` : "0%" }}
              title={`${RISK_META[band.level].label}: ${count} cases (${Math.round(pct)}%)`}
            />
          );
        })}
        {total === 0 && <div className="h-full w-full bg-slate-100" />}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RISK_BANDS.map((band) => {
          const count = distribution[band.level] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div
              key={band.level}
              className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white px-3 py-2 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", RISK_META[band.level].fill)} />
                <span className="text-xs font-medium text-slate-600">
                  {RISK_META[band.level].label.replace(" Risk", "")}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-figure text-sm font-bold text-slate-900">{count}</span>
                <span className="text-figure text-2xs font-medium text-slate-400">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
