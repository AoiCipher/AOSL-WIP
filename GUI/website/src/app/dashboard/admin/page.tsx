"use client";

import { useState, useMemo } from "react";
import {
  UserPlus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  ShieldAlert,
  Users,
  LayoutGrid,
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type MockUser,
  type UserRole,
  type Permission,
  ALL_PERMISSIONS,
} from "@/lib/contents";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
        role === "ADMIN"
          ? "text-rose-400 bg-rose-400/10 border-rose-400/30"
          : "text-[#394955] bg-[#394955]/10 border-[#394955]/30"
      )}
    >
      {role}
    </span>
  );
}

// ─── User Form Modal ───────────────────────────────────────────────────────────

function UserFormModal({
  open,
  onClose,
  onSaved,
  initial,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: MockUser | null;
  currentUserId: string;
}) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [role, setRole] = useState<UserRole>(initial?.role ?? "USER");
  const [permissions, setPermissions] = useState<Permission[]>(
    initial?.permissions ?? ["can_create_assessments", "can_view_findings"]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "Username is required";
    if (!initial && !password.trim()) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const togglePermission = (p: Permission) => {
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSave = () => {
    if (!validate()) return;
    if (initial) {
      updateUser(initial.id, {
        username: username.trim(),
        ...(password.trim() ? { password: password.trim() } : {}),
        role,
        permissions,
      });
    } else {
      createUser({ username: username.trim(), password: password.trim(), role, permissions });
    }
    onSaved();
    onClose();
  };

  const selectablePermissions = role === "ADMIN"
    ? ALL_PERMISSIONS
    : ALL_PERMISSIONS.filter((p) => p.key !== "can_manage_users");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-[#1e2d3d] bg-[#0f1117] shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d3d]">
          <h2 className="text-sm font-semibold text-[#f8fafc]">
            {initial ? "Edit User" : "Add User"}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-[#f8fafc] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Username <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="operator_name"
                disabled={!!initial && initial.id === currentUserId}
                className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#1e2d3d] text-[#f8fafc] placeholder-slate-600 text-sm focus:outline-none focus:border-[#394955] transition-colors disabled:opacity-50"
              />
              {errors.username && <p className="text-xs text-rose-400 mt-1">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password {initial && <span className="text-slate-600 font-normal">(leave blank to keep)</span>}
                {!initial && <span className="text-rose-400"> *</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={initial ? "••••••••" : "new_password"}
                className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#1e2d3d] text-[#f8fafc] placeholder-slate-600 text-sm focus:outline-none focus:border-[#394955] transition-colors"
              />
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
            <div className="flex gap-2">
              {(["ADMIN", "USER"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  disabled={!!initial && initial.id === currentUserId}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                    role === r
                      ? r === "ADMIN"
                        ? "bg-rose-950 border-rose-500/40 text-rose-400"
                        : "bg-[#394955]/20 border-[#394955]/50 text-[#394955]"
                      : "bg-[#09090b] border-[#1e2d3d] text-slate-500 hover:border-[#394955]/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Permissions</label>
            <div className="space-y-2">
              {selectablePermissions.map((p) => {
                const active = permissions.includes(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => togglePermission(p.key)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all text-xs",
                      active
                        ? "bg-[#394955]/10 border-[#394955]/40 text-[#f8fafc]"
                        : "bg-[#09090b] border-[#1e2d3d] text-slate-400 hover:border-[#394955]/20"
                    )}
                  >
                    <div>
                      <div className="font-medium">{p.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.description}</div>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded border shrink-0 flex items-center justify-center ml-3",
                      active ? "bg-[#394955] border-[#394955]" : "border-slate-600"
                    )}>
                      {active && <span className="text-white text-[9px]">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
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
            {initial ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState(() => getUsers());
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<MockUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => setUsers(getUsers());
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteUser(deletingUser.id);
    refresh();
    showToast("User deleted.");
    setDeletingUser(null);
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-sm shadow-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{toast}
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeletingUser(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#1e2d3d] bg-[#0f1117] p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-[#f8fafc] mb-2">Delete User</h3>
            <p className="text-sm text-slate-400 mb-5">
              Are you sure you want to delete <span className="text-[#f8fafc] font-medium">{deletingUser.username}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingUser(null)} className="flex-1 py-2 rounded-lg text-sm border border-[#1e2d3d] text-slate-400 hover:text-[#f8fafc] transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 rounded-lg text-sm bg-rose-950 border border-rose-500/40 text-rose-400 hover:bg-rose-900/60 transition-colors font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      <UserFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingUser(null); }}
        onSaved={() => { refresh(); showToast(editingUser ? "User updated." : "User created."); }}
        initial={editingUser}
        currentUserId={currentUserId}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{users.length} operator accounts</div>
        <button
          onClick={() => { setEditingUser(null); setShowForm(true); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#394955] hover:bg-[#445866] text-white text-xs font-medium transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add User
        </button>
      </div>

      <div className="rounded-xl border border-[#1e2d3d] bg-[#0f1117] overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_1fr_130px_100px] gap-4 px-5 py-3 border-b border-[#1e2d3d] bg-[#09090b]">
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Username</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Role</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Permissions</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Created</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">Actions</div>
        </div>
        <div className="divide-y divide-[#1e2d3d]">
          {users.map((u) => (
            <div key={u.id} className="grid grid-cols-[1fr_80px_1fr_130px_100px] gap-4 px-5 py-3.5 items-center hover:bg-[#1e2d3d]/20 transition-colors">
              <div>
                <div className="text-sm font-medium text-[#f8fafc]">{u.username}</div>
                {u.id === currentUserId && <div className="text-[10px] text-[#394955] mt-0.5">You</div>}
              </div>
              <div><RoleBadge role={u.role} /></div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500 truncate">
                  {u.permissions.length === 0
                    ? "No permissions"
                    : u.permissions.map((p) => ALL_PERMISSIONS.find((ap) => ap.key === p)?.label ?? p).join(", ")}
                </div>
              </div>
              <div className="text-xs text-slate-600">
                {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditingUser(u); setShowForm(true); }}
                  className="p-1.5 rounded text-slate-500 hover:text-[#f8fafc] hover:bg-[#1e2d3d]/50 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => u.id !== currentUserId && setDeletingUser(u)}
                  disabled={u.id === currentUserId}
                  className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Access Matrix Tab ─────────────────────────────────────────────────

function FeatureMatrixTab({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState(() => getUsers());
  const [dirty, setDirty] = useState<Record<string, Permission[]>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const handleToggle = (userId: string, perm: Permission, currentPerms: Permission[]) => {
    const existing = dirty[userId] ?? [...currentPerms];
    const updated = existing.includes(perm)
      ? existing.filter((p) => p !== perm)
      : [...existing, perm];
    setDirty((d) => ({ ...d, [userId]: updated }));
  };

  const handleSave = (userId: string, originalPerms: Permission[]) => {
    const perms = dirty[userId] ?? originalPerms;
    updateUser(userId, { permissions: perms });
    setUsers(getUsers());
    setDirty((d) => { const n = { ...d }; delete n[userId]; return n; });
    setSaved((s) => ({ ...s, [userId]: true }));
    setTimeout(() => setSaved((s) => { const n = { ...s }; delete n[userId]; return n; }), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500">
        Configure granular feature access for each operator. Admins always have full access.
      </div>

      <div className="rounded-xl border border-[#1e2d3d] bg-[#0f1117] overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-[#1e2d3d] bg-[#09090b]">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                User
              </th>
              {ALL_PERMISSIONS.filter((p) => p.key !== "can_manage_users").map((p) => (
                <th key={p.key} className="px-3 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-medium text-center">
                  <div className="writing-mode-vertical" style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", height: "80px", display: "flex", alignItems: "center" }}>
                    {p.label}
                  </div>
                </th>
              ))}
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-medium text-right">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2d3d]">
            {users.map((u) => {
              const effectivePerms = dirty[u.id] ?? u.permissions;
              const isDirty = !!dirty[u.id];
              const isCurrentUser = u.id === currentUserId;
              return (
                <tr key={u.id} className={cn("hover:bg-[#1e2d3d]/20 transition-colors", isDirty && "bg-[#394955]/5")}>
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-[#f8fafc]">{u.username}</div>
                    <RoleBadge role={u.role} />
                  </td>
                  {ALL_PERMISSIONS.filter((p) => p.key !== "can_manage_users").map((p) => {
                    const isAdmin = u.role === "ADMIN";
                    const hasIt = isAdmin || effectivePerms.includes(p.key);
                    return (
                      <td key={p.key} className="px-3 py-3 text-center">
                        <button
                          onClick={() => !isAdmin && handleToggle(u.id, p.key, u.permissions)}
                          disabled={isAdmin}
                          className={cn(
                            "w-5 h-5 rounded border transition-all mx-auto flex items-center justify-center",
                            hasIt
                              ? isAdmin
                                ? "bg-slate-700 border-slate-600 text-slate-400 cursor-default"
                                : "bg-[#394955] border-[#394955] text-white"
                              : "bg-transparent border-slate-700 hover:border-[#394955]/50",
                            "disabled:cursor-default"
                          )}
                        >
                          {hasIt && <span className="text-[9px]">✓</span>}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-5 py-3 text-right">
                    {saved[u.id] ? (
                      <span className="flex items-center justify-end gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />Saved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSave(u.id, u.permissions)}
                        disabled={!isDirty || u.role === "ADMIN"}
                        className={cn(
                          "px-3 py-1 rounded text-xs font-medium transition-all border",
                          isDirty && u.role !== "ADMIN"
                            ? "bg-[#394955] border-[#394955]/50 text-white hover:bg-[#445866]"
                            : "bg-transparent border-[#1e2d3d] text-slate-600 cursor-not-allowed"
                        )}
                      >
                        Save
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Admin Panel Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, activeRole } = useSession();
  const [tab, setTab] = useState<"users" | "matrix">("users");

  if (activeRole !== "ADMIN") {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="w-12 h-12 text-slate-700" strokeWidth={1} />
        <div className="text-center">
          <div className="text-base font-semibold text-slate-400">Admin Access Required</div>
          <div className="text-sm text-slate-600 mt-1">This section is restricted to administrators.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#f8fafc]">Admin Panel</h1>
        <p className="text-sm text-slate-500 mt-0.5">User management and feature access configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0f1117] border border-[#1e2d3d] w-fit">
        <button
          onClick={() => setTab("users")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            tab === "users"
              ? "bg-[#394955]/20 text-[#f8fafc] border border-[#394955]/30"
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Users className="w-4 h-4" />
          Users
        </button>
        <button
          onClick={() => setTab("matrix")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            tab === "matrix"
              ? "bg-[#394955]/20 text-[#f8fafc] border border-[#394955]/30"
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          Feature Access Matrix
        </button>
      </div>

      {tab === "users" ? (
        <UsersTab currentUserId={user?.id ?? ""} />
      ) : (
        <FeatureMatrixTab currentUserId={user?.id ?? ""} />
      )}
    </div>
  );
}
