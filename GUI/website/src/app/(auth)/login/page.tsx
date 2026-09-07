"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/SessionContext";
import { Shield, Eye, EyeOff, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { login } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = login(username, password);
    setLoading(false);
    if (result.success) {
      router.push("/dashboard/pentest");
    } else {
      setError(result.error ?? "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#394955 1px, transparent 1px), linear-gradient(90deg, #394955 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#394955]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-xl bg-[#394955]/20 border border-[#394955]/40 flex items-center justify-center">
            <Shield className="w-7 h-7 text-[#394955]" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#f8fafc] tracking-tight">AOSL</h1>
            <p className="text-sm text-slate-500 mt-0.5">AI Security Orchestration Layer</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#1e2d3d] bg-[#0f1117] p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#f8fafc]">Sign in to your account</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your operator credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="operator"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#09090b] border border-[#1e2d3d] text-[#f8fafc] placeholder-slate-600 text-sm focus:outline-none focus:border-[#394955] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[#09090b] border border-[#1e2d3d] text-[#f8fafc] placeholder-slate-600 text-sm focus:outline-none focus:border-[#394955] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-sm text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-medium transition-all",
                "bg-[#394955] hover:bg-[#445866] text-[#f8fafc] border border-[#394955]/50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 rounded-lg border border-[#1e2d3d] bg-[#0f1117]/60 p-4">
          <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Demo Credentials</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Admin account</span>
              <code className="text-[#f8fafc] bg-[#09090b] px-2 py-0.5 rounded border border-[#1e2d3d]">
                admin / admin123
              </code>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">User account</span>
              <code className="text-[#f8fafc] bg-[#09090b] px-2 py-0.5 rounded border border-[#1e2d3d]">
                jsmith / pass1234
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
