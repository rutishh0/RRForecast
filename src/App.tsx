// V5/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppDataProvider } from "@/src/context/AppDataContext";
import { ForeSightProvider } from "@/src/context/ForeSightContext";
import { LayoutModeProvider } from "@/src/context/LayoutModeContext";
import LayoutSwitcher from "@/src/components/routing/LayoutSwitcher";
import { RequireAuth, RequireAdmin, LoginRoute } from "@/src/components/routing/guards";
import {
  PersonalDashboardRoute,
  ShopVisitsRoute,
  ForecastRoute,
  EngineMapRoute,
  DataEditorRoute,
  CollaborativeRoute,
  ProfileRoute,
  FeatureRequestAdminRoute,
  UserManagementRoute,
} from "@/src/components/routing/route-adapters";
import ForeSightPage from "@/src/pages/ForeSightPage";
import SettingsPage from "@/src/pages/admin/SettingsPage";
import BetaPipelinePage from "@/src/pages/beta/PipelinePage";
import BetaFinancialsPage from "@/src/pages/beta/FinancialsPage";

export default function App() {
  return (
    <BrowserRouter>
      <LayoutModeProvider>
        <AppDataProvider>
          <ForeSightProvider>
            <Routes>
              <Route path="/login" element={<LoginRoute />} />
              <Route element={<RequireAuth><LayoutSwitcher /></RequireAuth>}>
                <Route index element={<Navigate to="/my-dashboard" replace />} />
                <Route path="/my-dashboard"           element={<PersonalDashboardRoute />} />
                <Route path="/shop-visits"            element={<ShopVisitsRoute />} />
                <Route path="/forecast"               element={<ForecastRoute />} />
                <Route path="/engine-map"             element={<EngineMapRoute />} />
                <Route path="/data-editor"            element={<DataEditorRoute />} />
                <Route path="/collaborative"          element={<CollaborativeRoute />} />
                <Route path="/profile"                element={<ProfileRoute />} />
                <Route path="/foresight"              element={<ForeSightPage />} />
                <Route path="/pipeline"               element={<BetaPipelinePage />} />
                <Route path="/financials"             element={<BetaFinancialsPage />} />
                <Route path="/admin/feature-requests" element={<RequireAdmin><FeatureRequestAdminRoute /></RequireAdmin>} />
                <Route path="/admin/users"            element={<RequireAdmin><UserManagementRoute /></RequireAdmin>} />
                <Route path="/admin/settings"         element={<RequireAdmin><SettingsPage /></RequireAdmin>} />
                <Route path="*"                       element={<Navigate to="/my-dashboard" replace />} />
              </Route>
            </Routes>
          </ForeSightProvider>
        </AppDataProvider>
      </LayoutModeProvider>
    </BrowserRouter>
  );
}
