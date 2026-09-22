import React from 'react';
import { BrainrotQuestion, BrainrotSubPhase, Player } from '@/lib/types';
import { getRankedPlayers } from '@/lib/gameLogic';
import { avatarIcon } from '@/lib/content';
import { CheckCircle2, Flame, Award, Zap, ArrowRight, HelpCircle } from 'lucide-react';
import { GetReady } from './GetReady';

interface HostBrainrotQuizProps {
  question: BrainrotQuestion;
  questionIndex: number;
  totalQuestions: number;
  subPhase: BrainrotSubPhase;
  players: Record<string, Player>;
  /** Number of players who picked each option (host reveal). */
  distribution: number[];
  preRoll: number;
  onNextPhase: () => void;
}

const LETTERS = ['A', 'B', 'C', 'D'];
const COLORS = [
  { border: 'border-[#00e5ff]', badge: 'bg-[#00e5ff] text-[#06090e]', bar: 'bg-[#00e5ff]' },
  { border: 'border-[#00e676]', badge: 'bg-[#00e676] text-[#06090e]', bar: 'bg-[#00e676]' },
  { border: 'border-[#ff9100]', badge: 'bg-[#ff9100] text-[#06090e]', bar: 'bg-[#ff9100]' },
  { border: 'border-[#ff1744]', badge: 'bg-[#ff1744] text-[#06090e]', bar: 'bg-[#ff1744]' },
];

export const HostBrainrotQuiz: React.FC<HostBrainrotQuizProps> = ({
  question,
  questionIndex,
  totalQuestions,
  subPhase,
  players,
  distribution,
  preRoll,
  onNextPhase,
}) => {
  const playerList = Object.values(players);
  const answered = playerList.filter(p => p.pendingAnswer).length;
  const totalAnswers = distribution.reduce((a, b) => a + b, 0);
  const ranked = getRankedPlayers(players).slice(0, 8);
  const isReveal = subPhase === 'REVEAL';
  const isLast = questionIndex + 1 >= totalQuestions;
  const nextLabel = subPhase === 'QUESTION' ? 'Reveal answer' : subPhase === 'REVEAL' ? 'Leaderboard' : isLast ? 'Start Quiplash' : 'Next question';

  return (
    <div className="flex-grow flex flex-col px-6 py-4 max-w-7xl mx-auto w-full font-mono select-none gap-4 relative">
      {subPhase === 'QUESTION' && preRoll > 0 && <GetReady seconds={preRoll} label={`Question ${questionIndex + 1}`} />}

      <div className="flex items-center justify-between bg-[#0d1522] border border-[#1e314f] rounded-2xl px-5 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#00e5ff] bg-[#131f33] border border-[#1e314f] px-2.5 py-1 rounded-lg">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs font-bold text-[#829ab1] hidden sm:inline">Brainrot Decryptor · what does it actually mean?</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-[#829ab1] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span>Answered</span>
            <strong className="text-[#f0f4f8] font-telemetry text-sm">
              {answered} / {playerList.length}
            </strong>
          </div>
          <button
            onClick={onNextPhase}
            className="px-3 py-1.5 rounded-xl bg-[#131f33] hover:bg-[#1e314f] border border-[#1e314f] text-xs font-bold text-[#00e5ff] flex items-center gap-1.5 transition-all"
          >
            <span>{nextLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {subPhase !== 'LEADERBOARD' ? (
        <div className="my-auto space-y-4">
          <div className="bg-[#0d1522] border-2 border-[#00e5ff]/50 rounded-3xl px-8 pt-7 pb-6 relative text-center glow-cyan">
            <div className="absolute top-3 left-4 text-[10px] font-black tracking-widest text-[#00e5ff] uppercase flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Decode this</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-[2.4rem] font-black text-[#f0f4f8] leading-snug tracking-tight max-w-5xl mx-auto">
              &ldquo;{question.slangPrompt}&rdquo;
            </h2>
            {isReveal && (
              <div className="mt-4 pt-3 border-t border-[#00e676]/30 text-base md:text-lg font-bold text-[#00e676] animate-fade-in">
                {question.explanation}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((opt, idx) => {
              const c = COLORS[idx];
              const count = distribution[idx] ?? 0;
              const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
              const style = !isReveal
                ? `bg-[#0d1522] border-2 ${c.border} text-[#f0f4f8]`
                : opt.isCorrect
                  ? 'bg-[#00e676]/20 border-2 border-[#00e676] glow-emerald text-white'
                  : 'bg-[#0d1522]/50 border border-[#1e314f] opacity-50 text-[#829ab1]';
              return (
                <div key={idx} className={`px-4 py-3.5 rounded-2xl transition-all duration-300 flex flex-col gap-2 ${style}`}>
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shrink-0 font-telemetry ${
                        isReveal && opt.isCorrect ? 'bg-[#00e676] text-[#06090e]' : c.badge
                      }`}
                    >
                      {LETTERS[idx]}
                    </div>
                    <div className="text-base md:text-lg font-bold leading-snug flex-grow">{opt.text}</div>
                    {isReveal && opt.isCorrect && <CheckCircle2 className="w-6 h-6 text-[#00e676] shrink-0" />}
                  </div>
                  {isReveal && (
                    <div className="flex items-center gap-3 pl-12">
                      <div className="h-2 flex-grow bg-[#06090e] rounded-full overflow-hidden border border-[#1e314f]">
                        <div className={`h-full ${opt.isCorrect ? 'bg-[#00e676]' : c.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-telemetry font-bold w-20 text-right">
                        {count} · {pct}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="my-auto max-w-3xl mx-auto w-full bg-[#0d1522] border border-[#1e314f] rounded-3xl p-6 space-y-4">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-widest text-[#00e5ff] flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4 text-[#ff9100]" />
              <span>Standings after question {questionIndex + 1}</span>
            </span>
          </div>

          <div className="space-y-2">
            {ranked.map((player, idx) => (
              <div
                key={player.id}
                className={`px-4 py-2.5 rounded-2xl border flex items-center justify-between ${
                  idx === 0 ? 'bg-[#00e5ff]/15 border-[#00e5ff] glow-cyan' : 'bg-[#131f33] border-[#1e314f]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-telemetry font-black text-sm shrink-0 ${
                      idx === 0 ? 'bg-[#00e5ff] text-[#06090e]' : 'bg-[#06090e] text-[#829ab1]'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xl">{avatarIcon(player.avatar)}</span>
                  <span className="font-bold text-[#f0f4f8] text-base truncate">{player.name}</span>
                  {player.streak > 1 && (
                    <span className="text-xs text-[#ff9100] font-bold flex items-center gap-1 bg-[#ff9100]/15 border border-[#ff9100]/40 px-2 py-0.5 rounded-full shrink-0">
                      <Flame className="w-3.5 h-3.5" />
                      {player.streak} in a row
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {player.lastRound && player.lastRound.points > 0 && (
                    <span className="text-xs font-telemetry font-bold text-[#00e676]">+{player.lastRound.points}</span>
                  )}
                  <span className="font-telemetry font-black text-xl text-[#00e5ff] w-20 text-right">{player.score}</span>
                </div>
              </div>
            ))}
            {ranked.length === 0 && <div className="text-center text-xs text-[#829ab1] py-6">No players yet.</div>}
          </div>

          <button
            onClick={onNextPhase}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0066ff] to-[#00e5ff] text-[#06090e] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>{isLast ? 'On to Quiplash' : 'Next question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
