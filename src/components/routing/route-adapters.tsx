import { useAppData } from "@/src/context/AppDataContext";
import PersonalDashboard from "@/src/components/PersonalDashboard";
import ShopVisitTracker from "@/src/components/ShopVisitTracker";
import EngineForecast from "@/src/components/EngineForecast";
import EngineMap from "@/src/components/EngineMap";
import DataEditor from "@/src/components/DataEditor";
import CollaborativeDashboard from "@/src/components/CollaborativeDashboard";
import UserProfile from "@/src/components/UserProfile";
import FeatureRequestAdmin from "@/src/components/FeatureRequestAdmin";
import UserManagement from "@/src/components/UserManagement";
import { Upload, ArrowRight, FileSpreadsheet } from "lucide-react";

function WelcomeScreen() {
  const { setShowUpload } = useAppData();
  return (
    <div className="flex items-center justify-center h-full -mt-12">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rr-gold/10 border border-rr-gold/30 mb-6">
          <FileSpreadsheet size={32} className="text-rr-gold" />
        </div>
        <h2 className="text-xl font-bold text-rr-text mb-2">No engine data yet</h2>
        <p className="text-sm text-rr-text-dim mb-6">
          Upload your shop visit workbook to get started. The data persists on the server.
        </p>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-semibold
            bg-rr-gold text-rr-bg-secondary hover:bg-rr-gold-bright transition-colors"
        >
          <Upload size={14} /> Upload Workbook <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function PersonalDashboardRoute() {
  const { currentUser } = useAppData();
  // The original PersonalDashboard accepts an onViewChange prop for clicking links to
  // other views. After A2 it's no longer needed — children use react-router <Link>s.
  // Pass a no-op for the migration; the PersonalDashboard internals get updated in Task 10.
  return <PersonalDashboard currentUser={currentUser!} onViewChange={() => {}} />;
}

export function ShopVisitsRoute() {
  const { shopVisits } = useAppData();
  if (shopVisits.length === 0) return <WelcomeScreen />;
  return <ShopVisitTracker data={shopVisits} />;
}

export function ForecastRoute() {
  const { forecasts } = useAppData();
  if (forecasts.length === 0) return <WelcomeScreen />;
  return <EngineForecast data={forecasts} />;
}

export function EngineMapRoute() {
  const { shopVisits } = useAppData();
  if (shopVisits.length === 0) return <WelcomeScreen />;
  return <EngineMap shopVisits={shopVisits} />;
}

export function DataEditorRoute() {
  const { shopVisits, forecasts, setShopVisits, setForecasts } = useAppData();
  if (shopVisits.length === 0 && forecasts.length === 0) return <WelcomeScreen />;
  return (
    <DataEditor
      shopVisits={shopVisits}
      forecasts={forecasts}
      onShopVisitsChange={setShopVisits}
      onForecastsChange={setForecasts}
    />
  );
}

export function CollaborativeRoute() {
  const { currentUser, shopVisits, forecasts } = useAppData();
  return <CollaborativeDashboard currentUser={currentUser!} shopVisits={shopVisits} forecasts={forecasts} />;
}

export function ProfileRoute() {
  const { currentUser, setCurrentUser } = useAppData();
  return <UserProfile currentUser={currentUser!} onUserUpdate={setCurrentUser} />;
}

export function FeatureRequestAdminRoute() {
  const { currentUser } = useAppData();
  return <FeatureRequestAdmin currentUser={currentUser!} />;
}

export function UserManagementRoute() {
  const { currentUser } = useAppData();
  return <UserManagement currentUser={currentUser!} />;
}
