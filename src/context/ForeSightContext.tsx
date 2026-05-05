// V5/src/context/ForeSightContext.tsx
//
// Shared state for the ForeSight chat assistant: which conversation is active,
// whether the floating widget is open, the cached conversation list, and the
// AI status snapshot (rate-limit headroom). Both the full /foresight page and
// the floating widget read from the same provider so a conversation started in
// one surface is visible in the other.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { foresightAPI, type ConversationDTO } from "@/src/services/foresight-api";

export interface AiStatus {
  ok: boolean;
  provider: string;
  dailyUsed: number;
  dailyLimit: number;
}

interface ForeSightContextValue {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  widgetOpen: boolean;
  setWidgetOpen: (open: boolean) => void;
  conversations: ConversationDTO[];
  conversationsLoading: boolean;
  refreshConversations: () => Promise<void>;
  aiStatus: AiStatus | null;
  refreshAiStatus: () => Promise<void>;
}

const ForeSightContext = createContext<ForeSightContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  /** When false (e.g. user not authenticated yet) the provider skips network calls. */
  enabled?: boolean;
}

export function ForeSightProvider({ children, enabled = true }: ProviderProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);

  const refreshConversations = useCallback(async () => {
    if (!enabled) return;
    setConversationsLoading(true);
    try {
      const r = await foresightAPI.listConversations();
      setConversations(r.conversations);
    } catch {
      // Surfaced inline in the UI by individual callers; we don't blow up the provider.
    } finally {
      setConversationsLoading(false);
    }
  }, [enabled]);

  const refreshAiStatus = useCallback(async () => {
    if (!enabled) return;
    try {
      const r = await foresightAPI.status();
      setAiStatus(r);
    } catch {
      setAiStatus(null);
    }
  }, [enabled]);

  // Initial fetch when the provider mounts (or becomes enabled).
  useEffect(() => {
    if (!enabled) return;
    void refreshConversations();
    void refreshAiStatus();
  }, [enabled, refreshConversations, refreshAiStatus]);

  return (
    <ForeSightContext.Provider
      value={{
        activeConversationId,
        setActiveConversationId,
        widgetOpen,
        setWidgetOpen,
        conversations,
        conversationsLoading,
        refreshConversations,
        aiStatus,
        refreshAiStatus,
      }}
    >
      {children}
    </ForeSightContext.Provider>
  );
}

export function useForeSight(): ForeSightContextValue {
  const ctx = useContext(ForeSightContext);
  if (!ctx) throw new Error("useForeSight must be used inside <ForeSightProvider>");
  return ctx;
}
