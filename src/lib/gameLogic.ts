import {
  ClientMessage,
  FlagScenario,
  FlagVote,
  GameMode,
  GameState,
  HostAction,
  Player,
  QuiplashPrompt,
  QuiplashSubmission,
  PhaseToken,
} from './types';
import { ACTIVE_FLAGS, ACTIVE_PROMPTS, ACTIVE_QUESTIONS, GAME_CONFIG } from './content';

/**
 * Pure game rules. Every function here takes a state and mutates + returns it.
 * The persistence layer (src/server/store.ts) is responsible for cloning the
 * state out of the database, calling these inside a transaction, and writing
 * it back — so in-place mutation is safe and keeps the code readable.
 */

const cfg = GAME_CONFIG;
const QUIPLASH_ROUNDS = ACTIVE_PROMPTS.length;

// ---------------------------------------------------------------------------
// State construction & derived values
// ---------------------------------------------------------------------------

export function createInitialGameState(roomCode: string, now = Date.now()): GameState {
  return {
    roomCode,
    gameMode: 'LOBBY',
    subPhase: 'WAITING',
    timerTotal: 0,
    roundStartTime: now,
    isTimerRunning: false,
    timerSeconds: 0,
    players: {},
    currentQuestionIndex: 0,
    quiplashPrompts: structuredClone(ACTIVE_PROMPTS),
    flagScenarios: structuredClone(ACTIVE_FLAGS),
    currentFlagIndex: 0,
    sessionStartTime: now,
    version: 0,
  };
}

export function remainingSeconds(state: GameState, now: number): number {
  if (!state.isTimerRunning) return 0;
  const elapsed = (now - state.roundStartTime) / 1000;
  return Math.max(0, Math.min(state.timerTotal, Math.ceil(state.timerTotal - elapsed)));
}

/** Seconds of "get ready" left before inputs open (0 once the round is live). */
export function preRollSeconds(state: GameState, now: number): number {
  if (!state.isTimerRunning) return 0;
  return Math.max(0, Math.ceil((state.roundStartTime - now) / 1000));
}

export function phaseToken(state: GameState): PhaseToken {
  return {
    gameMode: state.gameMode,
    subPhase: state.subPhase,
    currentQuestionIndex: state.currentQuestionIndex,
    currentFlagIndex: state.currentFlagIndex,
  };
}

function samePhase(a: PhaseToken, b: PhaseToken): boolean {
  return (
    a.gameMode === b.gameMode &&
    a.subPhase === b.subPhase &&
    a.currentQuestionIndex === b.currentQuestionIndex &&
    a.currentFlagIndex === b.currentFlagIndex
  );
}

/** Fill in the derived fields a client needs. Never persisted. */
export function withDerived(state: GameState, now: number): GameState {
  return { ...state, timerSeconds: remainingSeconds(state, now) };
}

/**
 * Phones show 0 at `roundStartTime + timerTotal`, but inputs stay open for a short
 * grace period after that so a tap made at "1s" still lands despite network latency.
 * Auto-advance (and the host's Next) only fire once the grace has passed.
 */
export const TIMER_GRACE_MS = 1500;

export function timerExpired(state: GameState, now: number): boolean {
  return state.isTimerRunning && now - state.roundStartTime >= state.timerTotal * 1000 + TIMER_GRACE_MS;
}

export function getRankedPlayers(players: Record<string, Player>): Player[] {
  return Object.values(players).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
}

/** Competition ranking: equal scores share a rank (1, 1, 3 …). */
export function rankOf(player: Player, players: Record<string, Player>): { rank: number; tied: boolean } {
  let above = 0;
  let equal = 0;
  for (const p of Object.values(players)) {
    if (p.id === player.id) continue;
    if (p.score > player.score) above++;
    else if (p.score === player.score) equal++;
  }
  return { rank: above + 1, tied: equal > 0 };
}

