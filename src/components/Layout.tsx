import { Wrench, BarChart3, Upload, PenSquare, MapPin, Grid, Users, User as UserIcon, Star, LogOut, Settings, Sparkles } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAppData } from '@/src/context/AppDataContext';
import { useLayoutMode } from '@/src/context/LayoutModeContext';
import FileUpload from '@/src/components/FileUpload';
import { ForeSightWidget } from '@/src/components/foresight/ForeSightWidget';

interface NavItem {
  path: string;
  label: string;
  icon: any; // LucideIcon
  badge?: number;
  adminOnly?: boolean;
}

const VIEW_HEADERS: Record<string, { title: string; subtitle: string }> = {
  '/my-dashboard': { title: 'My Dashboard', subtitle: 'Deadlines, to-dos, action items, and upcoming meetings' },
  '/shop-visits': { title: 'Shop Visit Tracker', subtitle: 'Lessor shop visit planning status — WIP and upcoming events' },
  '/forecast': { title: 'Engine Forecasting', subtitle: '2026 engine removal forecast and financial outlook' },
  '/data-editor': { title: 'Data Editor', subtitle: 'View, edit, add and export engine data records' },
  '/engine-map': { title: 'Engine Map', subtitle: 'Global MRO network — facility locations and engine tracking' },
  '/collaborative': { title: 'Collaborative Dashboard', subtitle: 'Shared views with team post-it notes' },
  '/profile': { title: 'Profile', subtitle: 'Your account settings and feature requests' },
  '/admin/feature-requests': { title: 'Feature Requests', subtitle: 'Review and manage team feature requests' },
  '/admin/users': { title: 'User Management', subtitle: 'Add, remove, and manage user accounts' },
};

