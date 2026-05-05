// V5/src/components/foresight/ConversationList.tsx
//
// Sidebar of past conversations. Used only in the page-mode ChatClient layout
// (the floating widget never shows the list). Shows a "New chat" button at top
// and a delete-on-hover affordance per row.

import { Plus, Trash2, MessageSquare } from "lucide-react";
import type { ConversationDTO } from "@/src/services/foresight-api";

interface Props {
  conversations: ConversationDTO[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  loading,
}: Props) {
  return (
    <aside className="w-[260px] border-r border-rr-border bg-rr-card flex flex-col h-full">
      <div className="p-3 border-b border-rr-border">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md
            bg-rr-gold/15 text-rr-gold border border-rr-gold/30 hover:bg-rr-gold/25
            transition-colors text-sm font-semibold"
        >
          <Plus size={14} /> New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 && (
          <div className="p-4 text-xs text-rr-text-dim">Loading…</div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="p-4 text-xs text-rr-text-dim">No conversations yet.</div>
        )}
        <ul className="py-1">
          {conversations.map((c) => (
            <li key={c.id} className="group">
              <div
                className={`w-full flex items-center gap-2 px-3 py-2 cursor-pointer
                  ${
                    c.id === activeId
                      ? "bg-rr-navy-50 border-l-2 border-rr-gold"
                      : "hover:bg-rr-navy-50/50"
                  }`}
                onClick={() => onSelect(c.id)}
              >
                <MessageSquare size={14} className="text-rr-text-dim shrink-0" />
                <span className="text-sm text-rr-text truncate flex-1">
                  {c.title ?? "Untitled chat"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-rr-danger hover:text-rr-text-bright transition-opacity"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
