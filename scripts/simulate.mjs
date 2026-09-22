/**
 * End-to-end bot playthrough against a running server.
 *
 *   node scripts/simulate.mjs [players=40] [base=http://localhost:3000] [room=SIM]
 *
 * Joins N players, drives the host through every phase, has every bot answer /
 * write / vote concurrently, and asserts the state machine + scoring behave.
 * Exits non-zero on the first failed assertion.
 */

const PLAYERS = Number(process.argv[2] || 40);
const BASE = process.argv[3] || 'http://localhost:3000';
const ROOM = (process.argv[4] || 'SIM').toUpperCase();
const HOST_KEY = process.env.HOST_KEY || '';

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    failures++;
    console.log(`  ✗ ${msg}`);
  }
};

async function get() {
  const r = await fetch(`${BASE}/api/game/sync?room=${ROOM}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`GET ${r.status}`);
  return (await r.json()).state;
}
async function post(body) {
  const headers = { 'Content-Type': 'application/json' };
  if (HOST_KEY) headers['x-host-key'] = HOST_KEY;
  const r = await fetch(`${BASE}/api/game/sync`, { method: 'POST', headers, body: JSON.stringify({ room: ROOM, ...body }) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`POST ${r.status} ${data.error || ''}`);
  return data;
}
const host = action => post({ role: 'host', action });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PREROLL_MS = 4200;
const t0 = Date.now();
const stamp = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

console.log(`\nSimulating ${PLAYERS} players in room ${ROOM} against ${BASE}\n`);

// ---------------------------------------------------------------------------
console.log('[1] Fresh room');
await host({ type: 'CLEAR_PLAYERS' });
let s = await get();
ok(s.gameMode === 'LOBBY' && Object.keys(s.players).length === 0, 'room cleared to empty lobby');

// ---------------------------------------------------------------------------
console.log(`[2] ${PLAYERS} players join concurrently`);
const t1 = Date.now();
const bots = await Promise.all(
  Array.from({ length: PLAYERS }, (_, i) =>
    post({ type: 'JOIN_GAME', name: `Bot ${i + 1} – ${i % 5 === 0 ? 'Abu Dhabi' : 'Remote'}`, avatar: ['Turbine', 'Jet', 'KarakCup', 'Wrench', 'Falcon', 'Passport'][i % 6], isOffice: i % 5 === 0 }).then(d => ({
      id: d.playerId,
      name: `Bot ${i + 1}`,
    })),
  ),
);
s = await get();
ok(Object.keys(s.players).length === PLAYERS, `all ${PLAYERS} joins persisted (${Date.now() - t1}ms, no lost updates)`);
ok(bots.every(b => b.id), 'every join returned a playerId');

// Rejoin keeps identity
const rejoin = await post({ type: 'JOIN_GAME', name: 'Bot 1 renamed', avatar: 'Jet', isOffice: false, existingId: bots[0].id });
ok(rejoin.playerId === bots[0].id, 'rejoin with existingId keeps the same player');

// ---------------------------------------------------------------------------
console.log('[3] Brainrot Decryptor');
await host({ type: 'START_GAME' });
s = await get();
ok(s.gameMode === 'BRAINROT' && s.subPhase === 'QUESTION' && s.isTimerRunning, 'START_GAME opens question 1 with timer');
ok(s.timerSeconds > 0 && s.timerSeconds <= 20, `derived timer = ${s.timerSeconds}s`);

const totalQuestions = 8;
for (let q = 0; q < totalQuestions; q++) {
  s = await get();
  ok(s.subPhase === 'QUESTION' && s.currentQuestionIndex === q, `question ${q + 1} open`);
  const early = await post({ type: 'SUBMIT_QUIZ_ANSWER', playerId: bots[0].id, optionIndex: 0 });
  ok(!!early.error, `answer during get-ready rejected ("${early.error}")`);
  await sleep(PREROLL_MS);
  // Everyone answers at once; half pick option 0, others spread. Bot 0 double-taps.
  await Promise.all(bots.map((b, i) => post({ type: 'SUBMIT_QUIZ_ANSWER', playerId: b.id, optionIndex: i % 4 })));
  const dup = await post({ type: 'SUBMIT_QUIZ_ANSWER', playerId: bots[0].id, optionIndex: 3 });
  s = await get();
  const answered = Object.values(s.players).filter(p => p.pendingAnswer).length;
  ok(answered === PLAYERS, `all ${PLAYERS} answers recorded (${answered})`);
  ok(s.players[bots[0].id].pendingAnswer.optionIndex === 0 && !dup.error, 'second tap ignored, first answer kept');
  const before = Object.fromEntries(Object.values(s.players).map(p => [p.id, p.score]));

  await host({ type: 'NEXT_PHASE' }); // REVEAL
  s = await get();
  ok(s.subPhase === 'REVEAL' && !s.isTimerRunning, 'reveal stops the timer');
  const gained = Object.values(s.players).filter(p => p.score > before[p.id]);
  const correctCount = Object.values(s.players).filter(p => p.lastRound?.correct).length;
  ok(gained.length === correctCount && correctCount > 0, `${correctCount} correct players scored, nobody else did`);
  ok(gained.every(p => p.lastRound.points >= 500 && p.lastRound.points <= 1000), 'points within 500–1000');
  const fastFive = Object.values(s.players).filter(p => /Fast Five/.test(p.lastRound?.label || ''));
  ok(fastFive.length === Math.min(5, correctCount) && fastFive.every(p => p.lastRound.points >= 750), `Fast Five bonus went to exactly ${fastFive.length} players`);

  await host({ type: 'NEXT_PHASE' }); // LEADERBOARD
  s = await get();
  ok(s.subPhase === 'LEADERBOARD', 'leaderboard');
  await host({ type: 'NEXT_PHASE' }); // next question or quiplash
}
s = await get();
ok(s.gameMode === 'QUIPLASH' && s.subPhase === 'SUBMIT', 'after last question → Quiplash round 1 SUBMIT');

// Late joiner mid-game
const late = await post({ type: 'JOIN_GAME', name: 'Late Larry', avatar: 'Falcon', isOffice: false });
bots.push({ id: late.playerId, name: 'Late Larry' });
s = await get();
ok(!!s.players[late.playerId] && s.players[late.playerId].score === 0, 'late joiner added with 0 points');

// ---------------------------------------------------------------------------
console.log('[4] Quiplash ×3 (round 2 via timer expiry)');
for (let r = 0; r < 3; r++) {
  s = await get();
  ok(s.gameMode === 'QUIPLASH' && s.subPhase === 'SUBMIT' && s.currentQuestionIndex === r, `round ${r + 1} SUBMIT open`);
  const prompt = s.quiplashPrompts[r];
  await sleep(PREROLL_MS);
  // 80% of bots submit; one edits theirs.
  const writers = bots.filter((_, i) => i % 5 !== 4);
  await Promise.all(writers.map((b, i) => post({ type: 'SUBMIT_QUIPLASH_ANSWER', playerId: b.id, promptId: prompt.id, text: `Punchline ${i} from ${b.name}` })));
  await post({ type: 'SUBMIT_QUIPLASH_ANSWER', playerId: writers[0].id, promptId: prompt.id, text: 'Edited punchline' });
  s = await get();
  const subs = s.quiplashPrompts[r].submissions;
  ok(subs.length === writers.length, `${subs.length} punchlines stored (one per writer, edit did not duplicate)`);
  ok(subs.find(x => x.playerId === writers[0].id)?.text === 'Edited punchline', 'edit overwrote text');

  if (r === 1) {
    // Let the 45s timer expire naturally to prove the timeout path resets flags.
    const remaining = s.timerSeconds;
    console.log(`  … waiting ${remaining + 3}s for the write timer to expire (${stamp()})`);
    await sleep((remaining + 3) * 1000); // display 0 + 1.5s server grace
    s = await get();
    ok(s.subPhase === 'VOTING', 'timer expiry auto-opened VOTING');
    ok(Object.values(s.players).every(p => !p.hasSubmitted), 'hasSubmitted reset on timeout → phones can vote');
  } else {
    await host({ type: 'NEXT_PHASE' });
    s = await get();
    ok(s.subPhase === 'VOTING' && s.isTimerRunning, 'host opened VOTING');
  }

  // Everyone votes on their ballot (deterministic per player). Bot 1 changes its mind.
  await sleep(PREROLL_MS);
  const prompt2 = s.quiplashPrompts[r];
  const ballotFor = pid => prompt2.submissions.filter(x => x.playerId !== pid);
  await Promise.all(
    bots.map(b => {
      const opts = ballotFor(b.id);
      if (opts.length === 0) return null;
      return post({ type: 'VOTE_QUIPLASH', playerId: b.id, promptId: prompt2.id, submissionId: opts[b.id.charCodeAt(4) % opts.length].id });
    }),
  );
  const own = prompt2.submissions.find(x => x.playerId === writers[1].id);
  const selfVote = await post({ type: 'VOTE_QUIPLASH', playerId: writers[1].id, promptId: prompt2.id, submissionId: own.id });
  ok(!!selfVote.error, 'self-vote rejected');
  const other = ballotFor(bots[1].id)[0];
  await post({ type: 'VOTE_QUIPLASH', playerId: bots[1].id, promptId: prompt2.id, submissionId: other.id });
  s = await get();
  const votesTotal = s.quiplashPrompts[r].submissions.reduce((n, x) => n + x.votes.length, 0);
  ok(votesTotal === bots.length, `exactly one vote per player after vote changes (${votesTotal}/${bots.length})`);

  const before = Object.fromEntries(Object.values(s.players).map(p => [p.id, p.score]));
  await host({ type: 'NEXT_PHASE' }); // REVEAL
  s = await get();
  ok(s.subPhase === 'REVEAL', 'authors revealed');
  const standings = [...s.quiplashPrompts[r].submissions].sort((a, b) => b.votes.length - a.votes.length);
  const winner = s.players[standings[0].playerId];
  const expected = 100 + Math.min(2500, standings[0].votes.length * 250) + 1000;
  ok(winner.score - before[winner.id] === expected, `winner got submit+votes+bonus = ${expected}`);
  const nonWriter = s.players[bots[4].id];
  ok(nonWriter.score === before[nonWriter.id], 'non-writers gained nothing from voting');

  await host({ type: 'NEXT_PHASE' });
}
s = await get();
ok(s.gameMode === 'FLAGS' && s.subPhase === 'SWIPE', 'after round 3 → Red/Green scenario 1');

// ---------------------------------------------------------------------------
console.log('[5] Red Flag / Green Flag ×8');
for (let f = 0; f < 8; f++) {
  s = await get();
  ok(s.gameMode === 'FLAGS' && s.currentFlagIndex === f && s.subPhase === 'SWIPE', `scenario ${f + 1} open`);
  const sc = s.flagScenarios[f];
  await sleep(PREROLL_MS);
  await Promise.all(bots.map((b, i) => post({ type: 'SUBMIT_FLAG', playerId: b.id, scenarioId: sc.id, vote: i % 3 === 0 ? 'GREEN' : 'RED' })));
  // Bot 0 flips its vote three times — must not farm points or double count.
  await post({ type: 'SUBMIT_FLAG', playerId: bots[0].id, scenarioId: sc.id, vote: 'RED' });
  await post({ type: 'SUBMIT_FLAG', playerId: bots[0].id, scenarioId: sc.id, vote: 'GREEN' });
  await post({ type: 'SUBMIT_FLAG', playerId: bots[0].id, scenarioId: sc.id, vote: 'RED' });
  s = await get();
  const voters = Object.keys(s.flagScenarios[f].voters).length;
  ok(voters === bots.length, `one vote per player (${voters})`);
  const before = Object.fromEntries(Object.values(s.players).map(p => [p.id, p.score]));
  await host({ type: 'NEXT_PHASE' });
  s = await get();
  ok(s.subPhase === 'REVEAL', 'reveal');
  const b0 = s.players[bots[0].id];
  ok(b0.score - before[b0.id] === 250, `vote-flipper scored exactly once, with majority (+250 = ${b0.score - before[b0.id]})`);
  const minority = Object.values(s.players).find(p => p.lastRound?.label === 'Against the room');
  ok(minority && minority.score - before[minority.id] === 100, 'minority voter got participation only (+100)');
  await host({ type: 'NEXT_PHASE' });
}
s = await get();
ok(s.gameMode === 'PODIUM', 'after scenario 8 → PODIUM');
const ranked = Object.values(s.players).sort((a, b) => b.score - a.score);
console.log(`  podium: ${ranked.slice(0, 3).map(p => `${p.name} ${p.score}`).join(' | ')}`);

// ---------------------------------------------------------------------------
console.log('[6] Stale host click is ignored');
{
  const seen = { gameMode: 'FLAGS', subPhase: 'SWIPE', currentQuestionIndex: s.currentQuestionIndex, currentFlagIndex: 0 };
  const before = (await get()).gameMode;
  await host({ type: 'NEXT_PHASE', seen });
  ok((await get()).gameMode === before, 'NEXT_PHASE with an out-of-date phase token did nothing');
}
console.log('[6] Closed-phase inputs are rejected');
const lateAns = await post({ type: 'SUBMIT_QUIZ_ANSWER', playerId: bots[0].id, optionIndex: 1 });
ok(!!lateAns.error, `quiz answer on podium rejected ("${lateAns.error}")`);

console.log('[7] Reset keeps players, zeroes scores');
await host({ type: 'RESET_GAME' });
s = await get();
ok(s.gameMode === 'LOBBY' && Object.keys(s.players).length === bots.length, 'back in lobby with everyone still joined');
ok(Object.values(s.players).every(p => p.score === 0), 'all scores zero');

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`} in ${stamp()}\n`);
process.exit(failures ? 1 : 0);
