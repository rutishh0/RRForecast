import React from 'react';
import { Player } from '@/lib/types';
import { getRankedPlayers, rankOf } from '@/lib/gameLogic';
import { avatarIcon } from '@/lib/content';
import { Flame, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface PlayerScorecardProps {
  player: Player;
  allPlayers: Record<string, Player>;
  /** Show the "+750 — correct!" card for the round that just ended. */
  showLastRound?: boolean;
  headline?: string;
  subline?: string;
  /** Show the streak flame (only meaningful during the quiz). */
  showStreak?: boolean;
  /** e.g. the correct quiz answer, shown for remote viewers who can't read the big screen. */
  answerText?: string;
}

export const PlayerScorecard: React.FC<PlayerScorecardProps> = ({
  player,
  allPlayers,
  showLastRound = false,
  headline,
  subline = 'Eyes on the big screen.',
  showStreak = false,
  answerText,
}) => {
  const ranked = getRankedPlayers(allPlayers);
  const { rank, tied } = rankOf(player, allPlayers);
  const lr = player.lastRound;

  const tone = !lr ? '' : lr.points > 0 && lr.correct !== false ? 'good' : lr.points > 0 ? 'ok' : 'bad';

  return (
    <div className="flex-grow flex flex-col justify-center p-4 max-w-md mx-auto w-full font-mono select-none gap-3">
      {showLastRound && lr && (
        <div
          className={`rounded-3xl p-5 text-center border-2 animate-fade-in ${
            tone === 'good'
              ? 'bg-[#00e676]/15 border-[#00e676] glow-emerald'
              : tone === 'ok'
                ? 'bg-[#ff9100]/15 border-[#ff9100] glow-amber'
                : 'bg-[#ff1744]/10 border-[#ff1744]/60'
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider">
            {tone === 'good' ? (
              <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
            ) : tone === 'ok' ? (
              <MinusCircle className="w-4 h-4 text-[#ff9100]" />
            ) : (
              <XCircle className="w-4 h-4 text-[#ff1744]" />
            )}
            <span className={tone === 'good' ? 'text-[#00e676]' : tone === 'ok' ? 'text-[#ff9100]' : 'text-[#ff1744]'}>{lr.label}</span>
          </div>
          <div className={`font-telemetry font-black text-4xl mt-1 ${lr.points > 0 ? 'text-[#f0f4f8]' : 'text-[#829ab1]'}`}>
            {lr.points > 0 ? `+${lr.points}` : '+0'}
          </div>
          {answerText && (
            <div className="mt-2 text-xs text-[#f0f4f8]/90 border-t border-white/10 pt-2">
              <span className="text-[10px] uppercase tracking-wider text-[#829ab1] block">The answer</span>
              {answerText}
            </div>
          )}
        </div>
      )}

      <div className="bg-[#0d1522] border border-[#1e314f] rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        <div className="space-y-1">
          <div className="text-4xl">{avatarIcon(player.avatar)}</div>
          <h2 className="text-lg font-black text-[#f0f4f8]">{player.name}</h2>
          {headline && <div className="text-xs font-bold text-[#00e5ff] uppercase tracking-wider">{headline}</div>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#131f33] border border-[#1e314f] p-4 rounded-2xl">
            <div className="text-[10px] text-[#829ab1] uppercase font-bold">Rank</div>
            <div className="font-telemetry font-black text-3xl text-[#00e5ff] mt-1">{tied ? '=' : '#'}{rank}</div>
            <div className="text-[9px] text-[#829ab1]">of {ranked.length}</div>
          </div>
          <div className="bg-[#131f33] border border-[#1e314f] p-4 rounded-2xl">
            <div className="text-[10px] text-[#829ab1] uppercase font-bold">Points</div>
            <div className="font-telemetry font-black text-3xl text-[#00e676] mt-1">{player.score}</div>
            <div className="text-[9px] text-[#829ab1]">total</div>
          </div>
        </div>

        {showStreak && player.streak > 1 && (
          <div className="p-3 rounded-2xl bg-[#ff9100]/15 border border-[#ff9100]/50 flex items-center justify-center gap-2 text-xs font-bold text-[#ff9100]">
            <Flame className="w-4 h-4" />
            <span>{player.streak} in a row</span>
          </div>
        )}

        <div className="text-xs text-[#829ab1]">{subline}</div>
      </div>
    </div>
  );
};
