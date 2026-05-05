// V5/src/components/foresight/ChatClient.tsx
//
// Shared chat core used by both the full /foresight page (mode="page") and
// the floating ForeSight widget (mode="widget"). Page mode shows the sidebar
// of past conversations; widget mode hides it.
//
// Streaming model: POST /api/chat returns an SSE stream. We append an empty
// assistant bubble locally, then accumulate `chunk.content` into it until the
// `done` frame arrives. On error we mark the user bubble as failed and surface
// an inline error banner above the input row.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  foresightAPI,
  type ChatMessageDTO,
  type ChatStreamEvent,
} from "@/src/services/foresight-api";
import { useForeSight } from "@/src/context/ForeSightContext";
import { markdownComponents } from "./markdown-components";
import { injectEntityLinks, type EntityGroup } from "./inject-entity-links";
import { ConversationList } from "./ConversationList";
import { SamplePromptCard, SAMPLE_PROMPTS } from "./SamplePromptCard";

interface Props {
  mode: "page" | "widget";
  /**
   * Entity groups for auto-linking ESN/MSN/lessor mentions in assistant
   * responses. Computed once by the page or widget caller from current
   * shopVisits/forecasts and passed down so this component is data-agnostic.
   */
  entityGroups?: EntityGroup[];
  className?: string;
}

const EMPTY_ENTITY_GROUPS: EntityGroup[] = [];

export function ChatClient({ mode, entityGroups, className }: Props) {
  const {
    activeConversationId,
    setActiveConversationId,
    conversations,
    conversationsLoading,
    refreshConversations,
  } = useForeSight();

  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const groups = entityGroups ?? EMPTY_ENTITY_GROUPS;

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    setLoadingMsgs(true);
    setError(null);
    foresightAPI
      .getConversation(activeConversationId)
      .then((r) => setMessages(r.messages))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load conversation"))
      .finally(() => setLoadingMsgs(false));
  }, [activeConversationId]);

  // Auto-scroll on every message mutation (streaming or not)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Cancel any in-flight stream when the component unmounts
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setSending(true);
      setError(null);
      setInput("");

      const optimisticUserId = "optimistic-user-" + Date.now();
      const streamingAssistantId = "streaming-assistant-" + Date.now();
      const startedConversationId = activeConversationId;

      // Show user bubble + empty assistant bubble immediately.
      const userBubble: ChatMessageDTO = {
        id: optimisticUserId,
        conversationId: startedConversationId ?? "new",
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const assistantBubble: ChatMessageDTO = {
        id: streamingAssistantId,
        conversationId: startedConversationId ?? "new",
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, userBubble, assistantBubble]);

      const controller = new AbortController();
      abortRef.current = controller;

      let accumulated = "";
      let resolvedConversationId: string | null = null;
      let streamErrored: string | null = null;

      try {
        await foresightAPI.sendStream(
          trimmed,
          startedConversationId ?? undefined,
          (ev: ChatStreamEvent) => {
            if (ev.kind === "chunk") {
              accumulated += ev.content;
              setMessages((m) =>
                m.map((x) =>
                  x.id === streamingAssistantId ? { ...x, content: accumulated } : x,
                ),
              );
            } else if (ev.kind === "done") {
              resolvedConversationId = ev.conversationId || startedConversationId;
              setMessages((m) =>
                m.map((x) => {
                  if (x.id === streamingAssistantId) {
                    return {
                      ...x,
                      id: ev.messageId || x.id,
                      conversationId: resolvedConversationId ?? x.conversationId,
                    };
                  }
                  if (x.id === optimisticUserId) {
                    return {
                      ...x,
                      conversationId: resolvedConversationId ?? x.conversationId,
                    };
                  }
                  return x;
                }),
              );
            } else if (ev.kind === "error") {
              streamErrored = ev.error;
            }
          },
          controller.signal,
        );
      } catch (e: unknown) {
        streamErrored = e instanceof Error ? e.message : "Send failed";
      } finally {
        abortRef.current = null;
        setSending(false);
      }

      if (streamErrored) {
        setError(streamErrored);
        // Mark the user bubble as failed; drop the empty assistant bubble.
        setMessages((m) =>
          m
            .filter((x) => !(x.id === streamingAssistantId && accumulated === ""))
            .map((x) => (x.id === optimisticUserId ? { ...x, id: "failed-" + x.id } : x)),
        );
        return;
      }

      if (resolvedConversationId && resolvedConversationId !== startedConversationId) {
        setActiveConversationId(resolvedConversationId);
      }
      // Refresh the sidebar list so new/updated conversations float to the top.
      void refreshConversations();
    },
    [activeConversationId, sending, setActiveConversationId, refreshConversations],
  );

  const handleNew = useCallback(() => {
    abortRef.current?.abort();
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  }, [setActiveConversationId]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await foresightAPI.deleteConversation(id);
        if (activeConversationId === id) handleNew();
        await refreshConversations();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    },
    [activeConversationId, handleNew, refreshConversations],
  );

  const isWelcome = !activeConversationId && messages.length === 0;

  return (
    <div className={`flex h-full ${mode === "widget" ? "flex-col" : ""} ${className ?? ""}`}>
      {mode === "page" && (
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onNew={handleNew}
          onDelete={handleDelete}
          loading={conversationsLoading}
        />
      )}

      <div className="flex-1 flex flex-col h-full bg-rr-bg-secondary min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {isWelcome && mode === "page" && (
            <div className="max-w-3xl mx-auto py-8">
              <h2 className="text-xl font-bold text-rr-text mb-2">ForeSight</h2>
              <p className="text-sm text-rr-text-dim mb-6">
                Forecast + Insight. Ask me about engines, forecasts, your day, or draft something.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SAMPLE_PROMPTS.map((sp) => (
                  <SamplePromptCard key={sp.prompt} {...sp} onSelect={handleSend} />
                ))}
              </div>
            </div>
          )}

          {isWelcome && mode === "widget" && (
            <div className="text-center py-8 px-4">
              <h3 className="font-semibold text-rr-gold mb-1">ForeSight</h3>
              <p className="text-xs text-rr-text-dim">
                Ask me about engines, forecasts, or your day.
              </p>
            </div>
          )}

          {loadingMsgs && (
            <div className="flex items-center gap-2 text-rr-text-dim text-sm">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              entityGroups={groups}
              isFailed={m.id.startsWith("failed-")}
              isStreaming={m.id.startsWith("streaming-assistant-") && sending}
            />
          ))}

          {sending && messages.every((m) => !m.id.startsWith("streaming-assistant-")) && (
            <div className="flex items-center gap-2 text-rr-text-dim text-sm py-2">
              <Loader2 size={14} className="animate-spin" /> ForeSight is thinking…
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-2 text-xs text-rr-danger border-t border-rr-danger-border bg-rr-danger-bg flex items-center justify-between gap-3">
            <span className="flex items-center gap-1">
              <AlertTriangle size={12} /> {error}
            </span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="underline underline-offset-2 hover:text-rr-text-bright"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="border-t border-rr-border p-3 bg-rr-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend(input);
            }}
            className="flex gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend(input);
                }
              }}
              placeholder="Ask ForeSight…"
              rows={1}
              disabled={sending}
              className="flex-1 resize-none px-3 py-2 rounded-md bg-rr-navy-50 border border-rr-border
                text-rr-text placeholder:text-rr-text-muted focus:outline-none focus:border-rr-gold/50
                text-sm leading-relaxed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-3 py-2 rounded-md bg-rr-gold text-rr-bg-secondary
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:bg-rr-gold-bright transition-colors flex items-center justify-center"
              aria-label="Send"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

