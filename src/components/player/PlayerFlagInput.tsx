import React, { useState } from 'react';
import { FlagScenario, FlagVote } from '@/lib/types';
import { ThumbsUp, ThumbsDown, CheckCircle2, Clock, Scale } from 'lucide-react';

interface PlayerFlagInputProps {
  scenario: FlagScenario;
  scenarioNumber: number;
  totalScenarios: number;
  timerSeconds: number;
  preRoll: number;
  myVote?: FlagVote;
  onVoteFlag: (vote: FlagVote) => void;
}

/** Mount with key={scenario.id}. */
export const PlayerFlagInput: React.FC<PlayerFlagInputProps> = ({
  scenario,
  scenarioNumber,
  totalScenarios,
  timerSeconds,
  preRoll,
  myVote,
  onVoteFlag,
}) => {
  const [tapped, setTapped] = useState<FlagVote | null>(null);
  const [nudge, setNudge] = useState(false);
  const vote = tapped ?? myVote; // instant feedback; server state wins once it arrives
  const timeUp = timerSeconds <= 0;
  const notYet = preRoll > 0;

  const handleVote = (v: FlagVote) => {
    if (notYet) {
      setNudge(true);
      setTimeout(() => setNudge(false), 900);
      return;
    }
    if (timeUp || v === vote) return;
    setTapped(v);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(v === 'RED' ? 45 : 25);
    onVoteFlag(v);
  };

  return (
    <div className="flex-grow flex flex-col p-4 pb-8 max-w-md mx-auto w-full font-mono select-none gap-3">
      <div className="bg-[#0d1522] border border-[#1e314f] rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#00e5ff]" />
          <span className="text-xs font-black uppercase text-[#f0f4f8]">
            Red / Green · {scenarioNumber}/{totalScenarios}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-telemetry font-bold ${notYet ? 'text-[#829ab1]' : timerSeconds <= 5 ? 'text-[#ff1744]' : 'text-[#ff9100]'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{notYet ? `in ${preRoll}` : `${timerSeconds}s`}</span>
        </div>
      </div>

      <div className="bg-[#131f33] border border-[#1e314f] rounded-2xl p-3 text-center">
        <span className="text-[10px] text-[#829ab1] uppercase tracking-wider block font-bold">{scenario.context}</span>
        <span className="text-sm font-bold text-[#f0f4f8] leading-snug block mt-1">&ldquo;{scenario.statement}&rdquo;</span>
      </div>

      <div className="text-center text-[11px] text-[#829ab1] min-h-[18px]">
        {notYet ? (nudge ? 'Not yet!' : `Get ready… ${preRoll}`) : timeUp ? 'Voting closed.' : vote ? 'You can switch until the timer ends.' : 'Tap to vote. Bonus points if you side with the room.'}
      </div>

      <div className="grid grid-rows-2 gap-3 flex-grow min-h-[360px]">
        <button
          disabled={timeUp}
          onClick={() => handleVote('RED')}
          className={`rounded-3xl border-2 transition-all flex flex-col items-center justify-center p-6 active:scale-[0.98] relative overflow-hidden ${
            vote === 'RED'
              ? 'border-[#ff1744] bg-[#ff1744]/30 glow-rose scale-[1.02] text-[#ff1744]'
              : timeUp || vote
                ? 'border-[#1e314f] bg-[#0d1522]/40 opacity-40 text-[#829ab1]'
                : 'border-[#ff1744]/40 bg-[#ff1744]/10 text-[#ff1744]'
          }`}
        >
          <ThumbsDown className="w-12 h-12 mb-2 stroke-[2.5]" />
          <span className="text-xl font-black tracking-wider uppercase">Red flag</span>
          <span className="text-xs opacity-80 mt-1 uppercase font-bold">Absolutely not</span>
          {vote === 'RED' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#ff1744] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black">
              <CheckCircle2 className="w-3.5 h-3.5" /> VOTED
            </div>
          )}
        </button>
        <button
          disabled={timeUp}
          onClick={() => handleVote('GREEN')}
          className={`rounded-3xl border-2 transition-all flex flex-col items-center justify-center p-6 active:scale-[0.98] relative overflow-hidden ${
            vote === 'GREEN'
              ? 'border-[#00e676] bg-[#00e676]/30 glow-emerald scale-[1.02] text-[#00e676]'
              : timeUp || vote
                ? 'border-[#1e314f] bg-[#0d1522]/40 opacity-40 text-[#829ab1]'
                : 'border-[#00e676]/40 bg-[#00e676]/10 text-[#00e676]'
          }`}
        >
          <ThumbsUp className="w-12 h-12 mb-2 stroke-[2.5]" />
          <span className="text-xl font-black tracking-wider uppercase">Green flag</span>
          <span className="text-xs opacity-80 mt-1 uppercase font-bold">Totally fine</span>
          {vote === 'GREEN' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#00e676] text-[#06090e] px-2.5 py-0.5 rounded-full text-[10px] font-black">
              <CheckCircle2 className="w-3.5 h-3.5" /> VOTED
            </div>
          )}
        </button>

      </div>

    </div>
  );
};
