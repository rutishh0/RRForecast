import { BrainrotQuestion, QuiplashPrompt, FlagScenario } from './types';

/**
 * All game content lives here. Edit freely — nothing else in the app hard-codes
 * questions, prompts or scenarios.
 *
 * Each game draws the first N items from its pool (see GAME_CONFIG), so you can
 * reorder to choose what gets played, and keep spares at the bottom.
 *
 * Keep option text short: it has to be readable on a phone AND on a compressed
 * Teams screen-share. Every wrong option should be a *plausible misreading* of
 * the slang — funny, but clearly wrong once the meaning clicks.
 */

export const GAME_CONFIG = {
  /** How many items from each pool are played in a session (~30 min total). */
  quizQuestions: 8,
  quiplashRounds: 3,
  flagScenarios: 8,

  quizSeconds: 20,
  /** 'Get ready' beat before every timed phase, so nobody loses a question to finding their phone. */
  preRollSeconds: 4,
  quiplashWriteSeconds: 45,
  quiplashVoteSeconds: 25,
  flagSeconds: 15,
  /** How many other people's punchlines each phone gets to vote between. */
  quiplashBallotSize: 3,
  points: {
    /** Brainrot: correct = base + speed (decays to 0 over the timer) + Fast Five bonus for the first N correct answers. */
    quizBase: 500,
    quizSpeedMax: 250,
    quizFastFiveCount: 5,
    quizFastFiveBonus: 250,
    quiplashPerVote: 250,
    /** Max points a punchline can earn from votes in one round (keeps a landslide from deciding the podium). */
    quiplashVoteCap: 2500,
    quiplashRoundWinner: 1000,
    quiplashSubmitted: 100,
    flagParticipation: 100,
    flagMajorityBonus: 150,
  },
} as const;

