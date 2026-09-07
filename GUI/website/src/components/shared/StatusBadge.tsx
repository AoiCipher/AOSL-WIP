import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/lib/theme";
import type { StatusType } from "@/lib/theme";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  queued: "Queued",
  completed: "Completed",
  error: "Error",
  failed: "Failed",
  canceled: "Canceled",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "text-slate-400 bg-slate-400/10 border border-slate-400/30";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium",
        style,
        className
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-cyan-400 animate-pulse": status === "running",
          "bg-amber-400": status === "queued",
          "bg-emerald-400": status === "completed",
          "bg-rose-400": status === "error" || status === "failed",
          "bg-slate-400": status === "canceled",
        })}
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
