// V5/src/pages/ForeSightPage.tsx
//
// Full-page ForeSight chat (mounted at /foresight by the A2 router agent).
// Renders the shared ChatClient in "page" mode, which itself contains the
// conversation sidebar and the chat surface.

import { ChatClient } from "@/src/components/foresight/ChatClient";
import type { EntityGroup } from "@/src/components/foresight/inject-entity-links";

interface Props {
  /** Auto-link entity groups derived from the app's loaded shopVisits/forecasts. */
  entityGroups?: EntityGroup[];
}

export default function ForeSightPage({ entityGroups }: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-rr-border px-4 py-3 bg-rr-card">
        <h1 className="text-base font-bold text-rr-text">ForeSight</h1>
        <p className="text-xs text-rr-text-dim">
          Forecast + Insight — your engine and forecast assistant.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatClient mode="page" entityGroups={entityGroups} />
      </div>
    </div>
  );
}
