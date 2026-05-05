// V5/src/components/auth/LoginScreen.tsx
import { useState } from "react";
import SiteGateForm from "./SiteGateForm";
import CredentialsForm from "./CredentialsForm";
import { authAPI } from "@/src/services/api";
import type { User } from "@/src/types";

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [step, setStep] = useState<"site-code" | "credentials">("site-code");
  const [siteCode, setSiteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGate = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      await authAPI.siteGateCheck(code);
      setSiteCode(code);
      setStep("credentials");
    } catch (e: any) {
      setError("Invalid site code");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.login(siteCode, username, password);
      localStorage.setItem("auth_token", result.token);
      onLogin(result.user);
    } catch (e: any) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-rr-bg-secondary">
      <div className="w-[420px] rounded-xl border border-rr-border bg-rr-card p-8
                      shadow-[0_0_36px_rgba(197,164,78,0.10)]">
        <h1 className="text-lg font-bold text-rr-gold mb-1">RR Forecasting</h1>

        <div className="relative h-[260px] overflow-hidden">
          <SiteGateForm
            visible={step === "site-code"}
            onSubmit={handleGate}
            error={step === "site-code" ? error : null}
            loading={step === "site-code" && loading}
          />
          <CredentialsForm
            visible={step === "credentials"}
            onSubmit={handleLogin}
            error={step === "credentials" ? error : null}
            loading={step === "credentials" && loading}
          />
        </div>
      </div>
    </div>
  );
}
