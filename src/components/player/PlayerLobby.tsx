import React, { useState } from 'react';
import { AVATAR_OPTIONS } from '@/lib/content';
import { TurbineLogo } from '../ui/TurbineLogo';
import { User, Building2, Sparkles, ArrowRight } from 'lucide-react';

interface PlayerLobbyProps {
  roomCode: string;
  onJoin: (name: string, avatar: string, isOffice: boolean) => void;
  isJoining?: boolean;
  error?: string | null;
}

export const PlayerLobby: React.FC<PlayerLobbyProps> = ({ roomCode, onJoin, isJoining = false, error }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('Turbine');
  const [isOffice, setIsOffice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onJoin(name.trim(), selectedAvatar, isOffice);
  };

  return (
    <div className="flex-grow flex flex-col justify-center p-4 max-w-md mx-auto w-full font-mono select-none">
      <div className="bg-[#0d1522] border border-[#1e314f] rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2">
          <TurbineLogo size={52} animate={true} className="mx-auto" />
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">
              Rolls-Royce Civil Aerospace · MEA
            </span>
            <h1 className="text-xl font-black text-[#f0f4f8] uppercase tracking-tight">Half Hands Live</h1>
            <div className="text-xs text-[#829ab1] mt-0.5">
              ROOM <strong className="text-[#00e5ff]">{roomCode}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#829ab1] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span>Your name &amp; where you are</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={32}
              autoComplete="off"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sarah – Dubai"
              className="w-full px-4 py-3.5 bg-[#06090e] border border-[#1e314f] focus:border-[#00e5ff] rounded-2xl text-[#f0f4f8] text-base font-bold placeholder-[#829ab1]/50 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#829ab1] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff9100]" />
              <span>Pick an avatar</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AVATAR_OPTIONS.map(av => (
                <button
                  type="button"
                  key={av.id}
                  aria-label={`Avatar: ${av.label}`}
                  aria-pressed={selectedAvatar === av.id}
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                    selectedAvatar === av.id
                      ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-[#00e5ff] scale-105'
                      : 'bg-[#06090e] border-[#1e314f] text-[#829ab1]'
                  }`}
                >
                  <span className="text-2xl">{av.icon}</span>
                  <span className="text-[10px] font-bold text-center leading-tight">{av.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            role="checkbox"
            aria-checked={isOffice}
            aria-label="I'm in the Abu Dhabi office"
            onClick={() => setIsOffice(v => !v)}
            className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
              isOffice ? 'bg-[#ff9100]/15 border-[#ff9100] text-[#f0f4f8]' : 'bg-[#06090e] border-[#1e314f] text-[#829ab1]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className={`w-5 h-5 ${isOffice ? 'text-[#ff9100]' : 'text-[#829ab1]'}`} />
              <div>
                <div className="text-xs font-black uppercase">I&apos;m in the Abu Dhabi office</div>
                <div className="text-[10px] text-[#829ab1]">Everyone else counts as remote</div>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center font-bold text-xs ${
                isOffice ? 'bg-[#ff9100] border-[#ff9100] text-[#06090e]' : 'border-[#1e314f]'
              }`}
            >
              {isOffice && '✓'}
            </div>
          </button>

          {error && (
            <div className="text-xs font-bold text-[#ff1744] bg-[#ff1744]/10 border border-[#ff1744]/40 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            aria-label="Join the game"
            disabled={!name.trim() || isJoining}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0066ff] via-[#00e5ff] to-[#00e676] text-[#06090e] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#00e5ff]/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <span>{isJoining ? 'Joining…' : 'Join the game'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
