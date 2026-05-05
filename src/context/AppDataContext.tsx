import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { User, ShopVisitRecord, ForecastRecord } from "@/src/types";
import { authAPI, engineDataAPI } from "@/src/services/api";
import { Loader2 } from "lucide-react";

interface AppDataContextValue {
  loading: boolean;
  currentUser: User | null;
  shopVisits: ShopVisitRecord[];
  forecasts: ForecastRecord[];
  error: string | null;

  showUpload: boolean;
  setShowUpload: (b: boolean) => void;

  setShopVisits: (rows: ShopVisitRecord[]) => void;
  setForecasts: (rows: ForecastRecord[]) => void;
  setCurrentUser: (user: User | null) => void;

  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shopVisits, setShopVisits] = useState<ShopVisitRecord[]>([]);
  const [forecasts, setForecasts] = useState<ForecastRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) { setLoading(false); return; }
      try {
        const [authResult, engineResult] = await Promise.allSettled([
          authAPI.check(),
          engineDataAPI.get(),
        ]);
        if (authResult.status === "rejected" || !authResult.value.authenticated) {
          localStorage.removeItem("auth_token");
          setLoading(false);
          return;
        }
        setCurrentUser(authResult.value.user!);
        if (engineResult.status === "fulfilled") {
          setShopVisits(engineResult.value.shopVisits);
          setForecasts(engineResult.value.forecasts);
        } else {
          setError("Could not load engine data — try uploading the latest workbook.");
        }
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const login = useCallback(async (user: User) => {
    setCurrentUser(user);
    try {
      const engine = await engineDataAPI.get();
      setShopVisits(engine.shopVisits);
      setForecasts(engine.forecasts);
    } catch {
      setError("Could not load engine data — try uploading the latest workbook.");
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* best-effort */ }
    localStorage.removeItem("auth_token");
    setCurrentUser(null);
    setShopVisits([]);
    setForecasts([]);
    setError(null);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-rr-bg-secondary">
        <div className="text-center">
          <Loader2 size={32} className="text-rr-gold animate-spin mx-auto mb-4" />
          <p className="text-sm text-rr-text-dim">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AppDataContext.Provider value={{
      loading, currentUser, shopVisits, forecasts, error,
      showUpload, setShowUpload,
      setShopVisits, setForecasts, setCurrentUser,
      login, logout,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be inside <AppDataProvider>");
  return ctx;
}
