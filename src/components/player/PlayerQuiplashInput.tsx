import React, { useState } from 'react';
import { QuiplashPrompt } from '@/lib/types';
import { Send, MessageSquare, CheckCircle2, Clock, Pencil } from 'lucide-react';

interface PlayerQuiplashInputProps {
  prompt: QuiplashPrompt;
  roundNumber: number;
  totalRounds: number;
  timerSeconds: number;
  preRoll: number;
  /** What the server currently holds for this player, if anything. */
  mySubmission?: string;
  onSubmitPunchline: (text: string) => void;
}

/** Mount with key={prompt.id}. */
export const PlayerQuiplashInput: React.FC<PlayerQuiplashInputProps> = ({
  prompt,
  roundNumber,
  totalRounds,
  timerSeconds,
  preRoll,
  mySubmission,
  onSubmitPunchline,
}) => {
  const [text, setText] = useState(mySubmission ?? '');
  const [editing, setEditing] = useState(!mySubmission);
  const timeUp = timerSeconds <= 0;
  const notYet = preRoll > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || timeUp || notYet) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
    onSubmitPunchline(clean);
    setEditing(false);
  };

  const showForm = editing && !timeUp;

  return (
    <div className="flex-grow flex flex-col p-4 max-w-md mx-auto w-full font-mono select-none gap-3">
      <div className="bg-[#0d1522] border border-[#1e314f] rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#ff9100]" />
          <span className="text-xs font-black uppercase text-[#f0f4f8]">
            Quiplash · Round {roundNumber}/{totalRounds}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-telemetry font-bold ${notYet ? 'text-[#829ab1]' : timerSeconds <= 5 ? 'text-[#ff1744]' : 'text-[#ff9100]'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{notYet ? `in ${preRoll}` : `${timerSeconds}s`}</span>
        </div>
      </div>

      <div className="bg-[#0d1522] border-2 border-[#ff9100]/40 rounded-3xl p-5 text-center space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#ff9100]">Finish the sentence</span>
        <div className="text-base font-bold text-[#f0f4f8] leading-snug">{prompt.prompt}</div>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              autoFocus
              rows={4}
              maxLength={120}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Your punchline…"
              className="w-full p-4 bg-[#06090e] border border-[#1e314f] focus:border-[#ff9100] rounded-2xl text-[#f0f4f8] text-base font-bold placeholder-[#829ab1]/40 focus:outline-none resize-none"
            />
            <div className="absolute right-3 bottom-3 text-[10px] font-telemetry font-bold text-[#829ab1]">
              {text.length} / 120
            </div>
          </div>
          <button
            type="submit"
            disabled={!text.trim() || notYet}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff9100] to-[#ff1744] text-[#06090e] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#ff9100]/20 transition-all active:scale-95 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            <span>{notYet ? `Get ready… ${preRoll}` : mySubmission ? 'Update punchline' : 'Send punchline'}</span>
          </button>
        </form>
      ) : (
        <div className="bg-[#131f33] border border-[#00e676]/60 rounded-3xl p-5 text-center space-y-3 animate-fade-in">
          <CheckCircle2 className="w-9 h-9 text-[#00e676] mx-auto" />
          <div className="text-sm font-black text-[#f0f4f8] uppercase">{mySubmission ? 'Punchline in' : 'Sending…'}</div>
          {mySubmission && <div className="text-sm text-[#f0f4f8] italic">&ldquo;{mySubmission}&rdquo;</div>}
          <p className="text-xs text-[#829ab1]">It stays anonymous until the reveal. Voting opens when the host is ready or the timer ends.</p>
          {!timeUp && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-bold text-[#00e5ff] inline-flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
      )}

      {timeUp && !mySubmission && (
        <div className="text-center text-xs font-bold text-[#ff1744] uppercase">Time&apos;s up — you can still vote</div>
      )}
    </div>
  );
};
