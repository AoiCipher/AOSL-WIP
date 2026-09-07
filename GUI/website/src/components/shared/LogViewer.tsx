"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface LogViewerProps {
  logs: string[];
  className?: string;
  autoScroll?: boolean;
}

export function LogViewer({ logs, className, autoScroll = true }: LogViewerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const colorize = (line: string) => {
    if (line.includes("CRITICAL")) return "text-rose-400";
    if (line.includes("HIGH")) return "text-orange-400";
    if (line.includes("MEDIUM")) return "text-amber-400";
    if (line.includes("LOW")) return "text-blue-400";
    if (line.includes("INFO") || line.includes("info")) return "text-slate-400";
    if (line.includes("COMPLETED") || line.includes("complete")) return "text-emerald-400";
    if (line.includes("ERROR") || line.includes("error")) return "text-rose-400";
    return "text-slate-300";
  };

  return (
    <div ref={ref} className={cn("log-viewer", className)}>
      {logs.length === 0 ? (
        <span className="text-slate-600">No logs yet...</span>
      ) : (
        logs.map((line, i) => (
          <div key={i} className={cn("leading-relaxed", colorize(line))}>
            {line}
          </div>
        ))
      )}
    </div>
  );
}
