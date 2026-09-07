"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  MockUser,
  UserRole,
  Permission,
  getUserByUsername,
  updateUser,
} from "@/lib/contents";

interface SessionUser {
  id: string;
  username: string;
  role: UserRole;
  permissions: Permission[];
}

interface SessionContextValue {
  user: SessionUser | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  toggleRole: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const SESSION_KEY = "aosl_session";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>("USER");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { user: SessionUser; activeRole: UserRole };
        setUser(parsed.user);
        setActiveRole(parsed.activeRole);
      }
    } catch {
      // ignore
    }
  }, []);

  const persistSession = useCallback((u: SessionUser, role: UserRole) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: u, activeRole: role }));
  }, []);

  const login = useCallback(
    (username: string, password: string): { success: boolean; error?: string } => {
      const found = getUserByUsername(username);
      if (!found || found.password !== password) {
        return { success: false, error: "Invalid credentials" };
      }
      const sessionUser: SessionUser = {
        id: found.id,
        username: found.username,
        role: found.role,
        permissions: found.permissions,
      };
      setUser(sessionUser);
      setActiveRole(found.role);
      persistSession(sessionUser, found.role);
      return { success: true };
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    setUser(null);
    setActiveRole("USER");
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const toggleRole = useCallback(() => {
    if (!user || user.role !== "ADMIN") return;
    const next: UserRole = activeRole === "ADMIN" ? "USER" : "ADMIN";
    setActiveRole(next);
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...parsed, activeRole: next }));
    }
  }, [user, activeRole]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      if (activeRole === "ADMIN") return true;
      return user.permissions.includes(permission);
    },
    [user, activeRole]
  );

  return (
    <SessionContext.Provider
      value={{ user, activeRole, isAuthenticated: !!user, login, logout, toggleRole, hasPermission }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
