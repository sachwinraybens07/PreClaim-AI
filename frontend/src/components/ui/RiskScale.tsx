import { RISK_BANDS, RISK_META } from "../../utils/risk";
import { cn } from "../../utils/cn";

/**
 * A horizontal, segmented risk gauge: bands sized to the backend's actual
 * scoring thresholds, with a marker at the current score. Used anywhere a
 * single risk score needs a visual position, not just a number.
 */
export function RiskScale({
  score,
  size = "md",
  showLabels = true,
  className,
}: {
  score: number;
  size?: "md" | "sm";
  showLabels?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className={cn("w-full", className)}>
      <div className="relative pt-3">
        <div
          className="absolute top-0 -translate-x-1/2 transition-all duration-700 ease-out"
          style={{ left: `${clamped}%` }}
        >
          <div className="flex flex-col items-center">
            <span className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-slate-700" />
          </div>
        </div>
        <div className={cn("flex w-full gap-0.5 overflow-hidden rounded-full", size === "sm" ? "h-1.5" : "h-2.5")}>
          {RISK_BANDS.map((band) => (
            <div
              key={band.level}
              className={cn(RISK_META[band.level].fill, "opacity-90")}
              style={{ width: `${band.max - band.min + 1}%` }}
            />
          ))}
        </div>
      </div>
      {showLabels && (
        <div className="mt-1.5 flex justify-between text-2xs font-medium text-slate-400">
          {RISK_BANDS.map((band) => (
            <span key={band.level}>{RISK_META[band.level].label.replace(" Risk", "")}</span>
          ))}
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
  const total = RISK_BANDS.reduce((sum, b) => sum + (distribution[b.level] || 0), 0);
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {RISK_BANDS.map((band) => {
          const count = distribution[band.level] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={band.level}
              className={cn(RISK_META[band.level].fill, "transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full")}
              style={{ width: `${pct}%` }}
              title={`${RISK_META[band.level].label}: ${count}`}
            />
          );
        })}
        {total === 0 && <div className="h-full w-full bg-slate-100" />}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {RISK_BANDS.map((band) => (
          <div key={band.level} className="flex items-center gap-2">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", RISK_META[band.level].fill)} />
            <span className="text-sm text-slate-500">{RISK_META[band.level].label.replace(" Risk", "")}</span>
            <span className="text-figure ml-auto text-sm font-bold text-slate-800">{distribution[band.level] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
