'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameMode, HostAction } from '@/lib/types';
import { useGameSync } from '@/lib/useGameSync';
import { currentPrompt, currentQuestion, currentScenario, phaseToken, quizDistribution } from '@/lib/gameLogic';
import { ACTIVE_FLAGS, ACTIVE_QUESTIONS, GAME_CONFIG } from '@/lib/content';
import { normaliseRoomCode } from '@/lib/room';
import { sounds } from '@/lib/audioEngine';

import { HostHeader } from '@/components/host/HostHeader';
import { HostLobby } from '@/components/host/HostLobby';
import { HostBrainrotQuiz } from '@/components/host/HostBrainrotQuiz';
import { HostQuiplash } from '@/components/host/HostQuiplash';
import { HostFlagSwiper } from '@/components/host/HostFlagSwiper';
import { HostPodium } from '@/components/host/HostPodium';
import { TurbineLogo } from '@/components/ui/TurbineLogo';
import { Layers } from 'lucide-react';

const STAGES: { mode: GameMode; label: string; num: string }[] = [
  { mode: 'LOBBY', label: 'Lobby', num: '00' },
  { mode: 'BRAINROT', label: 'Brainrot Decryptor', num: '01' },
  { mode: 'QUIPLASH', label: 'MEA Quiplash', num: '02' },
  { mode: 'FLAGS', label: 'Red / Green Flag', num: '03' },
  { mode: 'PODIUM', label: 'Final standings', num: '04' },
];

const HOST_KEY_STORAGE = 'hh_host_key';

