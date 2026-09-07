"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Clock,
  Bug,
  Database,
  Settings,
  LogOut,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  User,
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/pentest", label: "Pentest", icon: Shield },
  { href: "/dashboard/history", label: "History", icon: Clock },
  { href: "/dashboard/findings", label: "Total Findings", icon: Bug },
  { href: "/dashboard/knowledge", label: "Knowledge Database", icon: Database },
];

const ADMIN_ITEMS = [
  { href: "/dashboard/admin", label: "Admin Panel", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activeRole, logout, toggleRole } = useSession();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#09090b] border-r border-[#1e2d3d] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1e2d3d]">
        <div className="w-8 h-8 rounded-lg bg-[#394955]/20 border border-[#394955]/40 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-[#394955]" strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-sm font-bold text-[#f8fafc] tracking-tight">AOSL</div>
          <div className="text-[10px] text-slate-500 leading-none">Security Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="mb-1 px-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
            Workspace
          </span>
        </div>

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group",
                isActive
                  ? "bg-[#394955]/20 text-[#f8fafc] border border-[#394955]/30"
                  : "text-slate-400 hover:text-[#f8fafc] hover:bg-[#1e2d3d]/50"
              )}
            >
              <Icon
                className={cn("w-4 h-4 shrink-0", isActive ? "text-[#394955]" : "text-slate-500 group-hover:text-slate-300")}
                strokeWidth={1.5}
              />
              <span className="truncate">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-slate-500" />}
            </Link>
          );
        })}

        {/* Admin section */}
        {activeRole === "ADMIN" && (
          <>
            <div className="mt-4 mb-1 px-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                Administration
              </span>
            </div>
            {ADMIN_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group",
                    isActive
                      ? "bg-[#394955]/20 text-[#f8fafc] border border-[#394955]/30"
                      : "text-slate-400 hover:text-[#f8fafc] hover:bg-[#1e2d3d]/50"
                  )}
                >
                  <Icon
                    className={cn("w-4 h-4 shrink-0", isActive ? "text-[#394955]" : "text-slate-500 group-hover:text-slate-300")}
                    strokeWidth={1.5}
                  />
                  <span className="truncate">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto text-slate-500" />}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#1e2d3d] px-3 py-4 space-y-2">
        {/* Role toggle for admins */}
        {user?.role === "ADMIN" && (
          <button
            onClick={toggleRole}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#0f1117] border border-[#1e2d3d] hover:border-[#394955]/50 transition-colors text-xs"
          >
            <div className="flex items-center gap-2">
              {activeRole === "ADMIN" ? (
                <ToggleRight className="w-4 h-4 text-[#394955]" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-slate-300">
                View as:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    activeRole === "ADMIN" ? "text-rose-400" : "text-[#394955]"
                  )}
                >
                  {activeRole}
                </span>
              </span>
            </div>
          </button>
        )}

        {/* User info */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#0f1117] border border-[#1e2d3d]">
          <div className="w-7 h-7 rounded-full bg-[#394955]/30 border border-[#394955]/40 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-[#394955]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[#f8fafc] truncate">{user?.username}</div>
            <div className="text-[10px] text-slate-500">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-rose-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
