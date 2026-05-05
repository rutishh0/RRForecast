// V5/src/components/beta/Sidebar.tsx
//
// Beta sidebar — adapted from new-frontend/components/app/sidebar.tsx.
// Differences vs the v0 source:
//   - next/link → react-router-dom Link
//   - usePathname → useLocation
//   - Nav items match V5's actual routes (with admin section gated by role)

import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  LineChart,
  PenSquare,
  MapPin,
  Users,
  User as UserIcon,
  Sparkles,
  Star,
  Settings,
  Search,
  Workflow,
  Wallet,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAppData } from "@/src/context/AppDataContext";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: { label: string; items: NavItem[]; admin?: boolean }[] = [
  {
    label: "Operate",
    items: [
      { label: "Dashboard", to: "/my-dashboard", icon: LayoutDashboard },
      { label: "Shop Visits", to: "/shop-visits", icon: Wrench },
      { label: "Pipeline", to: "/pipeline", icon: Workflow },
      { label: "Engine Map", to: "/engine-map", icon: MapPin },
    ],
  },
  {
    label: "Plan",
    items: [
      { label: "Forecast", to: "/forecast", icon: LineChart },
      { label: "Financials", to: "/financials", icon: Wallet },
      { label: "Data Editor", to: "/data-editor", icon: PenSquare },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Collaborative", to: "/collaborative", icon: Users },
      { label: "ForeSight", to: "/foresight", icon: Sparkles },
      { label: "Profile", to: "/profile", icon: UserIcon },
    ],
  },
  {
    label: "Admin",
    admin: true,
    items: [
      { label: "Feature Requests", to: "/admin/feature-requests", icon: Star },
      { label: "User Management", to: "/admin/users", icon: Users },
      { label: "Settings", to: "/admin/settings", icon: Settings },
    ],
  },
];

export default function BetaSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { currentUser } = useAppData();

  const initials = (currentUser?.displayName ?? currentUser?.username ?? "??")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const visibleSections = SECTIONS.filter((s) => !s.admin || currentUser?.role === "admin");

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] border-r border-border bg-surface flex flex-col z-30">
      {/* Workspace header */}
      <div className="h-14 px-4 flex items-center gap-2.5 border-b border-border bg-gradient-to-br from-brand to-brand-soft">
        <div className="size-7 rounded bg-white/15 backdrop-blur-sm text-white flex items-center justify-center shrink-0 ring-1 ring-white/20">
          <span className="font-mono text-[11px] font-semibold tracking-tight">RR</span>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium leading-tight truncate text-white">RR Forecasting</div>
          <div className="text-[10.5px] text-white/70 leading-tight truncate">LessorCare Network</div>
        </div>
      </div>

      {/* Search (placeholder — wire to real command palette later) */}
      <div className="px-3 pt-3 pb-1">
        <button
          type="button"
          className="w-full h-8 px-2.5 rounded border border-border bg-surface-muted hover:bg-surface-subtle text-[12px] text-muted-foreground flex items-center gap-2 transition-colors"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="font-mono text-[10px] text-subtle-foreground border border-border rounded px-1 py-0.5 bg-surface">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto scroll-thin">
        {visibleSections.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-2 mb-1 label-tiny">{section.label}</div>
            <ul className="space-y-px">
              {section.items.map((item) => {
                const active =
                  pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 px-2 h-7 rounded-md text-[13px] transition-colors relative",
                        active
                          ? "bg-brand-bg text-brand font-semibold"
                          : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-brand" />
                      )}
                      <Icon className={cn("size-3.5 shrink-0", active && "text-brand")} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — current user */}
      <div className="border-t border-border px-3 py-2.5 flex items-center gap-2.5">
        <div
          className="size-6 rounded-full text-white flex items-center justify-center font-mono text-[10px] font-medium ring-2 ring-surface"
          style={{
            background: currentUser?.avatarColor ?? "linear-gradient(135deg, #0e3a5f 0%, #1f6fb2 100%)",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium leading-tight truncate">
            {currentUser?.displayName ?? "Unknown"}
          </div>
          <div className="text-[10.5px] text-muted-foreground leading-tight truncate">
            {currentUser?.jobTitle ?? currentUser?.role ?? ""}
          </div>
        </div>
      </div>
    </aside>
  );
}
