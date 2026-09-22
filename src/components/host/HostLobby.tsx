import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Player } from '@/lib/types';
import { TurbineLogo } from '../ui/TurbineLogo';
import { avatarIcon } from '@/lib/content';
import { Play, Building2, Globe2, Radio, ArrowRight, Trash2 } from 'lucide-react';
import { sounds } from '@/lib/audioEngine';

interface HostLobbyProps {
  roomCode: string;
  players: Record<string, Player>;
  joinUrl: string;
  onStartGame: () => void;
  onClearPlayers: () => void;
}

export const HostLobby: React.FC<HostLobbyProps> = ({ roomCode, players, joinUrl, onStartGame, onClearPlayers }) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playerList = Object.values(players).sort((a, b) => b.joinedAt - a.joinedAt);
  const abuDhabiCount = playerList.filter(p => p.isAbuDhabiOffice).length;
  const remoteCount = playerList.length - abuDhabiCount;
  const displayUrl = joinUrl.replace(/^https?:\/\//, '');

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startWithCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = 3;
    setCountdown(3);
    sounds.playTick();
    timerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setCountdown(0); // stays on "GO" until the host page swaps this component out
        sounds.playBassDrop();
        onStartGame();
      } else {
        setCountdown(remaining);
        sounds.playTick();
      }
    }, 1000);
  };

  const clearRoom = () => {
    if (playerList.length === 0) return;
    if (window.confirm(`Remove all ${playerList.length} players from room ${roomCode}? They will need to re-join.`)) onClearPlayers();
  };

  return (
    <div className="flex-grow flex flex-col p-6 max-w-7xl mx-auto w-full font-mono relative">
      {countdown !== null && (
        <div className="fixed inset-0 z-50 bg-[#06090e]/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
          <TurbineLogo size={120} animate className="mb-6 glow-cyan" />
          <div className="text-sm font-bold tracking-widest text-[#00e5ff] uppercase mb-2">Phones ready</div>
          <div className="font-telemetry font-black text-9xl text-[#f0f4f8]">{countdown === 0 ? 'GO' : countdown}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
        {/* Join panel */}
        <div className="lg:col-span-5 bg-[#0d1522]/90 border border-[#1e314f] rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center justify-between relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1 w-full border-b border-[#1e314f] pb-4">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#00e5ff] flex items-center justify-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Scan with your phone camera</span>
            </span>
            <div className="text-xs text-[#829ab1]">No app, no login — just a name</div>
          </div>

          <div className="my-5 p-4 bg-white rounded-2xl shadow-xl border-4 border-[#00e5ff]/40 inline-flex flex-col items-center">
            <QRCodeSVG value={joinUrl} size={220} level="M" includeMargin={false} />
          </div>

          <div className="w-full bg-[#131f33] border border-[#1e314f] rounded-2xl p-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#829ab1]">or type this in a browser</div>
            <div className="text-xl font-black text-[#f0f4f8] font-telemetry break-all leading-tight">{displayUrl}</div>
          </div>

          <button
            onClick={startWithCountdown}
            disabled={countdown !== null}
            className="w-full mt-5 py-4 rounded-2xl bg-gradient-to-r from-[#0066ff] via-[#00e5ff] to-[#00e676] hover:opacity-95 text-[#06090e] font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-[#00e5ff]/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start the energiser</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Players panel */}
        <div className="lg:col-span-7 bg-[#0d1522]/90 border border-[#1e314f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1e314f] pb-4 gap-3">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#00e5ff] uppercase flex items-center gap-2">
                  <span>Who&apos;s in</span>
                  <span className="w-2 h-2 rounded-full bg-[#00e676] animate-ping" />
                </span>
                <h2 className="text-2xl font-black text-[#f0f4f8] uppercase tracking-wide mt-0.5">
                  {playerList.length} {playerList.length === 1 ? 'player' : 'players'}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 bg-[#131f33] border border-[#ff9100]/50 text-[#ff9100] px-3 py-1.5 rounded-xl font-bold">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Abu Dhabi office: {abuDhabiCount}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#131f33] border border-[#00e5ff]/50 text-[#00e5ff] px-3 py-1.5 rounded-xl font-bold">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Remote: {remoteCount}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {playerList.map(player => (
                <div
                  key={player.id}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 animate-fade-in ${
                    player.isAbuDhabiOffice ? 'bg-[#131f33] border-[#ff9100]/60' : 'bg-[#131f33] border-[#00e5ff]/40'
                  }`}
                >
                  <span className="text-xl select-none">{avatarIcon(player.avatar)}</span>
                  <div className="min-w-0 flex-grow">
                    <div className="text-xs font-bold text-[#f0f4f8] leading-tight line-clamp-2">{player.name}</div>
                    <div className="text-[9px] font-mono text-[#829ab1]">
                      {player.isAbuDhabiOffice ? <span className="text-[#ff9100] font-bold">ABU DHABI</span> : 'REMOTE'}
                    </div>
                  </div>
                </div>
              ))}
              {playerList.length === 0 && (
                <div className="col-span-full py-16 text-center text-[#829ab1] text-xs">Waiting for the first phone to join…</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e314f] mt-4 flex items-center justify-between gap-4 text-xs text-[#829ab1]">
            <span className="truncate">Brainrot Decryptor → MEA Quiplash → Red / Green Flag · ~30 min</span>
            <button
              onClick={clearRoom}
              className="flex items-center gap-1.5 text-[10px] font-bold text-[#829ab1] hover:text-[#ff1744] transition-colors whitespace-nowrap shrink-0"
              title="Remove everyone (asks for confirmation)"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear room…
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
