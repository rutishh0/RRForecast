// V5/src/components/foresight/SamplePromptCard.tsx
//
// Suggestion chip shown on the empty-state of the chat. Click pre-fills + sends.

interface Props {
  category: string;
  prompt: string;
  onSelect: (prompt: string) => void;
}

export function SamplePromptCard({ category, prompt, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(prompt)}
      className="text-left p-4 rounded-lg border border-rr-border bg-rr-card hover:border-rr-gold/40 hover:bg-rr-navy-50 transition-colors group"
    >
      <div className="text-[10px] uppercase tracking-wider text-rr-gold font-semibold mb-2">
        {category}
      </div>
      <div className="text-sm text-rr-text leading-relaxed group-hover:text-rr-text-bright">
        {prompt}
      </div>
    </button>
  );
}

export const SAMPLE_PROMPTS: Array<{ category: string; prompt: string }> = [
  {
    category: "Triage",
    prompt:
      "Which engines have shop visits in the next 30 days that don't have a workscope agreed yet?",
  },
  {
    category: "Email drafts",
    prompt: "Draft a removal-date update email for ESN 12345 to the lessor's contract manager.",
  },
  {
    category: "Risk analysis",
    prompt: "Summarize the highest-risk forecast records for Q3.",
  },
  {
    category: "My day",
    prompt: "What action items do I have due this week, and which are tied to engines?",
  },
  {
    category: "Compare",
    prompt: "Compare the workscope status of the Trent 1000 vs Trent 7000 fleet.",
  },
  {
    category: "Mitigation",
    prompt: "For ESN 12345, what mitigation plan would you suggest given the current status?",
  },
];
