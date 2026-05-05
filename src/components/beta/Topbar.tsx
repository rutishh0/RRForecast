// V5/src/components/beta/Topbar.tsx
//
// Beta topbar — breadcrumb trail + status pill + actions.
// Adapted from new-frontend/components/app/topbar.tsx with V5 routes
// and a "Classic ↔ Beta" toggle bound to LayoutModeContext.

import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Bell, Upload, LogOut, ToggleRight } from "lucide-react";
import { useAppData } from "@/src/context/AppDataContext";
import { useLayoutMode } from "@/src/context/LayoutModeContext";

const TITLES: Record<string, string> = {
  "/my-dashboard": "My Dashboard",
  "/shop-visits": "Shop Visits",
  "/forecast": "Forecast",
  "/engine-map": "Engine Map",
  "/data-editor": "Data Editor",
  "/collaborative": "Collaborative",
  "/profile": "Profile",
  "/foresight": "ForeSight",
  "/admin/feature-requests": "Feature Requests",
  "/admin/users": "User Management",
  "/admin/settings": "Settings",
};

function trailFor(path: string): { label: string; href?: string }[] {
  if (path === "/" || path === "") return [{ label: "Dashboard" }];
  const seg = path.split("/").filter(Boolean);
  if (seg.length === 0) return [{ label: "Dashboard" }];
  // /admin/users → Admin › User Management
  if (seg[0] === "admin" && seg.length >= 2) {
    return [
      { label: "Admin" },
      { label: TITLES[`/admin/${seg[1]}`] ?? seg[1] },
    ];
  }
  const top = "/" + seg[0];
  const head = TITLES[top] ?? seg[0];
  if (seg.length === 1) return [{ label: head }];
  return [{ label: head, href: top }, { label: seg.slice(1).join(" / ") }];
}

export default function BetaTopbar() {
  const { pathname } = useLocation();
  const trail = trailFor(pathname);
  const { setShowUpload, logout } = useAppData();
  const { toggleMode } = useLayoutMode();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-14 border-b border-border bg-surface px-6 flex items-center sticky top-0 z-20">
      <div className="flex items-center gap-1.5 text-[13px] min-w-0">
        {trail.map((node, i) => {
          const last = i === trail.length - 1;
          return (
            <div key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="size-3.5 text-subtle-foreground shrink-0" />}
              {node.href && !last ? (
                <Link to={node.href} className="text-muted-foreground hover:text-foreground truncate">
                  {node.label}
                </Link>
              ) : (
                <span
                  className={
                    last ? "font-medium text-foreground truncate" : "text-muted-foreground truncate"
                  }
                >
                  {node.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 h-7 rounded-md border border-border bg-surface-muted">
          <span className="size-1.5 rounded-full bg-status-healthy animate-pulse" />
          <span className="text-[11px] text-muted-foreground">Live data</span>
          <span className="text-[10px] text-subtle-foreground font-mono ml-1">
            UTC {new Date().toUTCString().slice(17, 22)}
          </span>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface-muted hover:bg-surface-subtle text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          title="Upload workbook"
        >
          <Upload className="size-3.5" /> Upload
        </button>
        <button
          onClick={toggleMode}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-brand/30 bg-brand-bg text-brand text-[12px] font-medium hover:bg-brand/10 transition-colors"
          title="Switch to classic layout"
        >
          <ToggleRight className="size-3.5" />
          <span>Beta</span>
        </button>
        <button
          aria-label="Notifications"
          className="relative size-8 rounded-md hover:bg-surface-subtle flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-status-critical ring-2 ring-surface" />
        </button>
        <button
          aria-label="Sign out"
          onClick={handleLogout}
          className="size-8 rounded-md hover:bg-surface-subtle flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
