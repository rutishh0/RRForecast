'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FlagVote } from '@/lib/types';
import { useGameSync } from '@/lib/useGameSync';
import { currentPrompt, currentQuestion, currentScenario, getBallot } from '@/lib/gameLogic';
import { ACTIVE_FLAGS, ACTIVE_QUESTIONS, GAME_CONFIG, avatarIcon } from '@/lib/content';
import { normaliseRoomCode } from '@/lib/room';

import { PlayerLobby } from '@/components/player/PlayerLobby';
import { PlayerQuizInput } from '@/components/player/PlayerQuizInput';
import { PlayerQuiplashInput } from '@/components/player/PlayerQuiplashInput';
import { PlayerQuiplashVote } from '@/components/player/PlayerQuiplashVote';
import { PlayerFlagInput } from '@/components/player/PlayerFlagInput';
import { PlayerScorecard } from '@/components/player/PlayerScorecard';
import { TurbineLogo } from '@/components/ui/TurbineLogo';
import { CheckCircle2, Wifi, WifiOff, LogOut } from 'lucide-react';

function storageKey(room: string) {
  return `hh_player_${room}`;
}

function PlayerController() {
  const params = useSearchParams();
  const room = normaliseRoomCode(params.get('room'));

  // Identity for this room is kept in localStorage so a refresh or phone lock doesn't lose your score.
  const [playerId, setPlayerId] = useState<string | null>(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(storageKey(room)) : null;
    } catch {
      return null;
    }
  });

  // 'player' view: the server sends only this phone's slice of the room, which keeps the
  // payload flat regardless of headcount and keeps other people's answers off this device.
  const { state, timerSeconds, preRoll, connected, lastError, send, serverNow } = useGameSync(room, {
    intervalMs: 1000,
    view: 'player',
    playerId,
  });
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // A stale id (room was cleared) simply means "not joined" — the join form shows again.
  const me = state && playerId ? state.players[playerId] : undefined;

  const handleJoin = async (name: string, avatar: string, isOffice: boolean) => {
    setIsJoining(true);
    setJoinError(null);
    try {
      const data = await send({ type: 'JOIN_GAME', name, avatar, isOffice, existingId: playerId || undefined });
      if (data.playerId) {
        setPlayerId(data.playerId);
        try {
          localStorage.setItem(storageKey(room), data.playerId);
        } catch {}
      } else {
        setJoinError(data.error || 'Could not join. Try again.');
      }
    } catch {
      setJoinError('Network problem — check your connection and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const leave = () => {
    try {
      localStorage.removeItem(storageKey(room));
    } catch {}
    setPlayerId(null);
  };

  const answerQuiz = (optionIndex: number) => {
    if (!playerId || !state) return;
    const clientElapsedMs = Math.max(0, serverNow() - state.roundStartTime);
    send({ type: 'SUBMIT_QUIZ_ANSWER', playerId, optionIndex, clientElapsedMs });
  };
  const submitPunchline = (text: string) => {
    const prompt = state && currentPrompt(state);
    if (playerId && prompt) send({ type: 'SUBMIT_QUIPLASH_ANSWER', playerId, promptId: prompt.id, text });
  };
  const vote = (submissionId: string) => {
    const prompt = state && currentPrompt(state);
    if (playerId && prompt) send({ type: 'VOTE_QUIPLASH', playerId, promptId: prompt.id, submissionId });
  };
  const voteFlag = (flag: FlagVote) => {
    const scenario = state && currentScenario(state);
    if (playerId && scenario) send({ type: 'SUBMIT_FLAG', playerId, scenarioId: scenario.id, vote: flag });
  };

  // ---------------------------------------------------------------------------

  const renderMain = () => {
    if (!state) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center gap-3 text-xs text-[#829ab1] font-mono">
          <TurbineLogo size={48} animate />
          <span>Connecting to room {room}…</span>
        </div>
      );
    }

    if (!me) {
      return <PlayerLobby roomCode={state.roomCode} onJoin={handleJoin} isJoining={isJoining} error={joinError} />;
    }

    switch (state.gameMode) {
      case 'LOBBY':
        return (
          <div className="flex-grow flex flex-col justify-center p-4 max-w-md mx-auto w-full font-mono text-center">
            <div className="bg-[#0d1522] border border-[#1e314f] rounded-3xl p-8 shadow-2xl space-y-4">
              <div className="text-6xl">{avatarIcon(me.avatar)}</div>
              <div>
                <span className="text-[10px] font-black uppercase text-[#00e5ff] tracking-widest block">You&apos;re in</span>
                <h2 className="text-xl font-black text-[#f0f4f8] mt-1">{me.name}</h2>
                {me.isAbuDhabiOffice && (
                  <span className="inline-block text-[10px] bg-[#ff9100]/20 text-[#ff9100] border border-[#ff9100]/50 px-2.5 py-0.5 rounded-full font-bold mt-1">
                    ABU DHABI OFFICE
                  </span>
                )}
              </div>
              <div className="p-4 bg-[#131f33] border border-[#00e676]/40 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#00e676]">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {state.playerCount ?? 1} in room {state.roomCode}
                </span>
              </div>
              <p className="text-xs text-[#829ab1] leading-relaxed">
                Keep this page open. Your phone becomes the controller when the host starts.
              </p>
              <button onClick={leave} className="text-xs font-bold text-[#00e5ff] underline underline-offset-4">
                Not you? Switch player
              </button>
            </div>
          </div>
        );

      case 'BRAINROT': {
        const q = currentQuestion(state);
        if (state.subPhase === 'QUESTION' && q) {
          return (
            <PlayerQuizInput
              key={`q-${q.id}`}
              question={q}
              questionNumber={state.currentQuestionIndex + 1}
              totalQuestions={ACTIVE_QUESTIONS.length}
              timerSeconds={timerSeconds}
              preRoll={preRoll}
              myAnswer={me.pendingAnswer?.optionIndex}
              onSelectOption={answerQuiz}
            />
          );
        }
        const correct = q?.options.find(o => o.isCorrect);
        const last = state.currentQuestionIndex >= ACTIVE_QUESTIONS.length - 1;
        return (
          <PlayerScorecard
            player={me}
            state={state}
            showLastRound
            showStreak
            answerText={correct ? `${String.fromCharCode(65 + q.options.indexOf(correct))} — ${correct.text}` : undefined}
            subline={last ? 'That was the last question. Quiplash is next.' : 'Next question is coming.'}
          />
        );
      }

      case 'QUIPLASH': {
        const prompt = currentPrompt(state);
        if (!prompt) return null;
        const mine = prompt.submissions.find(s => s.playerId === me.id);
        if (state.subPhase === 'SUBMIT') {
          return (
            <PlayerQuiplashInput
              key={`w-${prompt.id}`}
              prompt={prompt}
              roundNumber={state.currentQuestionIndex + 1}
              totalRounds={GAME_CONFIG.quiplashRounds}
              timerSeconds={timerSeconds}
              preRoll={preRoll}
              mySubmission={mine?.text}
              onSubmitPunchline={submitPunchline}
            />
          );
        }
        if (state.subPhase === 'VOTING') {
          const myVoteId = prompt.submissions.find(s => s.votes.includes(me.id))?.id;
          return (
            <PlayerQuiplashVote
              key={`v-${prompt.id}`}
              prompt={prompt}
              ballot={getBallot(prompt, me.id)}
              myVoteId={myVoteId}
              timerSeconds={timerSeconds}
              preRoll={preRoll}
              onVote={vote}
            />
          );
        }
        return <PlayerScorecard player={me} state={state} showLastRound subline="Authors revealed on the big screen." />;
      }

      case 'FLAGS': {
        const scenario = currentScenario(state);
        if (state.subPhase === 'SWIPE' && scenario) {
          return (
            <PlayerFlagInput
              key={`f-${scenario.id}`}
              scenario={scenario}
              scenarioNumber={state.currentFlagIndex + 1}
              totalScenarios={ACTIVE_FLAGS.length}
              timerSeconds={timerSeconds}
              preRoll={preRoll}
              myVote={scenario.voters[me.id]}
              onVoteFlag={voteFlag}
            />
          );
        }
        return <PlayerScorecard player={me} state={state} showLastRound subline="See how the room voted on the big screen." />;
      }

      case 'PODIUM':
        return <PlayerScorecard player={me} state={state} headline="Final standings" subline="Thanks for playing." />;
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-[#f0f4f8] flex flex-col aerospace-grid-bg relative select-none">
      <header className="bg-[#0d1522] border-b border-[#1e314f] px-4 py-2.5 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2 shrink-0">
          <TurbineLogo size={24} animate={!!state?.isTimerRunning} />
          <span className="text-xs font-black uppercase text-[#00e5ff] tracking-tight font-mono whitespace-nowrap">
            {me ? 'HH Live' : 'Half Hands Live'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono min-w-0">
          {me ? (
            <>
              <span className="text-base">{avatarIcon(me.avatar)}</span>
              <span className="font-bold truncate max-w-[130px]">{me.name}</span>
              <span className="text-[10px] text-[#00e676] font-telemetry font-bold bg-[#131f33] border border-[#1e314f] px-2 py-0.5 rounded">
                {me.score}
              </span>
              <button onClick={leave} title="Switch player" className="text-[#829ab1] hover:text-[#f0f4f8] p-1">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <span className="text-[10px] text-[#829ab1]">ROOM {room}</span>
          )}
          {connected ? (
            <Wifi className="w-3.5 h-3.5 text-[#00e5ff]" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-[#ff1744] animate-pulse" />
          )}
        </div>
      </header>

      {/* Overlays, not in-flow: nothing under a thumb may move when these appear. */}
      {!connected && state && (
        <div className="absolute top-12 inset-x-3 z-30 bg-[#ff9100]/15 border border-[#ff9100]/50 text-[#ff9100] text-[11px] font-bold font-mono px-3 py-1.5 rounded-xl text-center">
          Connection lost — retrying… if this stays, reload the page.
        </div>
      )}
      {lastError && me && connected && (
        <div className="absolute top-12 inset-x-3 z-30 bg-[#0d1522] border border-[#ff1744]/50 text-[#ff1744] text-[11px] font-bold font-mono px-3 py-1.5 rounded-xl text-center animate-fade-in">
          {lastError}
        </div>
      )}

      <main className="flex-grow flex flex-col relative z-10">{renderMain()}</main>
    </div>
  );
}

export default function PlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06090e] text-[#829ab1] flex items-center justify-center font-mono text-xs">Loading…</div>
      }
    >
      <PlayerController />
    </Suspense>
  );
}
