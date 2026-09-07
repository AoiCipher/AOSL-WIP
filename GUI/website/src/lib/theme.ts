export const STATUS_STYLES: Record<string, string> = {
  running: "text-cyan-400 bg-cyan-400/10 border border-cyan-400/30",
  queued: "text-amber-400 bg-amber-400/10 border border-amber-400/30",
  completed: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/30",
  error: "text-rose-400 bg-rose-400/10 border border-rose-400/30",
  failed: "text-rose-400 bg-rose-400/10 border border-rose-400/30",
  canceled: "text-slate-400 bg-slate-400/10 border border-slate-400/30",
};

export const SEVERITY_STYLES: Record<string, string> = {
  critical: "text-rose-500 bg-rose-500/10 border border-rose-500/30",
  high: "text-orange-400 bg-orange-400/10 border border-orange-400/30",
  medium: "text-amber-400 bg-amber-400/10 border border-amber-400/30",
  low: "text-blue-400 bg-blue-400/10 border border-blue-400/30",
  info: "text-slate-400 bg-slate-400/10 border border-slate-400/30",
};

export const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-rose-500",
  high: "bg-orange-400",
  medium: "bg-amber-400",
  low: "bg-blue-400",
  info: "bg-slate-400",
};

export const SEVERITY_ORDER = ["critical", "high", "medium", "low", "info"] as const;
export type SeverityLevel = (typeof SEVERITY_ORDER)[number];
export type StatusType = "running" | "queued" | "completed" | "error" | "failed" | "canceled";
