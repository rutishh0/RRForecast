import React from 'react';
import { QuiplashPrompt, QuiplashSubPhase, Player } from '@/lib/types';
import { getRankedPlayers, quiplashStandings } from '@/lib/gameLogic';
import { GAME_CONFIG, avatarIcon } from '@/lib/content';
import { MessageSquare, Award, ArrowRight, Smartphone } from 'lucide-react';
import { GetReady } from './GetReady';

interface HostQuiplashProps {
  prompt: QuiplashPrompt;
  roundIndex: number;
  totalRounds: number;
  subPhase: QuiplashSubPhase;
  players: Record<string, Player>;
  preRoll: number;
  onNextPhase: () => void;
}

const SHOW_DURING_VOTING = 10;

export const HostQuiplash: React.FC<HostQuiplashProps> = ({ prompt, roundIndex, totalRounds, subPhase, players, preRoll, onNextPhase }) => {
  const playerList = Object.values(players);
  const submissions = prompt.submissions;
  const standings = quiplashStandings(prompt);
  const voted = playerList.filter(p => p.hasSubmitted).length;
  const maxVotes = standings[0]?.votes.length ?? 0;
  const winners = standings.filter(s => maxVotes > 0 && s.votes.length === maxVotes);
  const top3 = standings.slice(0, 3);
  const overall = getRankedPlayers(players).slice(0, 5);
  const isLast = roundIndex + 1 >= totalRounds;
  const nextLabel = subPhase === 'SUBMIT' ? 'Open voting' : subPhase === 'VOTING' ? 'Reveal authors' : isLast ? 'Start Red / Green' : 'Next round';

  return (
    <div className="flex-grow flex flex-col px-6 py-4 max-w-7xl mx-auto w-full font-mono select-none gap-4 relative">
      {(subPhase === 'SUBMIT' || subPhase === 'VOTING') && preRoll > 0 && (
        <GetReady seconds={preRoll} label={subPhase === 'SUBMIT' ? `Round ${roundIndex + 1} · write` : `Round ${roundIndex + 1} · vote`} />
      )}

      <div className="flex items-center justify-between bg-[#0d1522] border border-[#1e314f] rounded-2xl px-5 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#ff9100] bg-[#131f33] border border-[#1e314f] px-2.5 py-1 rounded-lg">
            Quiplash · Round {roundIndex + 1} of {totalRounds}
          </span>
          <span className="text-xs font-bold text-[#829ab1] hidden sm:inline">
            {subPhase === 'SUBMIT' ? 'Write a punchline on your phone' : subPhase === 'VOTING' ? 'Vote on your phone' : 'And the authors are…'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-[#829ab1]">
            {subPhase === 'SUBMIT' ? 'Punchlines' : 'Votes'}{' '}
            <strong className="text-[#f0f4f8] font-telemetry text-sm">
              {subPhase === 'SUBMIT' ? submissions.length : voted} / {playerList.length}
            </strong>
          </div>
          <button
            onClick={onNextPhase}
            className="px-3 py-1.5 rounded-xl bg-[#131f33] hover:bg-[#1e314f] border border-[#1e314f] text-xs font-bold text-[#ff9100] flex items-center gap-1.5 transition-all"
          >
            <span>{nextLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="my-auto space-y-4">
        <div className="bg-[#0d1522] border-2 border-[#ff9100]/60 rounded-3xl px-8 py-5 text-center glow-amber">
          <div className="text-[10px] font-black tracking-widest text-[#ff9100] uppercase flex items-center justify-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Finish the sentence</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#f0f4f8] leading-snug tracking-tight mt-1.5 max-w-5xl mx-auto">{prompt.prompt}</h2>
        </div>

        {/* WRITE ------------------------------------------------------------ */}
        {subPhase === 'SUBMIT' && (
          <div className="bg-[#0d1522] border border-[#1e314f] rounded-3xl p-7 text-center space-y-3 max-w-2xl mx-auto">
            <Smartphone className="w-9 h-9 text-[#ff9100] mx-auto animate-bounce" />
            <div className="text-2xl font-black text-[#f0f4f8]">Type your punchline on your phone</div>
            <p className="text-sm text-[#829ab1] max-w-md mx-auto">
              120 characters, anonymous until the reveal. Then everyone votes on a few — {GAME_CONFIG.points.quiplashPerVote} points per vote,{' '}
              {GAME_CONFIG.points.quiplashRoundWinner} bonus for the round winner.
            </p>
            <div className="text-xs text-[#00e5ff] pt-1">
              Punchlines in: <strong className="text-3xl text-[#f0f4f8] font-telemetry align-middle">{submissions.length}</strong>
            </div>
          </div>
        )}

        {/* VOTING: everyone's punchlines, anonymous, no counts — the reveal is the payoff ---- */}
        {subPhase === 'VOTING' && (
          <div className="max-w-6xl mx-auto w-full space-y-3">
            {submissions.length === 0 && (
              <div className="bg-[#0d1522] border border-[#1e314f] rounded-3xl p-8 text-center text-sm text-[#829ab1]">Nobody sent a punchline this round.</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {submissions.slice(0, SHOW_DURING_VOTING).map((s, i) => (
                <div key={s.id} className="bg-[#0d1522] border border-[#1e314f] rounded-2xl px-4 py-3 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#131f33] text-[#829ab1] flex items-center justify-center font-telemetry font-black text-xs shrink-0">{i + 1}</span>
                  <div className="text-base md:text-lg font-bold text-[#f0f4f8] leading-snug">&ldquo;{s.text}&rdquo;</div>
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-[#829ab1]">
              {submissions.length > SHOW_DURING_VOTING
                ? `${submissions.length} punchlines in — showing ${SHOW_DURING_VOTING}. Every phone is voting on a different handful.`
                : 'Every phone is voting on a handful of these. Results after the timer.'}
            </div>
          </div>
        )}

        {/* REVEAL: top 3 with authors + round standings ------------------------------------ */}
        {subPhase === 'REVEAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-6xl mx-auto w-full">
            <div className="lg:col-span-8 space-y-3">
              {submissions.length === 0 && (
                <div className="bg-[#0d1522] border border-[#1e314f] rounded-3xl p-8 text-center text-sm text-[#829ab1]">Nobody sent a punchline this round.</div>
              )}
              {top3.map((s, i) => {
                const won = winners.includes(s);
                return (
                  <div
                    key={s.id}
                    className={`rounded-3xl px-5 py-4 border-2 transition-all duration-500 animate-fade-in ${
                      won ? 'bg-[#00e5ff]/15 border-[#00e5ff] glow-cyan' : 'bg-[#0d1522] border-[#1e314f]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-telemetry font-black text-sm shrink-0 ${
                          won ? 'bg-[#00e5ff] text-[#06090e]' : 'bg-[#131f33] text-[#829ab1]'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-grow min-w-0">
                        <div className="text-lg md:text-2xl font-black text-[#f0f4f8] leading-snug">&ldquo;{s.text}&rdquo;</div>
                        <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 text-sm font-bold text-[#f0f4f8]">
                            <span className="text-xl">{avatarIcon(s.avatar)}</span>
                            <span className={won ? 'text-[#00e5ff]' : ''}>{s.playerName}</span>
                            {won && (
                              <span className="ml-1 text-[10px] font-black text-[#00e676] flex items-center gap-1 uppercase">
                                <Award className="w-4 h-4" />
                                {winners.length > 1 ? `Tied for the win · +${GAME_CONFIG.points.quiplashRoundWinner} each` : `Round winner +${GAME_CONFIG.points.quiplashRoundWinner}`}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-telemetry font-bold text-[#f0f4f8]">
                            {s.votes.length} {s.votes.length === 1 ? 'vote' : 'votes'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-4 bg-[#0d1522] border border-[#1e314f] rounded-3xl p-4 space-y-2 self-start">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#ff9100]" /> Standings after round {roundIndex + 1}
              </div>
              {overall.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-telemetry font-black text-[#829ab1] w-5">{i + 1}</span>
                    <span>{avatarIcon(p.avatar)}</span>
                    <span className="font-bold text-[#f0f4f8] truncate">{p.name}</span>
                  </div>
                  <span className="font-telemetry font-black text-[#00e5ff] shrink-0 pl-2">{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