// ---------------------------------------------------------------------------
// GAME 1 — BRAINROT DECRYPTOR
// A Gen-Z-flavoured line about something real in MEA. Pick what it actually means.
// ---------------------------------------------------------------------------
export const BRAINROT_QUESTIONS: BrainrotQuestion[] = [
  {
    id: 1,
    slangPrompt: "Omar's '12 Weeks Until Christmas' deck just dropped and the whole region is locked in.",
    options: [
      { text: 'Everyone has booked their December leave early.', isCorrect: false },
      { text: 'Year-end targets are live and the region is heads-down until close.', isCorrect: true },
      { text: 'Omar has scheduled twelve more weekly reviews.', isCorrect: false },
      { text: 'The Christmas party venue has finally been confirmed.', isCorrect: false },
    ],
    explanation: '"Locked in" = fully focused. For twelve weeks, apparently.',
  },
  {
    id: 2,
    slangPrompt: 'AOG at 2am. Line maintenance said "say less" and it was airborne by breakfast.',
    options: [
      { text: 'Maintenance refused to discuss it until the morning.', isCorrect: false },
      { text: 'They asked for fewer details on the work order.', isCorrect: false },
      { text: 'They got it instantly and fixed it without any fuss.', isCorrect: true },
      { text: 'The aircraft was grounded for the rest of the week.', isCorrect: false },
    ],
    explanation: '"Say less" = I\'m on it, no further explanation needed. The best two words in aviation.',
  },
  {
    id: 3,
    slangPrompt: 'That A350 turnaround last night was pure cinema. No notes.',
    options: [
      { text: 'The turnaround was filmed for a training video.', isCorrect: false },
      { text: 'It went flawlessly and there is nothing to improve.', isCorrect: true },
      { text: 'The flight was late, and the crew were very apologetic.', isCorrect: false },
      { text: 'The customer has sent a formal complaint.', isCorrect: false },
    ],
    explanation: '"No notes" = perfect. Rare enough to deserve a slide.',
  },
  {
    id: 4,
    slangPrompt: 'The spare engine is stuck at customs and one form is giving main character energy.',
    options: [
      { text: 'Customs fast-tracked the shipment as a priority.', isCorrect: false },
      { text: 'The engine was split across two flights by mistake.', isCorrect: false },
      { text: 'A single piece of paperwork thinks the whole region revolves around it.', isCorrect: true },
      { text: 'The engine cleared, but the transport stand did not.', isCorrect: false },
    ],
    explanation: '"Main character energy" = behaving like the plot revolves around you. In this case: a customs form.',
  },
  {
    id: 5,
    slangPrompt: 'Slide 47 of the Five-Year Plan is lowkey a lot, but Harriet ate.',
    options: [
      { text: 'Slide 47 was removed at the last minute.', isCorrect: false },
      { text: 'Harriet skipped lunch to finish the deck.', isCorrect: false },
      { text: 'The plan is being rewritten by Derby.', isCorrect: false },
      { text: 'The plan is ambitious, and Harriet presented it brilliantly.', isCorrect: true },
    ],
    explanation: '"Ate" = delivered impeccably. "Lowkey a lot" = ambitious, said quietly.',
  },
  {
    id: 6,
    slangPrompt: "The lessor's counter-offer is delulu, but Craig is cooking.",
    options: [
      { text: 'The offer is unrealistic, and Sales is working on a response.', isCorrect: true },
      { text: 'The lessor has walked away from the table.', isCorrect: false },
      { text: 'Craig has taken the lessor out for dinner.', isCorrect: false },
      { text: "The deal was signed at the lessor's number.", isCorrect: false },
    ],
    explanation: '"Delulu" = delusional. "Cooking" = something good is being prepared. Watch this space.',
  },
  {
    id: 7,
    slangPrompt: "Tim's Trent 1000 update: the fleet is finally giving what it's supposed to give.",
    options: [
      { text: 'The fleet is finally performing the way it was designed to.', isCorrect: true },
      { text: 'The fleet is generating exactly as many issues as forecast.', isCorrect: false },
      { text: 'The engines are being handed back to the customer early.', isCorrect: false },
      { text: 'The update has been pushed to next quarter.', isCorrect: false },
    ],
    explanation: '"Giving what it\'s supposed to give" = doing exactly its job. High praise, in slang.',
  },
  {
    id: 8,
    slangPrompt: '7am UK, 10am Gulf. Cameras on. We are not being NPCs today.',
    options: [
      { text: 'The call has been cancelled.', isCorrect: false },
      { text: 'Only presenters need their cameras on.', isCorrect: false },
      { text: 'Everyone is expected to be visibly present and actually engaged.', isCorrect: true },
      { text: 'The call will be recorded for anyone who misses it.', isCorrect: false },
    ],
    explanation: 'NPC = non-player character. Present, but not really there. You know who you are.',
  },
  // --- spares below (played only if quizQuestions is raised) ---------------
  {
    id: 9,
    slangPrompt: "The lessor said 'we'll revert by Thursday'. It's Thursday. Bestie, the ick.",
    options: [
      { text: 'The lessor replied early with good news.', isCorrect: false },
      { text: 'The promised reply never came, and trust is quietly fading.', isCorrect: true },
      { text: 'The lessor has asked for a Thursday meeting instead.', isCorrect: false },
      { text: 'The contract has been reverted to the old terms.', isCorrect: false },
    ],
    explanation: '"The ick" = a sudden, small loss of respect. Usually over something tiny. Like a missed Thursday.',
  },
  {
    id: 10,
    slangPrompt: "Sarah's Commercial Good News slide gagged the entire call.",
    options: [
      { text: 'The audio dropped and nobody could speak.', isCorrect: false },
      { text: 'The slide accidentally showed a confidential number.', isCorrect: false },
      { text: 'Everyone was stunned into silence, in a good way.', isCorrect: true },
      { text: 'The good news was pulled at the last minute.', isCorrect: false },
    ],
    explanation: '"Gagged" = left speechless with admiration. Nobody was harmed.',
  },
  {
    id: 11,
    slangPrompt: "Steve's XWB fleet strategy has range. Literally and figuratively.",
    options: [
      { text: 'The XWB fleet is being retired early.', isCorrect: false },
      { text: 'The strategy only covers short-haul routes.', isCorrect: false },
      { text: 'The strategy is impressive — and the aircraft does fly a long way.', isCorrect: true },
      { text: 'The presentation had far too many slides.', isCorrect: false },
    ],
    explanation: '"Has range" = versatile and impressive. Also, it\'s a Trent XWB. It does have range.',
  },
  {
    id: 12,
    slangPrompt: 'Commercial Hoppers with Matt, Georgia and Ahmed: a full hour, and it understood the assignment.',
    options: [
      { text: 'The session overran by an hour.', isCorrect: false },
      { text: 'It was exactly what the room needed.', isCorrect: true },
      { text: 'The slides were reused from last year.', isCorrect: false },
      { text: 'Everyone was given homework.', isCorrect: false },
    ],
    explanation: '"Understood the assignment" = nailed the brief. No further questions.',
  },
];

