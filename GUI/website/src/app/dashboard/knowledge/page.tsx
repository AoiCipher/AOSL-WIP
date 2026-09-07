"use client";

import { useState, useMemo } from "react";
import {
  Database,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Tag,
  ShieldAlert,
  BookOpen,
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import {
  getKnowledgeBase,
  createKnowledgeEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
  type KnowledgeEntry,
} from "@/lib/contents";
import { cn } from "@/lib/utils";

function KnowledgeFormModal({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: KnowledgeEntry | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(", ") ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    if (initial) {
      updateKnowledgeEntry(initial.id, { name: name.trim(), description: description.trim(), tags });
    } else {
      createKnowledgeEntry({ name: name.trim(), description: description.trim(), tags });
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-[#1e2d3d] bg-[#0f1117] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d3d]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#394955]" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-[#f8fafc]">
              {initial ? "Edit Knowledge Entry" : "Add Knowledge Entry"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-[#f8fafc] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SQL Injection Payload Library"
              className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#1e2d3d] text-[#f8fafc] placeholder-slate-600 text-sm focus:outline-none focus:border-[#394955] transition-colors"
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the knowledge content, payloads, techniques, or guidelines..."
              rows={5}
              className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#1e2d3d] text-[#f8fafc] placeholder-slate-600 text-sm focus:outline-none focus:border-[#394955] transition-colors resize-none"
            />
            {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Tags <span className="text-slate-600 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. injection, web, owasp"
              className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#1e2d3d] text-[#f8fafc] placeholder-slate-600 text-sm focus:outline-none focus:border-[#394955] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1e2d3d]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-[#f8fafc] hover:bg-[#1e2d3d]/50 border border-[#1e2d3d] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#394955] hover:bg-[#445866] text-white transition-colors"
          >
            {initial ? "Save Changes" : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  open,
  name,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-[#1e2d3d] bg-[#0f1117] p-6 shadow-2xl">
        <h3 className="text-sm font-semibold text-[#f8fafc] mb-2">Delete Knowledge Entry</h3>
        <p className="text-sm text-slate-400 mb-1">
          Are you sure you want to delete:
        </p>
        <p className="text-sm font-medium text-[#f8fafc] mb-5">"{name}"</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm border border-[#1e2d3d] text-slate-400 hover:text-[#f8fafc] hover:bg-[#1e2d3d]/50 transition-colors">Keep</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg text-sm bg-rose-950 border border-rose-500/40 text-rose-400 hover:bg-rose-900/60 transition-colors font-medium">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  const { hasPermission } = useSession();
  const [entries, setEntries] = useState(() => getKnowledgeBase());
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<KnowledgeEntry | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(entries[0]?.id ?? null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => {
    setEntries(getKnowledgeBase());
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [entries, search]);

  const selected = useMemo(() => entries.find((e) => e.id === selectedId), [entries, selectedId]);

  const handleDeleted = () => {
    if (deletingEntry) {
      deleteKnowledgeEntry(deletingEntry.id);
      refresh();
      showToast("Entry deleted.");
      if (selectedId === deletingEntry.id) setSelectedId(getKnowledgeBase()[0]?.id ?? null);
      setDeletingEntry(null);
    }
  };

  const canAdd = hasPermission("can_add_knowledge");
  const canEdit = hasPermission("can_edit_knowledge");
  const canDelete = hasPermission("can_delete_knowledge");

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-sm shadow-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {toast}
        </div>
      )}

      <KnowledgeFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingEntry(null); }}
        onSaved={() => {
          const updated = getKnowledgeBase();
          setEntries(updated);
          if (!editingEntry && updated[0]) setSelectedId(updated[0].id);
          showToast(editingEntry ? "Entry updated." : "Entry added.");
        }}
        initial={editingEntry}
      />

      <ConfirmDeleteModal
        open={!!deletingEntry}
        name={deletingEntry?.name ?? ""}
        onClose={() => setDeletingEntry(null)}
        onConfirm={handleDeleted}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f8fafc]">Knowledge Database</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {entries.length} entries — security vectors, payloads, and AI planner guidelines
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => { setEditingEntry(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#394955] hover:bg-[#445866] text-white text-sm font-medium transition-colors border border-[#394955]/50"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left: list */}
        <div className="flex flex-col rounded-xl border border-[#1e2d3d] bg-[#0f1117] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e2d3d]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#09090b] border border-[#1e2d3d] text-[#f8fafc] placeholder-slate-600 text-xs focus:outline-none focus:border-[#394955] transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#1e2d3d]">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-600">No matching entries.</div>
            )}
            {filtered.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedId(entry.id)}
                className={cn(
                  "w-full text-left px-4 py-3.5 transition-colors block",
                  selectedId === entry.id
                    ? "bg-[#394955]/15 border-l-2 border-[#394955]"
                    : "hover:bg-[#1e2d3d]/30 border-l-2 border-transparent"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-medium text-[#f8fafc] leading-snug truncate">{entry.name}</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {entry.description}
                </div>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-[#394955]/20 text-[#394955] border border-[#394955]/20"
                      >
                        {tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="text-[9px] text-slate-600">+{entry.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: detail */}
        <div className="rounded-xl border border-[#1e2d3d] bg-[#0f1117] overflow-hidden flex flex-col">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#1e2d3d]">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[#394955] shrink-0" strokeWidth={1.5} />
                  <h2 className="text-sm font-semibold text-[#f8fafc] leading-snug">{selected.name}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && (
                    <button
                      onClick={() => { setEditingEntry(selected); setShowForm(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-[#f8fafc] hover:bg-[#1e2d3d]/50 border border-[#1e2d3d] transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeletingEntry(selected)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mb-2">Description</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{selected.description}</p>
                </div>

                {selected.tags.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#394955]/20 text-[#394955] border border-[#394955]/20"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#1e2d3d] flex items-center gap-6 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-500 mr-1">Created:</span>
                    {new Date(selected.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div>
                    <span className="text-slate-500 mr-1">Updated:</span>
                    {new Date(selected.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <Database className="w-10 h-10 text-slate-700" strokeWidth={1} />
              <div className="text-sm text-slate-600">Select an entry to view details</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
