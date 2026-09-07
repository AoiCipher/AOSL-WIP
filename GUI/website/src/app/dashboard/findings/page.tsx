"use client";

import { useState, useMemo } from "react";
import { Bug, Search, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { getFindings, getAssessments } from "@/lib/contents";
import { SEVERITY_ORDER, SEVERITY_STYLES, SEVERITY_DOT } from "@/lib/theme";
import { useSession } from "@/contexts/SessionContext";
import { cn } from "@/lib/utils";

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export default function FindingsPage() {
  const { hasPermission } = useSession();
  const [findings] = useState(() => getFindings());
  const [assessments] = useState(() => getAssessments());
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    findings.forEach((f) => { c[f.severity] = (c[f.severity] ?? 0) + 1; });
    return c;
  }, [findings]);

  const maxCount = Math.max(...Object.values(counts), 1);

  const filtered = useMemo(() => {
    return findings.filter((f) => {
      const matchesSeverity = severityFilter === "all" || f.severity === severityFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        f.title.toLowerCase().includes(q) ||
        f.affectedAsset.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q);
      return matchesSeverity && matchesSearch;
    });
  }, [findings, search, severityFilter]);

  const assessmentMap = useMemo(() => {
    const m: Record<string, string> = {};
    assessments.forEach((a) => { m[a.id] = a.name; });
    return m;
  }, [assessments]);

  if (!hasPermission("can_view_findings")) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="w-12 h-12 text-slate-700" strokeWidth={1} />
        <div className="text-center">
          <div className="text-base font-semibold text-slate-400">Access Restricted</div>
          <div className="text-sm text-slate-600 mt-1">You don't have permission to view findings.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#f8fafc]">Total Findings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Aggregated vulnerability metrics across {assessments.filter((a) => a.findingIds.length > 0).length} assessments
        </p>
      </div>

      {/* Severity summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {SEVERITY_ORDER.map((sev) => (
          <div
            key={sev}
            className={cn(
              "rounded-lg border p-4 cursor-pointer transition-all",
              severityFilter === sev
                ? "bg-[#0f1117] border-[#394955]/50"
                : "bg-[#0f1117] border-[#1e2d3d] hover:border-[#394955]/30"
            )}
            onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
          >
            <div className={cn("text-[10px] uppercase tracking-widest font-medium mb-2", SEVERITY_STYLES[sev].split(" ")[0])}>
              {SEVERITY_LABELS[sev]}
            </div>
            <div className="text-2xl font-bold text-[#f8fafc]">{counts[sev] ?? 0}</div>
            {/* Mini bar */}
            <div className="mt-2 h-1 rounded-full bg-[#1e2d3d] overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", SEVERITY_DOT[sev])}
                style={{ width: `${((counts[sev] ?? 0) / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="rounded-lg border border-[#1e2d3d] bg-[#0f1117] p-4 flex items-center gap-4">
        <Bug className="w-5 h-5 text-[#394955]" strokeWidth={1.5} />
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">Total Findings</div>
          <div className="text-2xl font-bold text-[#f8fafc]">{findings.length}</div>
        </div>
        <div className="ml-auto flex gap-6">
          {SEVERITY_ORDER.filter((s) => counts[s] > 0).map((sev) => (
            <div key={sev} className="text-center">
              <div className={cn("text-lg font-bold", SEVERITY_STYLES[sev].split(" ")[0])}>{counts[sev]}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{SEVERITY_LABELS[sev]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search findings..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0f1117] border border-[#1e2d3d] text-[#f8fafc] placeholder-slate-600 text-sm focus:outline-none focus:border-[#394955] transition-colors"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="py-2 pl-3 pr-8 rounded-lg bg-[#0f1117] border border-[#1e2d3d] text-sm text-[#f8fafc] focus:outline-none focus:border-[#394955] transition-colors appearance-none"
        >
          <option value="all">All Severities</option>
          {SEVERITY_ORDER.map((s) => (
            <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
          ))}
        </select>
        <span className="text-xs text-slate-600">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Findings table */}
      <div className="rounded-xl border border-[#1e2d3d] bg-[#0f1117] overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_200px_100px] gap-4 px-5 py-3 border-b border-[#1e2d3d] bg-[#09090b]">
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium w-16">Severity</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Finding</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Assessment</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Discovered</div>
        </div>
        <div className="divide-y divide-[#1e2d3d]">
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-slate-600">No findings match the current filters.</div>
          )}
          {filtered.map((f) => (
            <div key={f.id} className="divide-y divide-[#1e2d3d]">
              <div
                className="grid grid-cols-[auto_1fr_200px_100px] gap-4 px-5 py-3.5 hover:bg-[#1e2d3d]/20 transition-colors items-center cursor-pointer"
                onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
              >
                <div className="w-16">
                  <SeverityBadge severity={f.severity} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#f8fafc] truncate">{f.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{f.affectedAsset}</div>
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {assessmentMap[f.assessmentId] ?? f.assessmentId}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    {new Date(f.discoveredAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </span>
                  {expandedId === f.id ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
              </div>

              {/* Detail panel */}
              {expandedId === f.id && (
                <div className="px-5 py-4 bg-[#070a0d] space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mb-1.5">Description</div>
                      <p className="text-sm text-slate-300 leading-relaxed">{f.description}</p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mb-1.5">Remediation</div>
                      <p className="text-sm text-slate-300 leading-relaxed">{f.remediation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pt-1">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mr-2">Affected Asset</span>
                      <code className="text-xs text-[#f8fafc] bg-[#09090b] px-2 py-0.5 rounded border border-[#1e2d3d] font-mono">{f.affectedAsset}</code>
                    </div>
                    {f.cve && (
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mr-2">CVE</span>
                        <code className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-mono">{f.cve}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
