// V5/src/components/foresight/ForeSightWidget.tsx
//
// Floating ForeSight launcher. Renders a gold action button at the bottom-right
// when closed, and a slide-in panel containing <ChatClient mode="widget"> when
// open. Hides itself entirely when the user is already on /foresight so the
// page-mode UI isn't duplicated.

import { MessageCircle, X, Maximize2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForeSight } from "@/src/context/ForeSightContext";
import { ChatClient } from "./ChatClient";
import type { EntityGroup } from "./inject-entity-links";

interface Props {
  /** Optional auto-link entity groups (computed by the app from current data). */
  entityGroups?: EntityGroup[];
}

export function ForeSightWidget({ entityGroups }: Props) {
  const { widgetOpen, setWidgetOpen } = useForeSight();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render the widget on the dedicated /foresight page.
  if (location.pathname.startsWith("/foresight")) return null;

  if (!widgetOpen) {
    return (
      <button
        onClick={() => setWidgetOpen(true)}
        aria-label="Open ForeSight"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full
          bg-rr-gold text-rr-bg-secondary shadow-[0_0_24px_rgba(197,164,78,0.35)]
          hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
      >
        <MessageCircle size={22} />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop — clicking outside closes. Hidden on small screens where the
          panel goes full-bleed anyway. */}
      <div
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] hidden sm:block"
        onClick={() => setWidgetOpen(false)}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-label="ForeSight chat"
        className="fixed bottom-6 right-6 z-40 w-[400px] h-[600px] max-h-[80vh]
          rounded-lg border border-rr-border bg-rr-bg-secondary shadow-2xl
          flex flex-col overflow-hidden
          max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-h-none max-sm:rounded-none max-sm:bottom-0 max-sm:right-0"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-rr-border bg-rr-card">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rr-gold" />
            <span className="text-sm font-semibold text-rr-text">ForeSight</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setWidgetOpen(false);
                navigate("/foresight");
              }}
              aria-label="Expand to full page"
              className="p-1.5 rounded hover:bg-rr-navy-50 text-rr-text-dim hover:text-rr-gold"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={() => setWidgetOpen(false)}
              aria-label="Close ForeSight"
              className="p-1.5 rounded hover:bg-rr-navy-50 text-rr-text-dim hover:text-rr-text"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatClient mode="widget" entityGroups={entityGroups} />
        </div>
      </div>
    </>
  );
}
