// V5/src/components/routing/LayoutSwitcher.tsx
//
// Renders the classic Layout or the beta BetaLayout depending on the
// current LayoutMode. Used as the parent route element so all child
// routes mount the same Outlet regardless of which shell is active.

import Layout from "@/src/components/Layout";
import BetaLayout from "@/src/components/beta/BetaLayout";
import { useLayoutMode } from "@/src/context/LayoutModeContext";

export default function LayoutSwitcher() {
  const { mode } = useLayoutMode();
  return mode === "beta" ? <BetaLayout /> : <Layout />;
}
