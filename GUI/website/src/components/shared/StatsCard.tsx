import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  description?: string;
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, iconColor, description, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#1e2d3d] bg-[#0f1117] p-4 flex flex-col gap-2",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
        {Icon && (
          <Icon
            className={cn("w-4 h-4", iconColor ?? "text-[#394955]")}
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="text-2xl font-bold text-[#f8fafc]">{value}</div>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
  );
}