// ---------------------------------------------------------------------------
// GAME 2 — MEA QUIPLASH (first `quiplashRounds` prompts are played)
// ---------------------------------------------------------------------------
export const QUIPLASH_PROMPTS: QuiplashPrompt[] = [
  { id: 1, prompt: 'The real reason the spare engine was held at customs for 48 hours: ______', submissions: [] },
  { id: 2, prompt: "Rejected title for Omar's '12 Weeks Until Christmas' session: ______", submissions: [] },
  { id: 3, prompt: 'The worst thing you could accidentally say on a call with an airline CEO: ______', submissions: [] },
  // --- spares ---------------------------------------------------------------
  { id: 4, prompt: 'A new TotalCare clause that would genuinely make life easier: ______', submissions: [] },
  { id: 5, prompt: "The MEA team's honest out-of-office message for Half Hands week: ______", submissions: [] },
  { id: 6, prompt: 'Year six of the Five-Year Plan: ______', submissions: [] },
  { id: 7, prompt: 'Our unofficial regional motto, if HR would allow it: ______', submissions: [] },
  { id: 8, prompt: "The most Rolls-Royce way to say 'no': ______", submissions: [] },
];

// ---------------------------------------------------------------------------
// GAME 3 — RED FLAG / GREEN FLAG (first `flagScenarios` are played)
// ---------------------------------------------------------------------------
export const FLAG_SCENARIOS: FlagScenario[] = [
  { id: 1, statement: "Replying-all with just 'Thanks!' on a 400-person regional email chain.", context: 'Email etiquette', voters: {} },
  { id: 2, statement: "Saying 'let's take this offline' the moment an airline director asks something you can't answer.", context: 'Customer meetings', voters: {} },
  { id: 3, statement: 'Camera off the exact second your slide is finished.', context: 'Half Hands protocol', voters: {} },
  { id: 4, statement: "Booking an 'urgent' Abu Dhabi trip that somehow always lands on a Thursday.", context: 'Travel & expenses', voters: {} },
  { id: 5, statement: 'A Teams ping marked URGENT at 4:58pm on the Friday before a long weekend.', context: 'Team sanity', voters: {} },
  { id: 6, statement: "Replying to a customer WhatsApp at 11pm because it's still the afternoon in Derby.", context: 'Time zones', voters: {} },
  { id: 7, statement: 'Booking the 6am flight to save the company a hotel night.', context: 'Travel & expenses', voters: {} },
  { id: 8, statement: 'Reacting to a serious customer escalation with a thumbs-up emoji.', context: 'Teams etiquette', voters: {} },
  // --- spares ---------------------------------------------------------------
  { id: 9, statement: "Putting 'per my last email' in a reply to a customer.", context: 'Passive aggression', voters: {} },
  { id: 13, statement: "A 30-minute meeting titled 'Quick sync' that runs for ninety.", context: 'Calendar crimes', voters: {} },
  { id: 14, statement: "Forwarding a 47-message email thread with just 'FYI'.", context: 'Email etiquette', voters: {} },
  { id: 10, statement: 'Joining the call from an airport lounge with the boarding announcements on full volume.', context: 'Remote working', voters: {} },
  { id: 11, statement: 'Eating lunch on camera with the mic on.', context: 'Remote working', voters: {} },
  { id: 12, statement: 'Camera off for the entire Half Hands, then on for the podium.', context: 'Half Hands protocol', voters: {} },
];

// ---------------------------------------------------------------------------

/** The items actually played this session. */
export const ACTIVE_QUESTIONS = BRAINROT_QUESTIONS.slice(0, GAME_CONFIG.quizQuestions);
export const ACTIVE_PROMPTS = QUIPLASH_PROMPTS.slice(0, GAME_CONFIG.quiplashRounds);
export const ACTIVE_FLAGS = FLAG_SCENARIOS.slice(0, GAME_CONFIG.flagScenarios);

export const AVATAR_OPTIONS = [
  { id: 'Turbine', label: 'Turbine Fan', icon: '🌀' },
  { id: 'Jet', label: 'Widebody', icon: '✈️' },
  { id: 'KarakCup', label: 'Karak Chai', icon: '☕' },
  { id: 'Wrench', label: 'Spanner', icon: '🔧' },
  { id: 'Falcon', label: 'Falcon', icon: '🦅' },
  { id: 'Passport', label: 'Passport', icon: '🛂' },
];

export function avatarIcon(avatarId?: string): string {
  return AVATAR_OPTIONS.find(a => a.id === avatarId)?.icon ?? '✈️';
}
