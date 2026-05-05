// V5/src/App.tsx
import { useState, useCallback, useEffect } from "react";
import type { ActiveView, ShopVisitRecord, ForecastRecord, User } from "@/src/types";
import Layout from "@/src/components/Layout";
import FileUpload from "@/src/components/FileUpload";
import ShopVisitTracker from "@/src/components/ShopVisitTracker";
import EngineForecast from "@/src/components/EngineForecast";
import DataEditor from "@/src/components/DataEditor";
import EngineMap from "@/src/components/EngineMap";
import LoginScreen from "@/src/components/auth/LoginScreen";
import PersonalDashboard from "@/src/components/PersonalDashboard";
import CollaborativeDashboard from "@/src/components/CollaborativeDashboard";
import UserProfile from "@/src/components/UserProfile";
import FeatureRequestAdmin from "@/src/components/FeatureRequestAdmin";
import UserManagement from "@/src/components/UserManagement";
import { authAPI, engineDataAPI } from "@/src/services/api";
import { FileSpreadsheet, Upload, ArrowRight, Loader2 } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("my-dashboard");
  const [shopVisits, setShopVisits] = useState<ShopVisitRecord[]>([]);
  const [forecasts, setForecasts] = useState<ForecastRecord[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasData = shopVisits.length > 0 || forecasts.length > 0;

  // Boot: check auth + fetch engine data in parallel
  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const [authResult, engineResult] = await Promise.allSettled([
          authAPI.check(),
          engineDataAPI.get(),
        ]);

        if (authResult.status === "rejected" || !authResult.value.authenticated) {
          localStorage.removeItem("auth_token");
          setAuthLoading(false);
          return;
        }
        setCurrentUser(authResult.value.user!);

        if (engineResult.status === "fulfilled") {
          setShopVisits(engineResult.value.shopVisits);
          setForecasts(engineResult.value.forecasts);
        } else {
          setError("Could not load engine data. Try uploading the latest workbook.");
        }
      } finally {
        setAuthLoading(false);
      }
    };
    boot();
  }, []);

  const handleLogin = useCallback(async (user: User) => {
    setCurrentUser(user);
    setActiveView("my-dashboard");
    // Fetch engine data after login
    try {
      const engine = await engineDataAPI.get();
      setShopVisits(engine.shopVisits);
      setForecasts(engine.forecasts);
    } catch {
      setError("Could not load engine data. Try uploading the latest workbook.");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    localStorage.removeItem("auth_token");
    setCurrentUser(null);
    setActiveView("my-dashboard");
    setShopVisits([]);
    setForecasts([]);
    setError(null);
  }, []);

  const handleUploaded = useCallback((result: { shopVisits: ShopVisitRecord[]; forecasts: ForecastRecord[]; warnings?: string[] }) => {
    setShopVisits(result.shopVisits);
    setForecasts(result.forecasts);
    if (result.warnings?.length) {
      console.warn("Upload warnings:", result.warnings);
    }
  }, []);

  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-rr-bg-secondary">
        <div className="text-center">
          <Loader2 size={32} className="text-rr-gold animate-spin mx-auto mb-4" />
          <p className="text-sm text-rr-text-dim">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (activeView) {
      case "my-dashboard":            return <PersonalDashboard currentUser={currentUser} onViewChange={setActiveView} />;
      case "shop-visits":             return hasData ? <ShopVisitTracker data={shopVisits} /> : <WelcomeScreen onUpload={() => setShowUpload(true)} />;
      case "forecast":                return hasData ? <EngineForecast data={forecasts} /> : <WelcomeScreen onUpload={() => setShowUpload(true)} />;
      case "engine-map":              return hasData ? <EngineMap shopVisits={shopVisits} /> : <WelcomeScreen onUpload={() => setShowUpload(true)} />;
      case "data-editor":             return hasData ? (
        <DataEditor shopVisits={shopVisits} forecasts={forecasts} onShopVisitsChange={setShopVisits} onForecastsChange={setForecasts} />
      ) : <WelcomeScreen onUpload={() => setShowUpload(true)} />;
      case "collaborative":           return <CollaborativeDashboard currentUser={currentUser} shopVisits={shopVisits} forecasts={forecasts} />;
      case "profile":                 return <UserProfile currentUser={currentUser} onUserUpdate={setCurrentUser} />;
      case "feature-requests-admin":  return <FeatureRequestAdmin currentUser={currentUser} />;
      case "user-management":         return <UserManagement currentUser={currentUser} />;
      default:                        return <PersonalDashboard currentUser={currentUser} onViewChange={setActiveView} />;
    }
  };

  return (
    <>
      <Layout
        activeView={activeView}
        onViewChange={setActiveView}
        onUploadClick={() => setShowUpload(true)}
        onLogout={handleLogout}
        hasData={hasData}
        currentUser={currentUser}
      >
        {error && (
          <div className="mb-4 p-4 rounded bg-rr-danger-bg border border-rr-danger-border">
            <p className="text-sm text-rr-danger">{error}</p>
          </div>
        )}
        {renderView()}
      </Layout>

      <FileUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        isLoading={false}
        onUploaded={handleUploaded}
      />
    </>
  );
}

function WelcomeScreen({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex items-center justify-center h-full -mt-12">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rr-gold/10 border border-rr-gold/30 mb-6">
          <FileSpreadsheet size={32} className="text-rr-gold" />
        </div>
        <h2 className="text-xl font-bold text-rr-text mb-2">No engine data yet</h2>
        <p className="text-sm text-rr-text-dim mb-6">
          Upload your shop visit workbook to get started. The data persists on the server,
          so you only need to re-upload when it changes.
        </p>
        <button
          onClick={onUpload}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-semibold
            bg-rr-gold text-rr-bg-secondary hover:bg-rr-gold-bright transition-colors"
        >
          <Upload size={14} /> Upload Workbook <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
