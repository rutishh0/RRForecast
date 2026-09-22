import React, { useState } from 'react';
import { QuiplashPrompt, QuiplashSubmission } from '@/lib/types';
import { CheckCircle2, Sparkles, Clock } from 'lucide-react';

interface PlayerQuiplashVoteProps {
  prompt: QuiplashPrompt;
  /** The handful of other people's punchlines this phone gets to choose between. */
  ballot: QuiplashSubmission[];
  /** Submission id this player has voted for on the server, if any. */
  myVoteId?: string;
  timerSeconds: number;
  preRoll: number;
  onVote: (submissionId: string) => void;
}

const STYLES = [
  { border: 'border-[#00e5ff]', bg: 'bg-[#00e5ff]/20', idle: 'border-[#00e5ff]/40', glow: 'glow-cyan', tag: 'text-[#00e5ff]' },
  { border: 'border-[#ff9100]', bg: 'bg-[#ff9100]/20', idle: 'border-[#ff9100]/40', glow: 'glow-amber', tag: 'text-[#ff9100]' },
  { border: 'border-[#00e676]', bg: 'bg-[#00e676]/20', idle: 'border-[#00e676]/40', glow: 'glow-emerald', tag: 'text-[#00e676]' },
];

/** Mount with key={prompt.id}. */
export const PlayerQuiplashVote: React.FC<PlayerQuiplashVoteProps> = ({ prompt, ballot, myVoteId, timerSeconds, preRoll, onVote }) => {
  const [tapped, setTapped] = useState<string | null>(null);
  const chosenId = tapped ?? myVoteId; // instant feedback; server state wins once it arrives
  const timeUp = timerSeconds <= 0;
  const notYet = preRoll > 0;

  const handleVote = (id: string) => {
    if (timeUp || notYet || id === chosenId) return;
    setTapped(id);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
    onVote(id);
  };

  return (
    <div className="flex-grow flex flex-col p-4 max-w-md mx-auto w-full font-mono select-none gap-3">
      <div className="bg-[#0d1522] border border-[#1e314f] rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00e5ff]" />
          <span className="text-xs font-black uppercase text-[#f0f4f8]">Vote for the best</span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-telemetry font-bold ${notYet ? 'text-[#829ab1]' : timerSeconds <= 5 ? 'text-[#ff1744]' : 'text-[#ff9100]'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{notYet ? `in ${preRoll}` : `${timerSeconds}s`}</span>
        </div>
      </div>

      <div className="bg-[#131f33] border border-[#1e314f] rounded-2xl p-3 text-center">
        <div className="text-xs font-bold text-[#f0f4f8] leading-snug">{prompt.prompt}</div>
      </div>

      {ballot.length === 0 ? (
        <div className="bg-[#0d1522] border border-[#1e314f] rounded-3xl p-6 text-center text-xs text-[#829ab1]">
          Not enough punchlines came in for you to vote on this round. Watch the big screen.
        </div>
      ) : (
        <div className="space-y-3">
          {ballot.map((s, i) => {
            const st = STYLES[i % STYLES.length];
            const chosen = chosenId === s.id;
            return (
              <button
                key={s.id}
                disabled={timeUp || notYet}
                onClick={() => handleVote(s.id)}
                className={`w-full p-4 rounded-3xl border-2 transition-all text-left active:scale-[0.98] ${
                  chosen
                    ? `${st.border} ${st.bg} ${st.glow} scale-[1.02]`
                    : timeUp
                      ? 'border-[#1e314f] bg-[#0d1522]/40 opacity-40'
                      : `${st.idle} bg-[#0d1522]`
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${st.tag}`}>Option {String.fromCharCode(65 + i)}</span>
                  {chosen && (
                    <span className="text-[10px] font-black text-[#00e676] flex items-center gap-1 uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Your vote
                    </span>
                  )}
                </div>
                <div className="text-base font-bold text-[#f0f4f8] leading-snug">&ldquo;{s.text}&rdquo;</div>
              </button>
            );
          })}
        </div>
      )}

      <div className="text-center text-[10px] text-[#829ab1]">
        {notYet ? `Read them — voting opens in ${preRoll}…` : timeUp ? 'Voting closed.' : chosenId ? 'You can change your mind until the timer ends.' : 'Tap your favourite. Authors get +250 per vote.'}
      </div>
    </div>
  );
};
