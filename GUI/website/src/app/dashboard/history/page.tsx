"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  XCircle,
  Search,
  Filter,
  Terminal,
  AlertCircle,
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LogViewer } from "@/components/shared/LogViewer";
import {
  getAssessments,
  updateAssessmentStatus,
  type Assessment,
  type AssessmentStatus,
} from "@/lib/contents";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: AssessmentStatus[] = ["running", "queued", "completed", "error", "canceled"];

export default function HistoryPage() {
  const { hasPermission } = useSession();
  const [assessments, setAssessments] = useState(() => getAssessments());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.domains.some((d) => d.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [assessments, statusFilter, search]);

  const handleCancel = (id: string) => {
    updateAssessmentStatus(id, "canceled");
    setAssessments(getAssessments());
    setConfirmCancel(null);
  };

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="p-6 space-y-6">
      {/* Confirm cancel dialog */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmCancel(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#1e2d3d] bg-[#0f1117] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-sm font-semibold text-[#f8fafc]">Cancel Assessment</h3>
            </div>
            <p className="text-sm text-slate-400 mb-5">
              Are you sure you want to cancel this assessment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 py-2 rounded-lg text-sm border border-[#1e2d3d] text-slate-400 hover:text-[#f8fafc] hover:bg-[#1e2d3d]/50 transition-colors"
              >
                Keep Running
              </button>
              <button
                onClick={() => handleCancel(confirmCancel)}
                className="flex-1 py-2 rounded-lg text-sm bg-rose-950 border border-rose-500/40 text-rose-400 hover:bg-rose-900/60 transition-colors font-medium"
              >
                Cancel Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#f8fafc]">Assessment History</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track all assessment runs with live planner execution logs</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0f1117] border border-[#1e2d3d] text-[#f8fafc] placeholder-slate-600 text-sm focus:outline-none focus:border-[#394955] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 pl-3 pr-8 rounded-lg bg-[#0f1117] border border-[#1e2d3d] text-sm text-[#f8fafc] focus:outline-none focus:border-[#394955] transition-colors appearance-none"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1e2d3d] bg-[#0f1117] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_140px_120px_auto] gap-4 px-5 py-3 border-b border-[#1e2d3d] bg-[#09090b]">
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Assessment</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Domains</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Created</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Status</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Actions</div>
        </div>

        <div className="divide-y divide-[#1e2d3d]">
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-slate-600">
              No assessments match the current filters.
            </div>
          )}
          {filtered.map((a) => (
            <div key={a.id} className="divide-y divide-[#1e2d3d]">
              <div
                className="grid grid-cols-[1fr_1fr_140px_120px_auto] gap-4 px-5 py-3.5 hover:bg-[#1e2d3d]/20 transition-colors items-center"
              >
                {/* Name */}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#f8fafc] truncate">{a.name}</div>
                  <div className="text-xs text-slate-600 mt-0.5 truncate">
                    {a.focusAreas.join(", ")}
                  </div>
                </div>

                {/* Domains */}
                <div className="min-w-0">
                  <div className="text-xs text-slate-400 truncate">
                    {a.domains.join(", ")}
                  </div>
                  {a.outOfScope.length > 0 && (
                    <div className="text-[10px] text-slate-600 mt-0.5 truncate">
                      out-of-scope: {a.outOfScope.join(", ")}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="text-xs text-slate-500">
                  {new Date(a.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={a.status} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggle(a.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-[#f8fafc] hover:bg-[#1e2d3d]/50 transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Logs
                    {expandedId === a.id ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                  {hasPermission("can_cancel_assessments") &&
                    (a.status === "running" || a.status === "queued") && (
                      <button
                        onClick={() => setConfirmCancel(a.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                </div>
              </div>

              {/* Log viewer */}
              {expandedId === a.id && (
                <div className="px-5 py-4 bg-[#070a0d]">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-3.5 h-3.5 text-[#394955]" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      AI Planner Execution Log
                    </span>
                    <span className="text-xs text-slate-600 ml-auto">
                      {a.plannerLogs.length} entries
                    </span>
                  </div>
                  <LogViewer logs={a.plannerLogs} autoScroll={a.status === "running"} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
