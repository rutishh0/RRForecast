// V5/src/context/LayoutModeContext.tsx
//
// User-toggleable layout mode. "classic" = the V4-ported app shell
// (production), "beta" = the new v0-style design (in-progress).
// Persists to localStorage so the toggle survives reloads.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type LayoutMode = "classic" | "beta";

const STORAGE_KEY = "rr_layout_mode";
const DEFAULT_MODE: LayoutMode = "classic";

interface LayoutModeContextValue {
  mode: LayoutMode;
  setMode: (mode: LayoutMode) => void;
  toggleMode: () => void;
}

const LayoutModeContext = createContext<LayoutModeContextValue | null>(null);

function readInitialMode(): LayoutMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "beta" || saved === "classic" ? saved : DEFAULT_MODE;
}

export function LayoutModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<LayoutMode>(readInitialMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* localStorage may be unavailable (private browsing); persist is best-effort */
    }
    // Drive CSS theme via [data-layout] attribute on <html>
    document.documentElement.setAttribute("data-layout", mode);
  }, [mode]);

  const value: LayoutModeContextValue = {
    mode,
    setMode: setModeState,
    toggleMode: () => setModeState((m) => (m === "classic" ? "beta" : "classic")),
  };

  return <LayoutModeContext.Provider value={value}>{children}</LayoutModeContext.Provider>;
}

export function useLayoutMode(): LayoutModeContextValue {
  const ctx = useContext(LayoutModeContext);
  if (!ctx) throw new Error("useLayoutMode must be inside <LayoutModeProvider>");
  return ctx;
}
