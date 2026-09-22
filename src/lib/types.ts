export type GameMode = 'LOBBY' | 'BRAINROT' | 'QUIPLASH' | 'FLAGS' | 'PODIUM';

export type BrainrotSubPhase = 'QUESTION' | 'REVEAL' | 'LEADERBOARD';
export type QuiplashSubPhase = 'SUBMIT' | 'VOTING' | 'REVEAL';
export type FlagSubPhase = 'SWIPE' | 'REVEAL';
export type SubPhase = 'WAITING' | BrainrotSubPhase | QuiplashSubPhase | FlagSubPhase;

export type FlagVote = 'RED' | 'GREEN';

export interface Player {
  id: string;
  name: string;
  avatar: string; // key into AVATAR_OPTIONS
  score: number;
  isAbuDhabiOffice: boolean;
  streak: number;
  joinedAt: number;
  lastActive: number;
  /** True once the player has acted in the current sub-phase (answered / submitted / voted). */
  hasSubmitted: boolean;
  /** Brainrot: option tapped this question, plus when. Scored at REVEAL. */
  pendingAnswer?: { optionIndex: number; answeredAt: number };
  /** Set at each REVEAL so the phone can show "+750 — correct!" without spoiling early. */
  lastRound?: { points: number; correct?: boolean; label: string };
}

export interface BrainrotQuestion {
  id: number;
  slangPrompt: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
}

export interface QuiplashSubmission {
  id: string;
  playerId: string;
  playerName: string;
  avatar: string;
  text: string;
  votes: string[]; // voter player IDs
}

export interface QuiplashPrompt {
  id: number;
  prompt: string;
  submissions: QuiplashSubmission[];
}

export interface FlagScenario {
  id: number;
  statement: string;
  context: string;
  voters: Record<string, FlagVote>;
}

export interface GameState {
  roomCode: string;
  gameMode: GameMode;
  subPhase: SubPhase;
  /** Timer is derived: remaining = timerTotal - (now - roundStartTime). */
  timerTotal: number;
  roundStartTime: number;
  isTimerRunning: boolean;
  /** Filled in by the server on every read; never persisted as truth. */
  timerSeconds: number;
  players: Record<string, Player>;
  currentQuestionIndex: number; // Brainrot question OR Quiplash round
  quiplashPrompts: QuiplashPrompt[];
  flagScenarios: FlagScenario[];
  currentFlagIndex: number;
  sessionStartTime: number;
  version: number;

  // --- present only on the trimmed player view (see projectForPlayer) -------
  /** Total headcount, because `players` is trimmed to just you. */
  playerCount?: number;
  /** Your competition rank, computed server-side for the same reason. */
  myRank?: number;
  myTied?: boolean;
}

export type ClientMessage =
  | { type: 'JOIN_GAME'; name: string; avatar: string; isOffice: boolean; existingId?: string }
  | { type: 'SUBMIT_QUIZ_ANSWER'; playerId: string; optionIndex: number; clientElapsedMs?: number }
  | { type: 'SUBMIT_QUIPLASH_ANSWER'; playerId: string; promptId: number; text: string }
  | { type: 'VOTE_QUIPLASH'; playerId: string; promptId: number; submissionId: string }
  | { type: 'SUBMIT_FLAG'; playerId: string; scenarioId: number; vote: FlagVote };

/** Identifies the phase a host saw when they clicked, so a click that lands after an auto-advance is ignored. */
export interface PhaseToken {
  gameMode: GameMode;
  subPhase: SubPhase;
  currentQuestionIndex: number;
  currentFlagIndex: number;
}

export type HostAction =
  | { type: 'START_GAME' }
  | { type: 'SET_GAME_MODE'; mode: GameMode }
  | { type: 'NEXT_PHASE'; seen?: PhaseToken }
  | { type: 'PREV_PHASE' }
  | { type: 'ADD_TIME'; seconds: number }
  | { type: 'TOGGLE_TIMER' }
  | { type: 'RESET_GAME' }
  | { type: 'CLEAR_PLAYERS' };

export interface SyncResponse {
  state: GameState;
  serverTime: number;
  playerId?: string;
  error?: string;
}
