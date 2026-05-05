// V5/src/components/beta/auth/BetaLoginScreen.tsx
//
// Beta-themed login: same two-layer flow (site code → credentials) but
// rendered in the warm-paper aesthetic with the brand-blue gradient hero.

import { useState, type FormEvent } from "react";
import { Loader2, ArrowRight, LogIn } from "lucide-react";
import { authAPI } from "@/src/services/api";
import type { User } from "@/src/types";
import { cn } from "@/src/lib/utils";

interface Props {
  onLogin: (user: User) => void;
}

export default function BetaLoginScreen({ onLogin }: Props) {
  const [step, setStep] = useState<"site-code" | "credentials">("site-code");
  const [siteCode, setSiteCode] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGate = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await authAPI.siteGateCheck(code.trim());
      setSiteCode(code.trim());
      setStep("credentials");
    } catch {
      setError("Invalid site code");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.login(siteCode, username.trim(), password);
      localStorage.setItem("auth_token", result.token);
      onLogin(result.user);
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-[440px]">
        {/* Branded header */}
        <div className="rounded-t-xl bg-gradient-to-br from-brand to-brand-soft px-7 py-6 text-white">
          <div className="size-9 rounded bg-white/15 ring-1 ring-white/20 flex items-center justify-center text-[12px] font-mono font-semibold tracking-tight mb-3">
            RR
          </div>
          <h1 className="text-[18px] font-semibold tracking-tight leading-tight">RR Forecasting</h1>
          <p className="text-[12px] text-white/75 leading-snug mt-0.5">
            LessorCare Network · Engine portfolio operations
          </p>
        </div>

        {/* Form panel */}
        <div className="rounded-b-xl border border-t-0 border-border bg-card px-7 py-7 shadow-md">
          <div className="relative h-[230px] overflow-hidden">
            {/* Step 1 — site code */}
            <form
              onSubmit={handleGate}
              className={cn(
                "absolute inset-0 transition-all duration-300 ease-out",
                step === "site-code"
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-4 opacity-0 pointer-events-none",
              )}
            >
              <p className="text-[12px] text-muted-foreground mb-5">Enter your access code to continue.</p>
              <label htmlFor="site-code" className="label-tiny mb-2 block">Site access code</label>
              <input
                id="site-code"
                type="password"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                autoComplete="off"
                placeholder="Enter access code"
                className="w-full h-9 px-3 rounded-md bg-surface-muted border border-border text-foreground text-[13px] focus:bg-surface focus:outline-none focus:border-brand"
              />
              {step === "site-code" && error && <p className="text-status-critical text-[11px] mt-2">{error}</p>}
              <button
                type="submit"
                disabled={!code.trim() || loading}
                className="mt-5 w-full h-9 rounded-md bg-brand text-brand-foreground text-[13px] font-medium hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                {loading && step === "site-code" ? (
                  <><Loader2 size={14} className="animate-spin" /> Checking…</>
                ) : (
                  <>Continue <ArrowRight size={14} /></>
                )}
              </button>
            </form>

            {/* Step 2 — credentials */}
            <form
              onSubmit={handleLogin}
              className={cn(
                "absolute inset-0 transition-all duration-300 ease-out",
                step === "credentials"
                  ? "translate-x-0 opacity-100"
                  : "translate-x-4 opacity-0 pointer-events-none",
              )}
            >
              <p className="text-[12px] text-muted-foreground mb-5">Welcome — please sign in.</p>
              <label htmlFor="username" className="label-tiny mb-2 block">Username</label>
              <input
                id="username"
                type="text"
                autoFocus={step === "credentials"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
                className="w-full h-9 px-3 rounded-md bg-surface-muted border border-border text-foreground text-[13px] focus:bg-surface focus:outline-none focus:border-brand"
              />
              <label htmlFor="password" className="label-tiny mt-3 mb-2 block">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                className="w-full h-9 px-3 rounded-md bg-surface-muted border border-border text-foreground text-[13px] focus:bg-surface focus:outline-none focus:border-brand"
              />
              {step === "credentials" && error && <p className="text-status-critical text-[11px] mt-2">{error}</p>}
              <button
                type="submit"
                disabled={!username.trim() || !password || loading}
                className="mt-5 w-full h-9 rounded-md bg-brand text-brand-foreground text-[13px] font-medium hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                {loading && step === "credentials" ? (
                  <><Loader2 size={14} className="animate-spin" /> Signing in…</>
                ) : (
                  <><LogIn size={14} /> Sign in</>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-4 text-center text-[10.5px] text-subtle-foreground">
          Rolls-Royce Civil Aerospace · Customer Operations
        </p>
      </div>
    </div>
  );
}
