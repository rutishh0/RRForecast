import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player } from '@/lib/types';
import { getRankedPlayers } from '@/lib/gameLogic';
import { avatarIcon } from '@/lib/content';
import { sounds } from '@/lib/audioEngine';
import { Award, Trophy, RotateCcw, Medal, Sparkles } from 'lucide-react';

interface HostPodiumProps {
  players: Record<string, Player>;
  onResetGame: () => void;
}

const Place = ({ p, tone, size }: { p: Player; tone: string; size: 'lg' | 'md' }) => (
  <div className="text-center space-y-1 mb-2">
    <div className={size === 'lg' ? 'text-5xl' : 'text-3xl'}>{avatarIcon(p.avatar)}</div>
    <div className={`font-black ${size === 'lg' ? 'text-xl' : 'text-base'} ${tone} max-w-[240px] mx-auto truncate`}>{p.name}</div>
    <div className={`font-telemetry font-black ${size === 'lg' ? 'text-xl text-[#00e676]' : 'text-sm text-[#829ab1]'}`}>{p.score} pts</div>
    {p.isAbuDhabiOffice && <span className="text-[9px] bg-[#ff9100]/20 text-[#ff9100] px-2 py-0.5 rounded font-bold">ABU DHABI</span>}
  </div>
);

export const HostPodium: React.FC<HostPodiumProps> = ({ players, onResetGame }) => {
  const ranked = getRankedPlayers(players);
  const [first, second, third] = ranked;
  const remaining = ranked.slice(3);

  useEffect(() => {
    sounds.playApplause();
    const defaults = { origin: { y: 0.7 }, colors: ['#00e5ff', '#0066ff', '#ff9100', '#00e676', '#f0f4f8'] };
    const fire = (ratio: number, opts: confetti.Options) => confetti({ ...defaults, ...opts, particleCount: Math.floor(200 * ratio) });
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const reset = () => {
    if (window.confirm('Back to the lobby? Everyone stays joined; all scores reset to zero.')) onResetGame();
  };

  return (
    <div className="flex-grow flex flex-col px-6 py-3 max-w-7xl mx-auto w-full font-mono select-none">
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 bg-[#131f33] border border-[#00e5ff]/40 px-4 py-1.5 rounded-full text-xs font-black text-[#00e5ff] tracking-widest uppercase">
          <Trophy className="w-4 h-4 text-[#ff9100]" />
          <span>Half Hands Live · Final standings</span>
          <Trophy className="w-4 h-4 text-[#ff9100]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[#f0f4f8] uppercase tracking-tight">MEA Honour Roll</h1>
      </div>

      <div className="my-3 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-4 items-end pt-2">
          <div className="flex flex-col items-center">
            {second && (
              <>
                <Place p={second} tone="text-[#f0f4f8]" size="md" />
                <div className="w-full h-28 bg-gradient-to-t from-[#0d1522] to-[#1e314f] border-t-4 border-[#829ab1] rounded-t-3xl p-3 flex flex-col items-center justify-between">
                  <span className="text-3xl font-black text-[#829ab1] font-telemetry">2</span>
                  <Medal className="w-7 h-7 text-[#829ab1]" />
                  <span className="text-[10px] uppercase font-bold text-[#829ab1]">Silver</span>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col items-center">
            {first && (
              <>
                <Place p={first} tone="text-[#00e5ff]" size="lg" />
                <div className="w-full h-40 bg-gradient-to-t from-[#0d1522] via-[#0066ff]/20 to-[#00e5ff]/30 border-t-4 border-[#00e5ff] rounded-t-3xl p-3 flex flex-col items-center justify-between glow-cyan">
                  <span className="text-4xl font-black text-[#00e5ff] font-telemetry">1</span>
                  <Trophy className="w-11 h-11 text-[#ff9100] animate-pulse" />
                  <span className="text-xs uppercase font-black text-[#00e5ff] tracking-widest">Champion</span>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col items-center">
            {third && (
              <>
                <Place p={third} tone="text-[#f0f4f8]" size="md" />
                <div className="w-full h-20 bg-gradient-to-t from-[#0d1522] to-[#1e314f] border-t-4 border-[#ff9100] rounded-t-3xl p-3 flex flex-col items-center justify-between">
                  <span className="text-3xl font-black text-[#ff9100] font-telemetry">3</span>
                  <Medal className="w-6 h-6 text-[#ff9100]" />
                  <span className="text-[10px] uppercase font-bold text-[#ff9100]">Bronze</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0d1522] border border-[#1e314f] rounded-3xl p-5 max-w-5xl mx-auto w-full space-y-3">
        <div className="flex items-center justify-between border-b border-[#1e314f] pb-2.5">
          <span className="text-xs font-bold text-[#f0f4f8] uppercase flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00e5ff]" />
            <span>{remaining.length > 0 ? `Places 4 – ${ranked.length}` : 'Full results'}</span>
          </span>
          <span className="text-[10px] text-[#829ab1]">{ranked.length} {ranked.length === 1 ? 'player' : 'players'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1">
          {remaining.map((p, idx) => (
            <div key={p.id} className="bg-[#131f33] border border-[#1e314f] px-3 py-2 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#829ab1] font-telemetry font-bold text-[10px] w-6">{idx + 4}</span>
                <span>{avatarIcon(p.avatar)}</span>
                <span className="truncate font-bold text-[#f0f4f8]">{p.name}</span>
              </div>
              <span className="font-telemetry font-bold text-[#00e5ff] shrink-0 pl-2">{p.score}</span>
            </div>
          ))}
          {remaining.length === 0 && <div className="col-span-full text-center py-3 text-xs text-[#829ab1]">Everyone finished on the podium.</div>}
        </div>

        <div className="pt-3 border-t border-[#1e314f] flex items-center justify-between">
          <button
            onClick={() => {
              confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#00e5ff', '#ff9100', '#00e676'] });
              sounds.playSuccess();
            }}
            className="px-4 py-2 bg-[#131f33] hover:bg-[#1e314f] border border-[#1e314f] text-[#00e5ff] text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>More confetti</span>
          </button>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#131f33] hover:bg-[#1e314f] border border-[#1e314f] text-[#829ab1] hover:text-[#f0f4f8] text-xs font-black rounded-xl flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Back to lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