/** Brainrot points for a correct answer: base + speed decay + Fast Five bonus. */
export function quizPoints(elapsedMs: number, totalSeconds: number, finishOrder: number): number {
  const f = Math.max(0, Math.min(1, elapsedMs / (totalSeconds * 1000)));
  const speed = Math.round(cfg.points.quizSpeedMax * (1 - f));
  const fastFive = finishOrder < cfg.points.quizFastFiveCount ? cfg.points.quizFastFiveBonus : 0;
  return cfg.points.quizBase + speed + fastFive;
}

export function currentQuestion(state: GameState) {
  return ACTIVE_QUESTIONS[state.currentQuestionIndex];
}
export function currentPrompt(state: GameState): QuiplashPrompt | undefined {
  return state.quiplashPrompts[state.currentQuestionIndex];
}
export function currentScenario(state: GameState): FlagScenario | undefined {
  return state.flagScenarios[state.currentFlagIndex];
}

export function flagCounts(scenario: FlagScenario): { red: number; green: number; total: number } {
  let red = 0;
  let green = 0;
  for (const v of Object.values(scenario.voters)) {
    if (v === 'RED') red++;
    else green++;
  }
  return { red, green, total: red + green };
}

/** Submissions sorted by votes desc, then by submission order. */
export function quiplashStandings(prompt: QuiplashPrompt): QuiplashSubmission[] {
  return [...prompt.submissions].sort((a, b) => b.votes.length - a.votes.length);
}

