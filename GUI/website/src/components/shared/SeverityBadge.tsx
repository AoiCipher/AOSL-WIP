import { cn } from "@/lib/utils";
import { SEVERITY_STYLES } from "@/lib/theme";
import type { SeverityLevel } from "@/lib/theme";

interface SeverityBadgeProps {
  severity: string;
  className?: string;
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const style = SEVERITY_STYLES[severity] ?? "text-slate-400 bg-slate-400/10 border border-slate-400/30";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide",
        style,
        className
      )}
    >
      {SEVERITY_LABELS[severity] ?? severity}
    </span>
  );
}
