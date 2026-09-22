import React from 'react';
import { TurbineLogo } from '../ui/TurbineLogo';
import { HudTimer } from '../ui/HudTimer';
import { Volume2, VolumeX, Users, FastForward, Plus, WifiOff } from 'lucide-react';
import { GameMode } from '@/lib/types';

interface HostHeaderProps {
  roomCode: string;
  gameMode: GameMode;
  timerSeconds: number;
  timerTotal: number;
  isTimerRunning: boolean;
  playerCount: number;
  connected: boolean;
  isAudioMuted: boolean;
  onToggleMute: () => void;
  onNextPhase: () => void;
  onAddTime: () => void;
}

const MODE_LABELS: Record<GameMode, string> = {
  LOBBY: 'Lobby',
  BRAINROT: 'Game 1 · Brainrot Decryptor',
  QUIPLASH: 'Game 2 · MEA Quiplash',
  FLAGS: 'Game 3 · Red Flag / Green Flag',
  PODIUM: 'Final standings',
};

export const HostHeader: React.FC<HostHeaderProps> = ({
  roomCode,
  gameMode,
  timerSeconds,
  timerTotal,
  isTimerRunning,
  playerCount,
  connected,
  isAudioMuted,
  onToggleMute,
  onNextPhase,
  onAddTime,
}) => {
  return (
    <header className="bg-[#0d1522]/90 backdrop-blur-md border-b border-[#1e314f] px-5 py-2.5 flex items-center justify-between gap-4 relative z-30 select-none whitespace-nowrap">
      <div className="flex items-center gap-3 shrink-0">
        <TurbineLogo size={38} animate={isTimerRunning || gameMode === 'LOBBY'} />
        <div>
          <div className="text-[10px] font-black tracking-widest text-[#00e5ff] uppercase font-mono">Rolls-Royce Civil Aerospace · MEA</div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-black text-[#f0f4f8] tracking-tight uppercase">Half Hands Live</h1>
            <span className="text-[10px] font-mono font-bold bg-[#131f33] border border-[#1e314f] text-[#ff9100] px-2 py-0.5 rounded">ROOM {roomCode}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 min-w-0">
        <div className="text-right hidden lg:block min-w-0">
          <div className="text-[10px] font-mono uppercase text-[#829ab1] tracking-wider">Now</div>
          <div className="text-xs font-black font-mono text-[#00e5ff] tracking-wide uppercase truncate">{MODE_LABELS[gameMode]}</div>
        </div>
        {isTimerRunning && (
          <div className="flex flex-col items-center shrink-0">
            <HudTimer seconds={timerSeconds} totalSeconds={timerTotal} size={64} />
            {timerSeconds === 0 && <span className="text-[9px] uppercase tracking-widest text-[#ff9100] animate-pulse -mt-0.5">closing…</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2 bg-[#131f33] border border-[#1e314f] px-3 py-1.5 rounded-xl text-xs font-mono">
          {connected ? <Users className="w-4 h-4 text-[#00e5ff]" /> : <WifiOff className="w-4 h-4 text-[#ff1744] animate-pulse" />}
          <span className="text-[#f0f4f8] font-telemetry font-black text-sm">{playerCount}</span>
          <span className="text-[#829ab1] hidden xl:inline text-[10px] uppercase font-bold">joined</span>
        </div>

        {isTimerRunning && (
          <button
            onClick={onAddTime}
            title="Add 10 seconds to the timer (T)"
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#131f33] border border-[#1e314f] text-[#ff9100] font-black text-xs font-mono hover:border-[#ff9100]/60 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> 10s
          </button>
        )}

        <button
          onClick={onToggleMute}
          title={isAudioMuted ? 'Unmute (M)' : 'Mute (M)'}
          className={`p-2.5 rounded-xl border transition-all ${
            isAudioMuted
              ? 'bg-[#131f33] border-[#1e314f] text-[#829ab1]'
              : 'bg-[#131f33] border-[#00e5ff]/50 text-[#00e5ff]'
          }`}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onNextPhase}
          title="Next (Space or Enter)"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#00e5ff] hover:opacity-90 text-[#06090e] font-black text-xs font-mono shadow-lg transition-all active:scale-95"
        >
          <FastForward className="w-4 h-4" />
          <span>NEXT</span>
          <span className="text-[9px] opacity-75 hidden xl:inline">[SPACE / ENTER]</span>
        </button>
      </div>
    </header>
  );
};
