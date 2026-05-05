// V5/src/components/beta/BetaLayout.tsx
//
// Beta app shell — fixed sidebar + sticky topbar + Outlet for routed views.
// Mounts FileUpload + ForeSightWidget so feature parity with classic Layout.

import { Outlet } from "react-router-dom";
import BetaSidebar from "./Sidebar";
import BetaTopbar from "./Topbar";
import { useAppData } from "@/src/context/AppDataContext";
import FileUpload from "@/src/components/FileUpload";
import { ForeSightWidget } from "@/src/components/foresight/ForeSightWidget";

export default function BetaLayout() {
  const { showUpload, setShowUpload, setShopVisits, setForecasts } = useAppData();

  const handleUploaded = (result: {
    shopVisits: Parameters<typeof setShopVisits>[0];
    forecasts: Parameters<typeof setForecasts>[0];
    warnings?: string[];
  }) => {
    setShopVisits(result.shopVisits);
    setForecasts(result.forecasts);
    if (result.warnings?.length) console.warn("Upload warnings:", result.warnings);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <BetaSidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-[220px]">
        <BetaTopbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <FileUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        isLoading={false}
        onUploaded={handleUploaded}
      />
      <ForeSightWidget />
    </div>
  );
}