interface BubbleProps {
  message: ChatMessageDTO;
  entityGroups: EntityGroup[];
  isFailed?: boolean;
  isStreaming?: boolean;
}

function MessageBubble({ message, entityGroups, isFailed, isStreaming }: BubbleProps) {
  const isUser = message.role === "user";
  const linked = useMemo(
    () => (isUser ? message.content : injectEntityLinks(message.content, entityGroups)),
    [message.content, entityGroups, isUser],
  );

  return (
    <div
      className={`flex mb-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 ${
          isUser
            ? `bg-rr-gold/10 border border-rr-gold/30 ${isFailed ? "border-rr-danger" : ""}`
            : "bg-gradient-to-br from-rr-card to-rr-card/70 border border-rr-border"
        }`}
      >
        {isUser ? (
          <div className="text-sm text-rr-text whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="text-sm text-rr-text">
            {linked ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {linked}
              </ReactMarkdown>
            ) : isStreaming ? (
              <span className="inline-flex items-center gap-1 text-rr-text-dim">
                <Loader2 size={12} className="animate-spin" />
                ForeSight is thinking…
              </span>
            ) : null}
          </div>
        )}
        {isFailed && (
          <div className="mt-2 flex items-center gap-1 text-xs text-rr-danger">
            <AlertTriangle size={12} /> Failed to send
          </div>
        )}
      </div>
    </div>
  );
}
