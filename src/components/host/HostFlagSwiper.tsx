import React from 'react';
import { FlagScenario, FlagSubPhase, Player } from '@/lib/types';
import { flagCounts } from '@/lib/gameLogic';
import { ThumbsDown, ThumbsUp, ArrowRight, Scale, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';
import { GetReady } from './GetReady';

interface HostFlagSwiperProps {
  scenario: FlagScenario;
  scenarioIndex: number;
  totalScenarios: number;
  subPhase: FlagSubPhase;
  players: Record<string, Player>;
  preRoll: number;
  onNextPhase: () => void;
}

export const HostFlagSwiper: React.FC<HostFlagSwiperProps> = ({ scenario, scenarioIndex, totalScenarios, subPhase, players, preRoll, onNextPhase }) => {
  const playerList = Object.values(players);
  const { red, green, total } = flagCounts(scenario);
  const isReveal = subPhase === 'REVEAL';
  // Percentages are only shown at reveal — otherwise the room can copy the majority for the bonus.
  const redPct = isReveal && total > 0 ? Math.round((red / total) * 100) : 50;
  const greenPct = isReveal && total > 0 ? 100 - redPct : 50;
  const isLast = scenarioIndex + 1 >= totalScenarios;

  const verdict =
    total === 0
      ? { text: 'No votes', tone: 'text-[#829ab1]', Icon: Scale }
      : redPct >= 65
        ? { text: `Red flag — ${redPct}% of the room`, tone: 'text-[#ff1744]', Icon: AlertTriangle }
        : greenPct >= 65
          ? { text: `Green flag — ${greenPct}% of the room`, tone: 'text-[#00e676]', Icon: CheckCircle }
          : { text: 'The room is split', tone: 'text-[#ff9100]', Icon: Scale };

  return (
    <div className="flex-grow flex flex-col px-6 py-4 max-w-7xl mx-auto w-full font-mono select-none gap-4 relative">
      {subPhase === 'SWIPE' && preRoll > 0 && <GetReady seconds={preRoll} label={`Scenario ${scenarioIndex + 1}`} />}

      <div className="flex items-center justify-between bg-[#0d1522] border border-[#1e314f] rounded-2xl px-5 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#00e676] bg-[#131f33] border border-[#1e314f] px-2.5 py-1 rounded-lg">
            Scenario {scenarioIndex + 1} of {totalScenarios}
          </span>
          <span className="text-xs font-bold text-[#829ab1] hidden sm:inline">Red flag or green flag?</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-[#829ab1]">
            Votes{' '}
            <strong className="text-[#f0f4f8] font-telemetry text-sm">
              {total} / {playerList.length}
            </strong>
          </div>
          <button
            onClick={onNextPhase}
            className="px-3 py-1.5 rounded-xl bg-[#131f33] hover:bg-[#1e314f] border border-[#1e314f] text-xs font-bold text-[#00e676] flex items-center gap-1.5 transition-all"
          >
            <span>{!isReveal ? 'Reveal' : isLast ? 'Final standings' : 'Next scenario'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="my-auto space-y-5">
        <div className="bg-[#0d1522] border-2 border-[#1e314f] rounded-3xl px-8 py-6 text-center">
          <div className="text-[10px] font-black tracking-widest text-[#829ab1] uppercase mb-2">{scenario.context}</div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#f0f4f8] leading-snug tracking-tight max-w-4xl mx-auto">&ldquo;{scenario.statement}&rdquo;</h2>
        </div>

        <div className="bg-[#0d1522] border border-[#1e314f] rounded-3xl p-7 space-y-5 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#ff1744]/20 border border-[#ff1744] flex items-center justify-center text-[#ff1744]">
                <ThumbsDown className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-black uppercase text-[#ff1744] tracking-wider">Red flag</div>
                <div className="font-telemetry font-black text-5xl text-[#ff1744]">{isReveal ? `${redPct}%` : '?'}</div>
                {isReveal && <div className="text-[10px] text-[#829ab1]">{red} {red === 1 ? 'person' : 'people'}</div>}
              </div>
            </div>
            {!isReveal && (
              <div className="text-center text-[#829ab1] text-xs flex flex-col items-center gap-1">
                <Smartphone className="w-6 h-6 text-[#00e5ff] animate-bounce" />
                <span>Vote on your phone</span>
                <span className="font-telemetry text-2xl font-black text-[#f0f4f8]">{total}</span>
                <span>votes in</span>
              </div>
            )}
            <div className="flex items-center gap-3 flex-row-reverse text-right">
              <div className="w-14 h-14 rounded-2xl bg-[#00e676]/20 border border-[#00e676] flex items-center justify-center text-[#00e676]">
                <ThumbsUp className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-black uppercase text-[#00e676] tracking-wider">Green flag</div>
                <div className="font-telemetry font-black text-5xl text-[#00e676]">{isReveal ? `${greenPct}%` : '?'}</div>
                {isReveal && <div className="text-[10px] text-[#829ab1]">{green} {green === 1 ? 'person' : 'people'}</div>}
              </div>
            </div>
          </div>

          <div className="h-7 w-full bg-[#06090e] rounded-full overflow-hidden border-2 border-[#1e314f] flex">
            <div
              className={`h-full transition-all duration-700 ease-out ${isReveal ? 'bg-gradient-to-r from-[#ff1744] to-[#ff9100]' : 'bg-[#1e314f]'}`}
              style={{ width: `${redPct}%` }}
            />
            <div className="w-1 h-full bg-white/80 z-10" />
            <div
              className={`h-full transition-all duration-700 ease-out ${isReveal ? 'bg-gradient-to-r from-[#00e5ff] to-[#00e676]' : 'bg-[#1e314f]'}`}
              style={{ width: `${greenPct}%` }}
            />
          </div>

          {isReveal && (
            <div className="p-3.5 rounded-2xl bg-[#131f33] border border-[#1e314f] text-center animate-fade-in">
              <div className={`text-2xl font-black uppercase flex items-center justify-center gap-2 ${verdict.tone}`}>
                <verdict.Icon className="w-6 h-6" />
                <span>{verdict.text}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