function HostStage() {
  const params = useSearchParams();
  const room = normaliseRoomCode(params.get('room'));
  const [hostKey, setHostKey] = useState<string | null>(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(HOST_KEY_STORAGE) : null;
    } catch {
      return null;
    }
  });
  const { state, timerSeconds, preRoll, connected, lastError, send } = useGameSync(room, { intervalMs: 750, hostKey });

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const busyRef = useRef(false);
  const lastPhaseRef = useRef('');
  const phaseChangedAtRef = useRef(0);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  // Only rendered once state has loaded (client side), so window is available.
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/play?room=${room}` : '';

  // Audio cues on phase changes (host screen only).
  useEffect(() => {
    if (!state) return;
    const phase = `${state.gameMode}:${state.subPhase}:${state.currentQuestionIndex}:${state.currentFlagIndex}`;
    if (phase === lastPhaseRef.current) return;
    const first = lastPhaseRef.current === '';
    lastPhaseRef.current = phase;
    phaseChangedAtRef.current = Date.now();
    if (first) return;
    if (state.subPhase === 'QUESTION' || state.subPhase === 'SUBMIT' || state.subPhase === 'SWIPE') sounds.playBassDrop();
    else if (state.subPhase === 'REVEAL' && state.gameMode !== 'PODIUM') sounds.playSuccess();
    else if (state.subPhase === 'VOTING') sounds.playVoteChime();
  }, [state]);

  const dispatch = useCallback(
    async (action: HostAction) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        sounds.playTick();
        const res = await send({ role: 'host', action });
        if (res.error === 'Host key required.') {
          const entered = window.prompt('This room is protected. Enter the host key:');
          if (entered) {
            try {
              localStorage.setItem(HOST_KEY_STORAGE, entered);
            } catch {}
            setHostKey(entered);
          }
        }
      } finally {
        busyRef.current = false;
      }
    },
    [send],
  );

  // A click within 0.7s of the screen changing under the host is almost always aimed at the old phase
  // (the server's phase token catches the rest).
  const next = useCallback(() => {
    if (Date.now() - phaseChangedAtRef.current < 700) return;
    const s = stateRef.current;
    dispatch({ type: 'NEXT_PHASE', seen: s ? phaseToken(s) : undefined });
  }, [dispatch]);
  const addTime = useCallback(() => dispatch({ type: 'ADD_TIME', seconds: 10 }), [dispatch]);
  const toggleMute = useCallback(() => setIsAudioMuted(sounds.toggleMute()), []);

  const jumpTo = (mode: GameMode) => {
    if (!state || mode === state.gameMode) return;
    const inGame = state.gameMode !== 'LOBBY' && state.gameMode !== 'PODIUM';
    if (inGame && !window.confirm(`Jump to "${STAGES.find(s => s.mode === mode)?.label}"? The current game will be abandoned.`)) return;
    dispatch({ type: 'SET_GAME_MODE', mode });
  };

  // Keyboard: Space / Enter / → = next · T = +10s · M = mute
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.repeat) return;
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        addTime();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, addTime, toggleMute]);

  if (!state) {
    return (
      <div className="min-h-screen bg-[#06090e] text-[#829ab1] flex flex-col items-center justify-center gap-3 font-mono text-xs">
        <TurbineLogo size={64} animate />
        <span>Connecting to room {room}…</span>
        {!connected && <span className="text-[#ff1744]">Server not reachable yet — retrying.</span>}
      </div>
    );
  }

  const question = currentQuestion(state);
  const prompt = currentPrompt(state);
  const scenario = currentScenario(state);

  return (
    <div className="min-h-screen bg-[#06090e] text-[#f0f4f8] flex flex-col aerospace-grid-bg relative">
      <HostHeader
        roomCode={state.roomCode}
        gameMode={state.gameMode}
        timerSeconds={timerSeconds}
        timerTotal={state.timerTotal}
        isTimerRunning={state.isTimerRunning}
        playerCount={Object.keys(state.players).length}
        connected={connected}
        isAudioMuted={isAudioMuted}
        onToggleMute={toggleMute}
        onNextPhase={next}
        onAddTime={addTime}
      />

      {!connected && (
        <div className="absolute top-20 inset-x-6 z-30 bg-[#ff9100]/15 border border-[#ff9100]/50 text-[#ff9100] text-xs font-bold font-mono px-4 py-2 rounded-xl text-center">
          Connection to the server lost — retrying. Phones keep their own timers; nothing is lost.
        </div>
      )}
      {lastError && connected && (
        <div className="absolute top-20 inset-x-6 z-30 bg-[#0d1522] border border-[#ff1744]/50 text-[#ff1744] text-xs font-bold font-mono px-4 py-2 rounded-xl text-center">{lastError}</div>
      )}

      <main className="flex-grow flex flex-col relative z-10">
        {state.gameMode === 'LOBBY' && (
          <HostLobby
            roomCode={state.roomCode}
            players={state.players}
            joinUrl={joinUrl}
            onStartGame={() => dispatch({ type: 'START_GAME' })}
            onClearPlayers={() => dispatch({ type: 'CLEAR_PLAYERS' })}
          />
        )}

        {state.gameMode === 'BRAINROT' && question && (
          <HostBrainrotQuiz
            question={question}
            questionIndex={state.currentQuestionIndex}
            totalQuestions={ACTIVE_QUESTIONS.length}
            subPhase={state.subPhase as 'QUESTION' | 'REVEAL' | 'LEADERBOARD'}
            players={state.players}
            distribution={quizDistribution(state)}
            preRoll={preRoll}
            onNextPhase={next}
          />
        )}

        {state.gameMode === 'QUIPLASH' && prompt && (
          <HostQuiplash
            prompt={prompt}
            roundIndex={state.currentQuestionIndex}
            totalRounds={GAME_CONFIG.quiplashRounds}
            subPhase={state.subPhase as 'SUBMIT' | 'VOTING' | 'REVEAL'}
            players={state.players}
            preRoll={preRoll}
            onNextPhase={next}
          />
        )}

        {state.gameMode === 'FLAGS' && scenario && (
          <HostFlagSwiper
            scenario={scenario}
            scenarioIndex={state.currentFlagIndex}
            totalScenarios={ACTIVE_FLAGS.length}
            subPhase={state.subPhase as 'SWIPE' | 'REVEAL'}
            players={state.players}
            preRoll={preRoll}
            onNextPhase={next}
          />
        )}

        {state.gameMode === 'PODIUM' && <HostPodium players={state.players} onResetGame={() => dispatch({ type: 'RESET_GAME' })} />}
      </main>

      <footer className="bg-[#0d1522]/95 border-t border-[#1e314f] px-6 py-2.5 flex items-center justify-between text-xs font-mono relative z-20 select-none">
        <div className="hidden md:flex items-center gap-2 text-[#829ab1]">
          <Layers className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span>Jump to</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {STAGES.map(stage => {
            const active = state.gameMode === stage.mode;
            return (
              <button
                key={stage.mode}
                onClick={() => jumpTo(stage.mode)}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 font-bold ${
                  active ? 'bg-[#00e5ff] text-[#06090e]' : 'bg-[#131f33] text-[#829ab1] hover:text-[#f0f4f8] border border-[#1e314f]'
                }`}
              >
                <span className="text-[10px] font-telemetry opacity-70">{stage.num}</span>
                <span>{stage.label}</span>
              </button>
            );
          })}
        </div>
        <div className="text-[10px] text-[#829ab1] hidden lg:flex items-center gap-3">
          <span>
            <strong className="text-[#f0f4f8]">[SPACE / ENTER]</strong> Next
          </span>
          <span>
            <strong className="text-[#f0f4f8]">[T]</strong> +10s
          </span>
          <span>
            <strong className="text-[#f0f4f8]">[M]</strong> Mute
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function HostClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06090e]" />}>
      <HostStage />
    </Suspense>
  );
}
