import React from 'react';

/** Full-stage "get ready" overlay shown during the pre-roll before a timed phase opens. */
export const GetReady: React.FC<{ seconds: number; label: string }> = ({ seconds, label }) => (
  <div className="absolute inset-0 z-40 bg-[#06090e] flex flex-col items-center justify-center animate-fade-in rounded-3xl">
    <div className="text-sm font-black tracking-[0.3em] text-[#00e5ff] uppercase mb-2">{label}</div>
    <div className="text-3xl md:text-4xl font-black text-[#f0f4f8] uppercase tracking-tight">Get ready</div>
    <div className="font-telemetry font-black text-8xl text-[#ff9100] mt-2 leading-none">{seconds}</div>
    <div className="text-xs text-[#829ab1] mt-4 uppercase tracking-widest">Phones open when this hits zero</div>
  </div>
);
