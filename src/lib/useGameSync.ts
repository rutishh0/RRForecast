'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, SyncResponse } from './types';

interface Options {
  intervalMs?: number;
  hostKey?: string | null;
  /** Ask the server for the trimmed per-player view instead of the whole room. */
  view?: 'player' | 'host';
  /** Required with view: 'player' — which player the view is for. */
  playerId?: string | null;
}

/**
 * Keeps a page in sync with the room on the server.
 *  - polls GET on an interval, and immediately when the tab becomes visible
 *  - never lets an older state (by version) overwrite a newer one
 *  - derives a smooth countdown from the server's clock, so the HUD ticks
 *    every second even though polls arrive less often than that
 */
export function useGameSync(room: string, { intervalMs = 1000, hostKey, view = 'host', playerId }: Options = {}) {
  const [state, setState] = useState<GameState | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [preRoll, setPreRoll] = useState(0);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const versionRef = useRef(-1);
  const offsetRef = useRef(0); // serverTime - Date.now()
  const lastOkRef = useRef(0);

  const accept = useCallback((data: SyncResponse) => {
    if (typeof data.serverTime === 'number') offsetRef.current = data.serverTime - Date.now();
    if (data.state && data.state.version >= versionRef.current) {
      versionRef.current = data.state.version;
      setState(data.state);
    }
    lastOkRef.current = Date.now();
    setConnected(true);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const q = new URLSearchParams({ room });
      if (view === 'player') {
        q.set('view', 'player');
        if (playerId) q.set('pid', playerId);
      }
      const res = await fetch(`/api/game/sync?${q}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      accept((await res.json()) as SyncResponse);
    } catch {
      if (Date.now() - lastOkRef.current > 5000) setConnected(false);
    }
  }, [room, view, playerId, accept]);

  /**
   * POST a host action or player message. Resolves with the server's reply.
   * A 5xx is retried once after a short pause: under a burst the server can lose a
   * write race, and nobody should lose their answer to that.
   */
  const send = useCallback(
    async (body: Record<string, unknown>): Promise<SyncResponse> => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (hostKey) headers['x-host-key'] = hostKey;
      const attempt = async () =>
        fetch('/api/game/sync', { method: 'POST', headers, body: JSON.stringify({ room, view, ...body }) });

      let res = await attempt();
      if (res.status >= 500) {
        await new Promise(r => setTimeout(r, 250 + Math.random() * 350));
        res = await attempt();
      }

      const data = (await res.json().catch(() => ({}))) as SyncResponse;
      if (!res.ok || data.error) {
        setLastError(data.error || `HTTP ${res.status}`);
        setTimeout(() => setLastError(null), 4000);
      } else {
        setLastError(null);
      }
      if (data.state) accept(data);
      return data;
    },
    [room, view, hostKey, accept],
  );

  // Polling loop
  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (alive) refresh();
    };
    tick();
    const id = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh, intervalMs]);

  // Smooth countdown derived from server clock
  useEffect(() => {
    const compute = () => {
      if (!state || !state.isTimerRunning) {
        setTimerSeconds(0);
        setPreRoll(0);
        return;
      }
      const now = Date.now() + offsetRef.current;
      const remaining = state.timerTotal - (now - state.roundStartTime) / 1000;
      setTimerSeconds(Math.max(0, Math.min(state.timerTotal, Math.ceil(remaining))));
      setPreRoll(Math.max(0, Math.ceil((state.roundStartTime - now) / 1000)));
    };
    compute();
    const id = setInterval(compute, 200);
    return () => clearInterval(id);
  }, [state]);

  /** Current time on the server's clock (for reaction-time measurements). */
  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  return { state, timerSeconds, preRoll, connected, lastError, send, refresh, serverNow };
}