/** Answer distribution for the host reveal: count of players per option. */
export function quizDistribution(state: GameState): number[] {
  const q = currentQuestion(state);
  const counts = new Array(q?.options.length ?? 4).fill(0);
  for (const p of Object.values(state.players)) {
    const i = p.pendingAnswer?.optionIndex;
    if (i !== undefined && i < counts.length) counts[i]++;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Quiplash ballot — each phone votes between a few punchlines by other people.
// Deterministic per (player, prompt) so polling never reshuffles the list.
// ---------------------------------------------------------------------------

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed || 1;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getBallot(prompt: QuiplashPrompt, playerId: string): QuiplashSubmission[] {
  const others = prompt.submissions.filter(s => s.playerId !== playerId);
  return seededShuffle(others, hashString(`${playerId}:${prompt.id}`)).slice(0, cfg.quiplashBallotSize);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function startTimer(state: GameState, seconds: number, now: number) {
  state.timerTotal = seconds;
  state.roundStartTime = now + cfg.preRollSeconds * 1000; // inputs open after the pre-roll
  state.isTimerRunning = true;
}

function roundIsLive(state: GameState, now: number): boolean {
  return state.isTimerRunning && now >= state.roundStartTime;
}

function stopTimer(state: GameState) {
  state.isTimerRunning = false;
}

/** Clear per-round input flags on every player. Scores and lastRound survive. */
function resetRound(state: GameState) {
  for (const p of Object.values(state.players)) {
    p.hasSubmitted = false;
    delete p.pendingAnswer;
  }
}

function beginQuestion(state: GameState, index: number, now: number) {
  state.gameMode = 'BRAINROT';
  state.currentQuestionIndex = index;
  state.subPhase = 'QUESTION';
  resetRound(state);
  startTimer(state, cfg.quizSeconds, now);
}

function beginQuiplashRound(state: GameState, index: number, now: number) {
  state.gameMode = 'QUIPLASH';
  state.currentQuestionIndex = index;
  state.subPhase = 'SUBMIT';
  resetRound(state);
  startTimer(state, cfg.quiplashWriteSeconds, now);
}

function beginFlag(state: GameState, index: number, now: number) {
  state.gameMode = 'FLAGS';
  state.currentFlagIndex = index;
  state.subPhase = 'SWIPE';
  resetRound(state);
  startTimer(state, cfg.flagSeconds, now);
}

function beginPodium(state: GameState) {
  state.gameMode = 'PODIUM';
  state.subPhase = 'REVEAL';
  resetRound(state);
  stopTimer(state);
}

function beginLobby(state: GameState) {
  state.gameMode = 'LOBBY';
  state.subPhase = 'WAITING';
  resetRound(state);
  stopTimer(state);
}

// --- Scoring: all points are awarded at the moment of reveal -------------

function revealQuiz(state: GameState) {
  const q = currentQuestion(state);
  stopTimer(state);
  state.subPhase = 'REVEAL';
  // Fast Five: the first N *correct* answers by server-recorded time get a bonus.
  const correctOrder = Object.values(state.players)
    .filter(p => p.pendingAnswer && q?.options[p.pendingAnswer.optionIndex]?.isCorrect)
    .sort((a, b) => a.pendingAnswer!.answeredAt - b.pendingAnswer!.answeredAt)
    .map(p => p.id);
  for (const p of Object.values(state.players)) {
    const ans = p.pendingAnswer;
    if (!ans || !q) {
      p.streak = 0;
      p.lastRound = { points: 0, label: 'No answer' };
      continue;
    }
    const order = correctOrder.indexOf(p.id);
    const correct = order >= 0;
    const pts = correct ? quizPoints(ans.answeredAt - state.roundStartTime, state.timerTotal, order) : 0;
    const fastFive = correct && order < cfg.points.quizFastFiveCount;
    p.score += pts;
    p.streak = correct ? p.streak + 1 : 0;
    p.lastRound = { points: pts, correct, label: fastFive ? `Correct · Fast Five #${order + 1}` : correct ? 'Correct' : 'Wrong' };
  }
}

function openQuiplashVoting(state: GameState, now: number) {
  state.subPhase = 'VOTING';
  resetRound(state); // hasSubmitted now means "has voted"
  startTimer(state, cfg.quiplashVoteSeconds, now);
}

function revealQuiplash(state: GameState) {
  const prompt = currentPrompt(state);
  stopTimer(state);
  state.subPhase = 'REVEAL';
  if (!prompt) return;

  const maxVotes = Math.max(0, ...prompt.submissions.map(s => s.votes.length));
  for (const p of Object.values(state.players)) {
    p.lastRound = { points: 0, label: p.hasSubmitted ? 'Voted' : 'No vote' };
  }
  for (const s of prompt.submissions) {
    const author = state.players[s.playerId];
    if (!author) continue;
    let pts = cfg.points.quiplashSubmitted + Math.min(cfg.points.quiplashVoteCap, s.votes.length * cfg.points.quiplashPerVote);
    const won = maxVotes > 0 && s.votes.length === maxVotes;
    const tiedWin = won && prompt.submissions.filter(x => x.votes.length === maxVotes).length > 1;
    if (won) pts += cfg.points.quiplashRoundWinner;
    author.score += pts;
    const votesLabel = `${s.votes.length} vote${s.votes.length === 1 ? '' : 's'}`;
    author.lastRound = {
      points: pts,
      correct: won,
      label: tiedWin ? `Tied for the win · ${votesLabel}` : won ? `Round winner · ${votesLabel}` : votesLabel,
    };
  }
}

function revealFlag(state: GameState) {
  const scenario = currentScenario(state);
  stopTimer(state);
  state.subPhase = 'REVEAL';
  if (!scenario) return;
  const { red, green } = flagCounts(scenario);
  const majority: FlagVote | null = red > green ? 'RED' : green > red ? 'GREEN' : null;
  for (const p of Object.values(state.players)) {
    const vote = scenario.voters[p.id];
    if (!vote) {
      p.lastRound = { points: 0, label: 'No vote' };
      continue;
    }
    const withMajority = majority !== null && vote === majority;
    const pts = cfg.points.flagParticipation + (withMajority ? cfg.points.flagMajorityBonus : 0);
    p.score += pts;
    p.lastRound = {
      points: pts,
      correct: withMajority,
      label: majority === null ? 'Dead heat' : withMajority ? 'With the majority' : 'Against the room',
    };
  }
}

// ---------------------------------------------------------------------------
// Phase machine — shared by the host's NEXT button and timer expiry
// ---------------------------------------------------------------------------

export function advance(state: GameState, now: number): GameState {
  switch (state.gameMode) {
    case 'LOBBY':
      beginQuestion(state, 0, now);
      break;

    case 'BRAINROT':
      if (state.subPhase === 'QUESTION') revealQuiz(state);
      else if (state.subPhase === 'REVEAL') state.subPhase = 'LEADERBOARD';
      else if (state.currentQuestionIndex < ACTIVE_QUESTIONS.length - 1)
        beginQuestion(state, state.currentQuestionIndex + 1, now);
      else beginQuiplashRound(state, 0, now);
      break;

    case 'QUIPLASH':
      if (state.subPhase === 'SUBMIT') openQuiplashVoting(state, now);
      else if (state.subPhase === 'VOTING') revealQuiplash(state);
      else if (state.currentQuestionIndex < QUIPLASH_ROUNDS - 1)
        beginQuiplashRound(state, state.currentQuestionIndex + 1, now);
      else beginFlag(state, 0, now);
      break;

    case 'FLAGS':
      if (state.subPhase === 'SWIPE') revealFlag(state);
      else if (state.currentFlagIndex < ACTIVE_FLAGS.length - 1)
        beginFlag(state, state.currentFlagIndex + 1, now);
      else beginPodium(state);
      break;

    case 'PODIUM':
      // Stay on the podium; host uses RESET_GAME to go back to the lobby.
      break;
  }
  state.version++;
  return state;
}

/** Only the timed input phases auto-advance when their timer runs out. */
export function applyTimeout(state: GameState, now: number): boolean {
  if (!timerExpired(state, now)) return false;
  const timed =
    (state.gameMode === 'BRAINROT' && state.subPhase === 'QUESTION') ||
    (state.gameMode === 'QUIPLASH' && (state.subPhase === 'SUBMIT' || state.subPhase === 'VOTING')) ||
    (state.gameMode === 'FLAGS' && state.subPhase === 'SWIPE');
  if (timed) advance(state, now);
  else stopTimer(state);
  return true;
}

// ---------------------------------------------------------------------------
// Host actions
// ---------------------------------------------------------------------------

export function reduceHostAction(state: GameState, action: HostAction, now: number): GameState {
  const justTimedOut = applyTimeout(state, now);

  switch (action.type) {
    case 'START_GAME':
      if (state.gameMode === 'LOBBY') advance(state, now);
      break;

    case 'NEXT_PHASE':
      // Ignore a click that was aimed at a phase that has already moved on —
      // whether the timeout fired in this same request or a moment earlier.
      if (justTimedOut) break;
      if (action.seen && !samePhase(action.seen, phaseToken(state))) break;
      advance(state, now);
      break;

    case 'PREV_PHASE':
      // Only safe backwards step: re-show the answer after the leaderboard.
      if (state.gameMode === 'BRAINROT' && state.subPhase === 'LEADERBOARD') state.subPhase = 'REVEAL';
      break;

    case 'SET_GAME_MODE':
      jumpToMode(state, action.mode, now);
      break;

    case 'ADD_TIME':
      if (state.isTimerRunning) state.timerTotal += Math.max(1, Math.min(60, action.seconds));
      break;

    case 'RESET_GAME': {
      const players = state.players;
      const fresh = createInitialGameState(state.roomCode, now);
      for (const p of Object.values(players)) {
        p.score = 0;
        p.streak = 0;
        p.hasSubmitted = false;
        delete p.pendingAnswer;
        delete p.lastRound;
      }
      Object.assign(state, fresh, { players, version: state.version });
      break;
    }

    case 'CLEAR_PLAYERS':
      Object.assign(state, createInitialGameState(state.roomCode, now), { version: state.version });
      break;
  }

  state.version++;
  return state;
}

/** Jump straight to the start of a game (used by the host's stage buttons). */
function jumpToMode(state: GameState, mode: GameMode, now: number) {
  if (mode === state.gameMode) return;
  switch (mode) {
    case 'LOBBY':
      beginLobby(state);
      break;
    case 'BRAINROT':
      beginQuestion(state, 0, now);
      break;
    case 'QUIPLASH':
      for (const p of state.quiplashPrompts) p.submissions = [];
      beginQuiplashRound(state, 0, now);
      break;
    case 'FLAGS':
      for (const s of state.flagScenarios) s.voters = {};
      beginFlag(state, 0, now);
      break;
    case 'PODIUM':
      beginPodium(state);
      break;
  }
}

// ---------------------------------------------------------------------------
// Player messages
// ---------------------------------------------------------------------------

const MAX_PLAYERS = 300;
const LATENCY_ALLOWANCE_MS = 1500;
const MAX_NAME = 32;
const MAX_PUNCHLINE = 120;

function cleanText(s: unknown, max: number): string {
  return String(s ?? '')
    .replace(/[ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export interface ClientResult {
  playerId?: string;
  error?: string;
}

export function reduceClientMessage(state: GameState, msg: ClientMessage, now: number): ClientResult {
  applyTimeout(state, now);

  switch (msg.type) {
    case 'JOIN_GAME': {
      const name = cleanText(msg.name, MAX_NAME);
      if (!name) return { error: 'Please enter a name.' };
      const existing = msg.existingId ? state.players[msg.existingId] : undefined;
      if (!existing && Object.keys(state.players).length >= MAX_PLAYERS) return { error: 'Room is full.' };

      const id = existing?.id ?? `p-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      state.players[id] = {
        id,
        name,
        avatar: cleanText(msg.avatar, 16) || 'Turbine',
        isAbuDhabiOffice: !!msg.isOffice,
        score: existing?.score ?? 0,
        streak: existing?.streak ?? 0,
        joinedAt: existing?.joinedAt ?? now,
        lastActive: now,
        hasSubmitted: existing?.hasSubmitted ?? false,
        pendingAnswer: existing?.pendingAnswer,
        lastRound: existing?.lastRound,
      };
      state.version++;
      return { playerId: id };
    }

    case 'SUBMIT_QUIZ_ANSWER': {
      const p = state.players[msg.playerId];
      if (!p) return { error: 'Unknown player.' };
      if (state.gameMode !== 'BRAINROT' || state.subPhase !== 'QUESTION' || !state.isTimerRunning)
        return { error: 'This question is closed.' };
      if (!roundIsLive(state, now)) return { error: 'Not yet — get ready!' };
      if (p.pendingAnswer) return {}; // first tap wins; ignore duplicates
      const q = currentQuestion(state);
      const idx = Number(msg.optionIndex);
      if (!q || !Number.isInteger(idx) || idx < 0 || idx >= q.options.length) return { error: 'Bad option.' };
      // Latency compensation: trust the phone's own reaction time, but never by
      // more than LATENCY_ALLOWANCE_MS earlier than the server saw it (un-gameable beyond that).
      const serverElapsed = now - state.roundStartTime;
      const claimed = typeof msg.clientElapsedMs === 'number' && Number.isFinite(msg.clientElapsedMs) ? msg.clientElapsedMs : serverElapsed;
      const elapsed = Math.max(0, Math.min(serverElapsed, Math.max(claimed, serverElapsed - LATENCY_ALLOWANCE_MS), state.timerTotal * 1000));
      p.pendingAnswer = { optionIndex: idx, answeredAt: state.roundStartTime + elapsed };
      p.hasSubmitted = true;
      p.lastActive = now;
      state.version++;
      return {};
    }

    case 'SUBMIT_QUIPLASH_ANSWER': {
      const p = state.players[msg.playerId];
      if (!p) return { error: 'Unknown player.' };
      if (state.gameMode !== 'QUIPLASH' || state.subPhase !== 'SUBMIT') return { error: 'Submissions are closed.' };
      if (!roundIsLive(state, now)) return { error: 'Not yet — get ready!' };
      const prompt = currentPrompt(state);
      if (!prompt || prompt.id !== msg.promptId) return { error: 'Wrong round.' };
      const text = cleanText(msg.text, MAX_PUNCHLINE).replace(/^["\u201c\u201d']+|["\u201c\u201d']+$/g, '').trim();
      if (!text) return { error: 'Write something first.' };
      const existing = prompt.submissions.find(s => s.playerId === p.id);
      if (existing) existing.text = text;
      else
        prompt.submissions.push({
          id: `s-${p.id}-${prompt.id}`,
          playerId: p.id,
          playerName: p.name,
          avatar: p.avatar,
          text,
          votes: [],
        });
      p.hasSubmitted = true;
      p.lastActive = now;
      state.version++;
      return {};
    }

    case 'VOTE_QUIPLASH': {
      const p = state.players[msg.playerId];
      if (!p) return { error: 'Unknown player.' };
      if (state.gameMode !== 'QUIPLASH' || state.subPhase !== 'VOTING') return { error: 'Voting is closed.' };
      if (!roundIsLive(state, now)) return { error: 'Not yet — get ready!' };
      const prompt = currentPrompt(state);
      if (!prompt || prompt.id !== msg.promptId) return { error: 'Wrong round.' };
      const target = prompt.submissions.find(s => s.id === msg.submissionId);
      if (!target) return { error: 'Unknown punchline.' };
      if (target.playerId === p.id) return { error: 'Nice try — no voting for yourself.' };
      for (const s of prompt.submissions) s.votes = s.votes.filter(v => v !== p.id);
      target.votes.push(p.id);
      p.hasSubmitted = true;
      p.lastActive = now;
      state.version++;
      return {};
    }

    case 'SUBMIT_FLAG': {
      const p = state.players[msg.playerId];
      if (!p) return { error: 'Unknown player.' };
      if (state.gameMode !== 'FLAGS' || state.subPhase !== 'SWIPE') return { error: 'Voting is closed.' };
      if (!roundIsLive(state, now)) return { error: 'Not yet — get ready!' };
      const scenario = currentScenario(state);
      if (!scenario || scenario.id !== msg.scenarioId) return { error: 'Wrong scenario.' };
      if (msg.vote !== 'RED' && msg.vote !== 'GREEN') return { error: 'Bad vote.' };
      scenario.voters[p.id] = msg.vote;
      p.hasSubmitted = true;
      p.lastActive = now;
      state.version++;
      return {};
    }

    default:
      return { error: 'Unknown message.' };
  }
}

// ---------------------------------------------------------------------------
// Player projection
//
// The full room state grows with headcount: at 150 players a mid-game state is
// ~170KB, and sending that to every phone every second is both wasteful (parse
// cost and battery on a mid-range phone, stutter on weak 4G) and leaky — it
// contains everyone's answers and every punchline's author before the reveal.
//
// A phone only needs its own row, the thing currently on screen, and a couple of
// aggregates. This keeps the GameState shape so nothing downstream has to change.
// ---------------------------------------------------------------------------

export function projectForPlayer(state: GameState, playerId: string | null): GameState {
  const me = playerId ? state.players[playerId] : undefined;
  const players: Record<string, Player> = me ? { [me.id]: me } : {};
  const rank = me ? rankOf(me, state.players) : undefined;

  const quiplashPrompts = state.quiplashPrompts.map((p, i): QuiplashPrompt => {
    const bare = { id: p.id, prompt: p.prompt, submissions: [] as QuiplashSubmission[] };
    if (state.gameMode !== 'QUIPLASH' || i !== state.currentQuestionIndex || !me) return bare;

    if (state.subPhase === 'SUBMIT') {
      // Just this player's own punchline, so the phone can show it back and allow an edit.
      return { ...bare, submissions: p.submissions.filter(s => s.playerId === me.id) };
    }

    if (state.subPhase === 'VOTING') {
      // This phone's ballot only, stripped of authorship: names are the reveal's payoff,
      // and anything sent to the client is readable by the client.
      const submissions = getBallot(p, me.id).map(s => ({
        id: s.id,
        playerId: '',
        playerName: '',
        avatar: '',
        text: s.text,
        votes: s.votes.includes(me.id) ? [me.id] : [],
      }));
      return { ...bare, submissions };
    }

    return bare; // REVEAL: the phone shows its own scorecard; the big screen has the authors.
  });

  const flagScenarios = state.flagScenarios.map((s, i) => ({
    id: s.id,
    statement: s.statement,
    context: s.context,
    voters: me && i === state.currentFlagIndex && s.voters[me.id] ? { [me.id]: s.voters[me.id] } : {},
  }));

  return {
    ...state,
    players,
    quiplashPrompts,
    flagScenarios,
    playerCount: Object.keys(state.players).length,
    myRank: rank?.rank,
    myTied: rank?.tied,
  };
}
