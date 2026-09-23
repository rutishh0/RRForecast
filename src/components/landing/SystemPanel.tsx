'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';

function subscribeToMotionPreference(onChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * A live readout of the production API, measured from the visitor's own browser.
 *
 * Every number here is sampled, not decorative: the trace is real round-trip time
 * to /api/game/sync, and the headcount is whatever is actually in that room. The
 * point of the panel is that it is doing the thing it describes while you read it.
 */

const SAMPLE_MS = 2000;
const HISTORY = 44;
const CHART_W = 620;
const CHART_H = 132;

interface Sample {
  ms: number;
  ok: boolean;
}

export const SystemPanel: React.FC<{ room: string }> = ({ room }) => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [players, setPlayers] = useState<number | null>(null);
  const [skew, setSkew] = useState<number | null>(null);
  const roomRef = useRef(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Read once at mount rather than tracking changes: nobody flips this setting mid-visit.
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );

  useEffect(() => {
    let alive = true;

    const sample = async () => {
      if (document.visibilityState !== 'visible') return; // don't bill a hidden tab
      const t0 = performance.now();
      try {
        const res = await fetch(`/api/game/sync?room=${encodeURIComponent(roomRef.current)}`, { cache: 'no-store' });
        const ms = Math.round(performance.now() - t0);
        const data = await res.json();
        if (!alive) return;
        setSamples(s => [...s, { ms, ok: res.ok }].slice(-HISTORY));
        if (data?.state?.players) setPlayers(Object.keys(data.state.players).length);
        if (typeof data?.serverTime === 'number') setSkew(Math.round(data.serverTime - Date.now()));
      } catch {
        if (!alive) return;
        setSamples(s => [...s, { ms: 0, ok: false }].slice(-HISTORY));
      }
    };

    sample();
    const id = setInterval(sample, SAMPLE_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const latest = samples[samples.length - 1];
  const ok = latest?.ok ?? false;
  const values = samples.filter(s => s.ok).map(s => s.ms);
  const peak = Math.max(120, ...values);
  const median = values.length ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] : null;

  // Map samples to a polyline across the full width, newest on the right.
  const points = samples
    .map((s, i) => {
      const x = samples.length === 1 ? CHART_W : (i / (HISTORY - 1)) * CHART_W;
      const y = CHART_H - Math.min(1, s.ms / peak) * (CHART_H - 16) - 8;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const tone = !ok ? '#ff1744' : latest && latest.ms > 600 ? '#ff9100' : '#00e5ff';

  return (
    <section className="max-w-6xl mx-auto w-full relative z-10" aria-labelledby="live-readout">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-[#1e314f] border border-[#1e314f] rounded-2xl overflow-hidden">
        {/* ---- live trace ------------------------------------------------ */}
        <div className="lg:col-span-8 bg-[#0d1522] p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 id="live-readout" className="text-base sm:text-lg font-bold text-[#f0f4f8] tracking-tight">
                Live from this browser
              </h2>
              <p className="text-xs text-[#829ab1] mt-1 max-w-sm leading-relaxed">
                Round-trip time to the game server, sampled every two seconds. Nothing here is a mock-up.
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-telemetry font-black text-4xl sm:text-5xl tabular-nums leading-none" style={{ color: tone }}>
                {ok && latest ? latest.ms : '––'}
              </span>
              <span className="text-xs text-[#829ab1] font-mono">ms</span>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full mt-4"
            style={{ height: 132 }}
            role="img"
            aria-label={
              ok && latest
                ? `Latency trace. Latest ${latest.ms} milliseconds${median ? `, median ${median}` : ''}.`
                : 'Latency trace, waiting for the first sample.'
            }
          >
            <defs>
              <linearGradient id="trace-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
                <stop offset="100%" stopColor={tone} stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75].map(f => (
              <line key={f} x1="0" y1={CHART_H * f} x2={CHART_W} y2={CHART_H * f} stroke="#1e314f" strokeWidth="1" />
            ))}

            {samples.length > 1 && (
              <>
                <polygon points={`0,${CHART_H} ${points} ${CHART_W},${CHART_H}`} fill="url(#trace-fill)" />
                <polyline
                  points={points}
                  fill="none"
                  stroke={tone}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={reducedMotion ? undefined : { transition: 'all 220ms linear' }}
                />
              </>
            )}

            {samples.length > 0 && (
              <circle
                cx={samples.length === 1 ? CHART_W : ((samples.length - 1) / (HISTORY - 1)) * CHART_W}
                cy={CHART_H - Math.min(1, (latest?.ms ?? 0) / peak) * (CHART_H - 16) - 8}
                r="3.5"
                fill={tone}
              />
            )}
          </svg>

          <div className="flex items-center gap-5 mt-3 text-[11px] font-mono text-[#829ab1] flex-wrap">
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: ok ? '#00e676' : '#ff1744' }}
                aria-hidden
              />
              {ok ? 'Responding' : 'No response'}
            </span>
            {median !== null && <span>median {median} ms</span>}
            {skew !== null && <span>clock offset {skew > 0 ? '+' : ''}{skew} ms</span>}
            <span>
              room {room}
              {players !== null && ` · ${players} ${players === 1 ? 'player' : 'players'}`}
            </span>
          </div>
        </div>

        {/* ---- data plate ------------------------------------------------ */}
        <dl className="lg:col-span-4 bg-[#0d1522] p-5 sm:p-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-0 content-start text-xs font-mono">
          {[
            ['Capacity', '150 devices, tested'],
            ['Payload', '1.9 KB per device'],
            ['Install', 'None'],
            ['Session', '25 minutes, three games'],
            ['State', 'One Postgres row per room'],
          ].map(([k, v], i) => (
            <React.Fragment key={k}>
              <dt className={`text-[#829ab1] py-2.5 ${i > 0 ? 'border-t border-[#1e314f]' : ''}`}>{k}</dt>
              <dd className={`text-[#f0f4f8] py-2.5 text-right ${i > 0 ? 'border-t border-[#1e314f]' : ''}`}>{v}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </section>
  );
};