export default function Layout() {
  const { currentUser, logout, showUpload, setShowUpload, setShopVisits, setForecasts, shopVisits, forecasts } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const hasData = shopVisits.length > 0 || forecasts.length > 0;

  // Derive header from current path; default to a safe fallback so this never crashes on unknown paths.
  const header = VIEW_HEADERS[location.pathname] ?? { title: '', subtitle: '' };

  const [sidebarHovered, setSidebarHovered] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const primaryNavItems: NavItem[] = [
    { path: '/my-dashboard', label: 'My Dashboard', icon: Grid },
    { path: '/shop-visits', label: 'Shop Visit Tracker', icon: Wrench },
    { path: '/forecast', label: 'Engine Forecasting', icon: BarChart3 },
    { path: '/data-editor', label: 'Data Editor', icon: PenSquare },
    { path: '/engine-map', label: 'Engine Map', icon: MapPin },
    { path: '/collaborative', label: 'Collaborative', icon: Users },
  ];

  const secondaryNavItems: NavItem[] = [
    { path: '/profile', label: 'Profile', icon: UserIcon },
    { path: '/admin/feature-requests', label: 'Feature Requests', icon: Star, adminOnly: true },
    { path: '/admin/users', label: 'User Management', icon: Settings, adminOnly: true },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleUploaded = (result: { shopVisits: any[]; forecasts: any[]; warnings?: string[] }) => {
    setShopVisits(result.shopVisits);
    setForecasts(result.forecasts);
    if (result.warnings?.length) {
      console.warn('Upload warnings:', result.warnings);
    }
  };

  const initials = (currentUser?.displayName || '')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (!currentUser) return null;

  return (
    <>
      <div style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: "#F6F5F2",
        color: "#1A1F25",
        overflow: "hidden",
      }}>
        {/* ───── SIDEBAR ───── */}
        <aside style={{
          width: 252,
          minWidth: 252,
          background: "#0F1923",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 10,
          overflow: "hidden",
        }}>
          {/* Subtle texture overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: `repeating-linear-gradient(
              180deg,
              transparent,
              transparent 1px,
              rgba(255,255,255,0.008) 1px,
              rgba(255,255,255,0.008) 2px
            )`,
            pointerEvents: "none",
          }} />

          {/* Brand Header */}
          <div style={{
            padding: "28px 24px 24px",
            borderBottom: "1px solid rgba(197,164,78,0.12)",
            position: "relative",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <svg
                viewBox="0 0 26 32"
                aria-label="Rolls-Royce logo"
                style={{
                  width: 24,
                  height: 32,
                  flexShrink: 0,
                  color: "#C5A44E"
                }}
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M15.13 1.6a7.15 7.15 0 0 1 3.03 5.68c0 2.96-1.62 5.44-4.57 7l-.07.03c-.03 0-.06.02-.08.03l-.15.06h-.03l-.28.15.2.24c1.93 2.26 3.11 5.48 3.66 7.2.22.72.42 1.46.73 2.82l.06.27c.44 1.8 1.45 2.34 1.96 2.5v.4h-5.71v-.4c.58-.16.97-.7.94-1.3v-.24c0-.45-.1-1.56-.14-1.95l-.01-.13c-.44-3.18-1.76-6.47-3.47-8.59l-.09-.11-.15.04c-2.13.54-4.3.81-6.48.81h-.24l.02 9.25c0 1.17.48 1.94 1.38 2.23v.4H.04v-.4c.88-.29 1.32-1.01 1.39-2.23V2.73C1.4 1.47.94.73 0 .43V0h9.22c2.73.02 4.5.63 5.91 1.6ZM13 4.01H6.43v.41c.95.3 1.39 1.01 1.43 2.3v6.65c.97-.16 1.9-.45 2.79-.88V5.64h3.34A5.08 5.08 0 0 0 13 4Zm-.46 16.04a7.32 7.32 0 0 0-.57-1.35l-.54.02c-.18 0-.37 0-.54.02h-.24V16.5c-.92.22-1.84.38-2.79.5v12.35c-.04 1.2-.5 1.94-1.38 2.24v.4h5.55v-.4c-.9-.3-1.38-1.07-1.38-2.24l-.02-9.25h.24l.55-.01c.38-.01.76-.02 1.12-.05ZM19.2 6.53l-.03-.01a8 8 0 0 0-.6-2.24c1.07.24 2.08.68 2.97 1.31a7.15 7.15 0 0 1 3.03 5.69c0 2.97-1.62 5.45-4.56 6.99-.04 0-.06.02-.08.03l-.08.03-.08.04-.1.03-.28.14.2.25c1.9 2.25 3.12 5.47 3.67 7.19.2.65.36 1.32.63 2.45l.09.37.07.27c.43 1.8 1.44 2.34 1.95 2.5v.4h-5.73v-.4c.58-.16.97-.7.94-1.3v-.23c0-.45-.1-1.58-.14-1.95v-.1l-.01-.02a18.16 18.16 0 0 0-3.47-8.6l-.09-.11-.15.04-.26.05-.1.02c-.17-.5-.39-.98-.63-1.44 4.77-1.63 5.36-4.96 5.36-6.6 0-1.93-.75-3.55-2.11-4.54-.12-.09-.27-.17-.41-.26Zm-6-3.74a5.46 5.46 0 0 1 2.1 4.54c0 2.16-1.07 7.24-10.84 7.42h-.24V1.65h4.9c1.75.02 3.02.38 4.08 1.14Z"
                />
              </svg>
              <div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  letterSpacing: "0.1em",
                  lineHeight: 1.2,
                }}>ROLLS-ROYCE</div>
                <div style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(197, 164, 78, 0.7)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}>FORECASTING ENGINE</div>
              </div>
            </div>
          </div>

          {/* Primary Nav */}
          <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto", position: "relative", zIndex: 10 }}>
            <div style={{
              fontSize: 9,
              fontWeight: 600,
              color: "rgba(184,196,212,0.4)",
              letterSpacing: "2px",
              textTransform: "uppercase",
              padding: "4px 12px 10px",
            }}>Operations</div>

            {primaryNavItems.map((item, i) => {
              const isHovered = sidebarHovered === item.path;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onMouseEnter={() => setSidebarHovered(item.path)}
                  onMouseLeave={() => setSidebarHovered(null)}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "10px 12px",
                    marginBottom: 2,
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 450,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: isActive ? "#C5A44E" : isHovered ? "#E8ECF1" : "#8B9AB5",
                    background: isActive
                      ? "rgba(197,164,78,0.1)"
                      : isHovered
                        ? "rgba(255,255,255,0.04)"
                        : "transparent",
                    transition: "all 0.2s ease",
                    position: "relative",
                    animation: loaded ? `slideInLeft 0.3s ease ${i * 0.04}s both` : "none",
                    textAlign: "left",
                    textDecoration: "none",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 3,
                          height: 20,
                          borderRadius: "0 3px 3px 0",
                          background: "linear-gradient(180deg, #C5A44E, #D4B96A)",
                        }} />
                      )}
                      <span style={{ opacity: isActive ? 1 : 0.7, transition: "opacity 0.2s", display: "flex" }}>
                        <Icon size={18} strokeWidth={1.5} />
                      </span>
                      <span>{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span style={{
                          marginLeft: "auto",
                          background: "#C5A44E",
                          color: "#0F1923",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 10,
                          minWidth: 20,
                          textAlign: "center",
                        }}>{item.badge > 99 ? '99+' : item.badge}</span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              );
            })}

            <div style={{
              height: 1,
              background: "rgba(255,255,255,0.06)",
              margin: "14px 12px",
            }} />

            <div style={{
              fontSize: 9,
              fontWeight: 600,
              color: "rgba(184,196,212,0.4)",
              letterSpacing: "2px",
              textTransform: "uppercase",
              padding: "4px 12px 10px",
            }}>Account</div>

            {secondaryNavItems.map((item) => {
              if (item.adminOnly && currentUser.role !== 'admin') return null;
              const isHovered = sidebarHovered === item.path;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onMouseEnter={() => setSidebarHovered(item.path)}
                  onMouseLeave={() => setSidebarHovered(null)}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "10px 12px",
                    marginBottom: 2,
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 450,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: isActive ? "#C5A44E" : isHovered ? "#E8ECF1" : "#8B9AB5",
                    background: isActive ? "rgba(197,164,78,0.1)" : isHovered ? "rgba(255,255,255,0.04)" : "transparent",
                    transition: "all 0.2s ease",
                    textAlign: "left",
                    position: "relative",
                    textDecoration: "none",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 3,
                          height: 20,
                          borderRadius: "0 3px 3px 0",
                          background: "linear-gradient(180deg, #C5A44E, #D4B96A)",
                        }} />
                      )}
                      <span style={{ opacity: isActive ? 1 : 0.7, display: "flex" }}><Icon size={18} strokeWidth={1.5} /></span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User Card + Actions */}
          <div style={{
            padding: "0 12px 12px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
            zIndex: 10
          }}>
            {/* ForeSight floating widget */}
            <ForeSightWidget />

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 12px 14px",
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: currentUser.avatarColor || "linear-gradient(135deg, #C5A44E, #8B7A3A)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: currentUser.avatarColor ? "white" : "#0F1923",
                flexShrink: 0,
              }}>{initials}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E8ECF1", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.displayName}</div>
                <div style={{ fontSize: 10.5, color: "#8B9AB5", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.jobTitle || currentUser.role}</div>
              </div>
            </div>

            <button
              onClick={() => setShowUpload(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 12px",
                border: "1px dashed rgba(197,164,78,0.25)",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "#C5A44E",
                background: "rgba(197,164,78,0.05)",
                transition: "all 0.2s ease",
                marginBottom: 6,
              }}>
              <span style={{ display: "flex" }}><Upload size={16} strokeWidth={1.5} /></span>
              {hasData ? 'Re-upload Data' : 'Upload Excel'}
            </button>

            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 12px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 450,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "#8B9AB5",
                background: "transparent",
                transition: "all 0.2s ease",
              }}>
              <span style={{ display: "flex" }}><LogOut size={16} strokeWidth={1.5} /></span>
              Sign Out
            </button>
          </div>
        </aside>

        {/* ───── MAIN CONTENT ───── */}
        <main style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Top Bar */}
          <header style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 36px",
            height: 60,
            background: "#FFFFFF",
            borderBottom: "1px solid #E8E5DF",
            flexShrink: 0,
          }}>
            <div>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 21,
                fontWeight: 600,
                color: "#0F1923",
                lineHeight: 1.2,
              }}>{header.title}</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <BetaToggleButton />
              <span style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#8B9AB5",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}>Rolls-Royce Civil Aerospace</span>
              <div style={{ width: 1, height: 16, background: "#E8E5DF" }} />
              <span style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#5A6474",
              }}>{today}</span>
            </div>
          </header>

          {/* Scrollable Content */}
          <div style={{
            flex: 1,
            overflow: "auto",
            padding: "40px 48px 48px",
          }}>
            <Outlet />
          </div>
        </main>
      </div>

      <FileUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        isLoading={false}
        onUploaded={handleUploaded}
      />
    </>
  );
}

function BetaToggleButton() {
  const { toggleMode } = useLayoutMode();
  return (
    <button
      onClick={toggleMode}
      title="Try the beta layout"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        padding: "0 10px",
        borderRadius: 6,
        border: "1px solid rgba(197,164,78,0.5)",
        background: "rgba(197,164,78,0.08)",
        color: "#8E7633",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.5px",
        cursor: "pointer",
        transition: "background 120ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(197,164,78,0.18)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(197,164,78,0.08)")}
    >
      <Sparkles size={12} />
      Try Beta
    </button>
  );
}
