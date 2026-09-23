'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TurbineLogo } from '@/components/ui/TurbineLogo';
import { DEFAULT_ROOM, normaliseRoomCode } from '@/lib/room';
import { SystemPanel } from '@/components/landing/SystemPanel';
import { Tv, Smartphone, ExternalLink, Zap } from 'lucide-react';

export default function HomeClient() {
  const [roomInput, setRoomInput] = useState(DEFAULT_ROOM);
  const room = normaliseRoomCode(roomInput);

  const launchDualScreen = () => {
    const origin = window.location.origin;
    window.open(`${origin}/host?room=${room}`, 'HalfHandsHost', 'width=1400,height=850,left=40,top=40');
    window.open(`${origin}/play?room=${room}`, 'HalfHandsPlayer', 'width=420,height=840,left=1460,top=40');
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-[#f0f4f8] flex flex-col gap-10 aerospace-grid-bg font-mono select-none relative p-6">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none" />

      <header className="flex items-center justify-between max-w-6xl mx-auto w-full border-b border-[#1e314f] pb-4">
        <div className="flex items-center gap-3">
          <TurbineLogo size={38} animate />
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">Rolls-Royce Civil Aerospace · MEA</span>
            <div className="text-base font-black uppercase tracking-tight">Half Hands Live</div>
          </div>
        </div>
      </header>

      <SystemPanel room={room} />

      <main className="max-w-4xl mx-auto w-full mt-12 text-center space-y-8 relative z-10 py-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#0d1522] border border-[#00e5ff]/40 px-4 py-1.5 rounded-full text-xs font-black text-[#00e5ff] tracking-widest uppercase">
            <Zap className="w-3.5 h-3.5 text-[#ff9100]" />
            <span>Thu 1 Oct · 10:40 · The Gen Z-Friendly Energiser</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight leading-tight">Half Hands Live</h1>
          <p className="text-sm md:text-base text-[#829ab1] max-w-2xl mx-auto leading-relaxed">
            Three quick games for ~100 people on Teams. The host shares this screen; everyone else plays from their phone. No app, no login.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs">
          <label className="text-[#829ab1] uppercase font-bold tracking-wider">Room</label>
          <input
            value={roomInput}
            onChange={e => setRoomInput(e.target.value.toUpperCase())}
            maxLength={10}
            className="w-32 px-3 py-2 bg-[#06090e] border border-[#1e314f] focus:border-[#00e5ff] rounded-xl text-center font-black text-[#00e5ff] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <Link
            href={`/host?room=${room}`}
            className="group bg-[#0d1522] border-2 border-[#1e314f] hover:border-[#00e5ff] rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0066ff]/20 border border-[#0066ff] flex items-center justify-center text-[#00e5ff]">
                <Tv className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00e5ff]">Share this on Teams</span>
                <h2 className="text-2xl font-black group-hover:text-[#00e5ff] transition-colors uppercase">Host screen</h2>
                <p className="text-xs text-[#829ab1] mt-1 leading-relaxed">QR code lobby, timers, live results, leaderboard. Space bar drives everything.</p>
              </div>
            </div>
            <div className="pt-4 border-t border-[#1e314f] mt-4 text-xs font-bold text-[#00e5ff]">Open host screen →</div>
          </Link>

          <Link
            href={`/play?room=${room}`}
            className="group bg-[#0d1522] border-2 border-[#1e314f] hover:border-[#00e676] rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00e676]/20 border border-[#00e676] flex items-center justify-center text-[#00e676]">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00e676]">On your phone</span>
                <h2 className="text-2xl font-black group-hover:text-[#00e676] transition-colors uppercase">Join as a player</h2>
                <p className="text-xs text-[#829ab1] mt-1 leading-relaxed">Enter a name, pick an avatar, and your phone becomes the controller.</p>
              </div>
            </div>
            <div className="pt-4 border-t border-[#1e314f] mt-4 text-xs font-bold text-[#00e676]">Join →</div>
          </Link>
        </div>

        <button
          onClick={launchDualScreen}
          className="px-6 py-3 rounded-2xl bg-[#131f33] hover:bg-[#1e314f] border border-[#00e5ff]/40 text-xs font-bold text-[#00e5ff] inline-flex items-center gap-2 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open host + player windows side by side (for testing)</span>
        </button>
      </main>

      <footer className="max-w-6xl mx-auto w-full border-t border-[#1e314f] pt-4 text-[10px] text-[#829ab1] text-center">
        Built for the MEA Half Hands · internal use
      </footer>
    </div>
  );
}
