/**
 * Event-scale load test. Proves the room survives the real headcount.
 *
 *   node scripts/loadtest.mjs [players=150] [base=http://localhost:3000] [room=LOAD]
 *
 * Joins N players, then drives a full session where EVERY player acts in the same
 * instant on every question, punchline, vote and flag — the worst case, since real
 * people spread out over a few seconds. Reports failures, dropped inputs, latency
 * percentiles and payload sizes, and exits non-zero if anything is lost.
 */

const N = Number(process.argv[2] || 150);
const BASE = process.argv[3] || 'http://localhost:3000';
const ROOM = (process.argv[4] || 'LOAD').toUpperCase();

let failures = 0;
const problems = [];
const fail = msg => {
  failures++;
  problems.push(msg);
  console.log(`  ✗ ${msg}`);
};
const ok = msg => console.log(`  ✓ ${msg}`);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const PREROLL_MS = 4300;

async function get(params = '') {
  const r = await fetch(`${BASE}/api/game/sync?room=${ROOM}${params}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`GET ${r.status}`);
  return r.json();
}
async function post(body) {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/game/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room: ROOM, ...body }),
  });
  const ms = Date.now() - t0;
  let data = {};
  try {
    data = await r.json();
  } catch {}
  return { status: r.status, ms, data };
}
const host = action => post({ role: 'host', action });

const pct = (arr, p) => (arr.length ? arr.slice().sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor(arr.length * p))] : 0);
const stats = (label, ms) =>
  `${label}: p50 ${pct(ms, 0.5)}ms · p95 ${pct(ms, 0.95)}ms · max ${Math.max(...ms)}ms`;

/** Fire one action per player, all at once. Returns latencies and counts non-200s. */
async function burst(label, make) {
  const res = await Promise.all(ids.map(id => make(id)));
  const bad = res.filter(r => r.status !== 200);
  if (bad.length) fail(`${label}: ${bad.length}/${res.length} requests failed (e.g. ${bad[0].status} ${JSON.stringify(bad[0].data).slice(0, 120)})`);
  return res.map(r => r.ms);
}

console.log(`\nEvent-scale load test — ${N} players, room ${ROOM}, ${BASE}\n`);

// ---------------------------------------------------------------------------
console.log('[1] Join');
await host({ type: 'CLEAR_PLAYERS' });
const ids = [];
const joinMs = [];
{
  const res = await Promise.all(
    Array.from({ length: N }, (_, i) =>
      post({
        type: 'JOIN_GAME',
        name: `Player ${i + 1} – ${i % 6 === 0 ? 'Abu Dhabi' : 'Remote'}`,
        avatar: ['Turbine', 'Jet', 'KarakCup', 'Wrench', 'Falcon', 'Passport'][i % 6],
        isOffice: i % 6 === 0,
      }),
    ),
  );
  for (const r of res) {
    joinMs.push(r.ms);
    if (r.data.playerId) ids.push(r.data.playerId);
  }
  const bad = res.filter(r => r.status !== 200);
  if (bad.length) fail(`${bad.length} joins returned non-200`);
  if (ids.length !== N) fail(`only ${ids.length}/${N} joins persisted (lost updates)`);
  else ok(`all ${N} players joined in one burst — ${stats('latency', joinMs)}`);
  const s = (await get()).state;
  if (Object.keys(s.players).length !== N) fail(`server holds ${Object.keys(s.players).length}/${N} players`);
}

// ---------------------------------------------------------------------------
console.log('\n[2] Payload size (the thing that scales with headcount)');
{
  const hostBytes = JSON.stringify((await get()).state).length;
  const playerBytes = JSON.stringify((await get(`&view=player&pid=${ids[0]}`)).state).length;
  console.log(`  host view:   ${(hostBytes / 1024).toFixed(1)} KB`);
  console.log(`  player view: ${(playerBytes / 1024).toFixed(1)} KB  (${(hostBytes / playerBytes).toFixed(0)}x smaller)`);
  if (playerBytes > 8 * 1024) fail(`player payload is ${(playerBytes / 1024).toFixed(1)}KB — should stay a few KB at any headcount`);
  else ok('player payload stays small at full headcount');
  const pv = (await get(`&view=player&pid=${ids[0]}`)).state;
  if (Object.keys(pv.players).length !== 1) fail(`player view exposes ${Object.keys(pv.players).length} players (should be 1)`);
  else ok("player view contains only that phone's own row");
  if (pv.playerCount !== N) fail(`player view playerCount is ${pv.playerCount}, expected ${N}`);
}

// ---------------------------------------------------------------------------
console.log('\n[3] Brainrot — every player answers in the same instant');
await host({ type: 'START_GAME' });
const answerMs = [];
for (let q = 0; q < 8; q++) {
  let s = (await get()).state;
  if (s.subPhase !== 'QUESTION' || s.currentQuestionIndex !== q) fail(`expected question ${q + 1}, got ${s.gameMode}/${s.subPhase} #${s.currentQuestionIndex}`);
  await sleep(PREROLL_MS);
  answerMs.push(...(await burst(`Q${q + 1}`, id => post({ type: 'SUBMIT_QUIZ_ANSWER', playerId: id, optionIndex: Math.floor(Math.random() * 4) }))));
  await sleep(600);
  s = (await get()).state;
  const answered = Object.values(s.players).filter(p => p.pendingAnswer).length;
  if (answered !== N) fail(`Q${q + 1}: ${answered}/${N} answers stored`);
  await host({ type: 'NEXT_PHASE' }); // reveal
  await sleep(400);
  await host({ type: 'NEXT_PHASE' }); // leaderboard
  await sleep(400);
  await host({ type: 'NEXT_PHASE' }); // next
  await sleep(400);
}
ok(`8 questions, ${N} simultaneous answers each — ${stats('answer latency', answerMs)}`);

// ---------------------------------------------------------------------------
console.log('\n[4] Quiplash — every player writes, then every player votes');
const writeMs = [];
const voteMs = [];
for (let r = 0; r < 3; r++) {
  let s = (await get()).state;
  if (s.gameMode !== 'QUIPLASH' || s.subPhase !== 'SUBMIT') fail(`expected Quiplash round ${r + 1} SUBMIT, got ${s.gameMode}/${s.subPhase}`);
  const promptId = s.quiplashPrompts[s.currentQuestionIndex].id;
  await sleep(PREROLL_MS);
  writeMs.push(
    ...(await burst(`round ${r + 1} write`, id =>
      post({ type: 'SUBMIT_QUIPLASH_ANSWER', playerId: id, promptId, text: `Punchline from ${id.slice(-5)} with a realistic amount of text in it` }),
    )),
  );
  await sleep(600);
  s = (await get()).state;
  const subs = s.quiplashPrompts[s.currentQuestionIndex].submissions.length;
  if (subs !== N) fail(`round ${r + 1}: ${subs}/${N} punchlines stored`);

  await host({ type: 'NEXT_PHASE' }); // open voting
  await sleep(600);
  s = (await get()).state;
  if (s.subPhase !== 'VOTING') fail(`round ${r + 1}: voting did not open (${s.subPhase})`);
  await sleep(PREROLL_MS);

  // Each phone votes from its own ballot, exactly as the UI does.
  const ballots = await Promise.all(ids.map(id => get(`&view=player&pid=${id}`)));
  const leaked = ballots.filter(b => b.state.quiplashPrompts[b.state.currentQuestionIndex].submissions.some(x => x.playerName));
  if (leaked.length) fail(`${leaked.length} ballots exposed author names before the reveal`);
  else ok(`round ${r + 1}: ballots are anonymous`);

  voteMs.push(
    ...(await burst(`round ${r + 1} vote`, id => {
      const b = ballots[ids.indexOf(id)].state;
      const list = b.quiplashPrompts[b.currentQuestionIndex].submissions;
      if (!list.length) return Promise.resolve({ status: 200, ms: 0, data: {} });
      return post({ type: 'VOTE_QUIPLASH', playerId: id, promptId, submissionId: list[0].id });
    })),
  );
  await sleep(600);
  s = (await get()).state;
  const votes = s.quiplashPrompts[s.currentQuestionIndex].submissions.reduce((n, x) => n + x.votes.length, 0);
  if (votes !== N) fail(`round ${r + 1}: ${votes}/${N} votes stored`);

  await host({ type: 'NEXT_PHASE' }); // reveal
  await sleep(400);
  await host({ type: 'NEXT_PHASE' }); // next round / next game
  await sleep(400);
}
ok(`3 rounds — ${stats('write latency', writeMs)}`);
ok(`3 rounds — ${stats('vote latency', voteMs)}`);

// ---------------------------------------------------------------------------
console.log('\n[5] Red / Green — every player votes in the same instant');
const flagMs = [];
for (let f = 0; f < 8; f++) {
  let s = (await get()).state;
  if (s.gameMode !== 'FLAGS' || s.currentFlagIndex !== f) fail(`expected scenario ${f + 1}, got ${s.gameMode} #${s.currentFlagIndex}`);
  const scenarioId = s.flagScenarios[f].id;
  await sleep(PREROLL_MS);
  flagMs.push(...(await burst(`scenario ${f + 1}`, id => post({ type: 'SUBMIT_FLAG', playerId: id, scenarioId, vote: Math.random() < 0.5 ? 'RED' : 'GREEN' }))));
  await sleep(600);
  s = (await get()).state;
  const voters = Object.keys(s.flagScenarios[f].voters).length;
  if (voters !== N) fail(`scenario ${f + 1}: ${voters}/${N} votes stored`);
  await host({ type: 'NEXT_PHASE' });
  await sleep(400);
  await host({ type: 'NEXT_PHASE' });
  await sleep(400);
}
ok(`8 scenarios — ${stats('flag latency', flagMs)}`);

// ---------------------------------------------------------------------------
console.log('\n[6] Podium');
{
  const s = (await get()).state;
  if (s.gameMode !== 'PODIUM') fail(`expected PODIUM, got ${s.gameMode}`);
  else {
    const ranked = Object.values(s.players).sort((a, b) => b.score - a.score);
    const scored = ranked.filter(p => p.score > 0).length;
    ok(`podium reached — ${scored}/${N} players scored, top: ${ranked[0].name} ${ranked[0].score}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n[7] Sustained polling — what the room actually does between taps');
{
  // Real phones poll on their own clocks, so load arrives spread across each second
  // rather than as one synchronised burst. Firing all N at the same instant measures
  // this script's event loop, not the server.
  const seconds = 8;
  const latencies = [];
  const errors = [];
  const t0 = Date.now();
  await Promise.all(
    ids.map(async (id, i) => {
      await sleep((i / ids.length) * 1000); // this phone's offset within the second
      for (let s = 0; s < seconds; s++) {
        const t = Date.now();
        try {
          await get(`&view=player&pid=${id}`);
          latencies.push(Date.now() - t);
        } catch (e) {
          errors.push(String(e));
        }
        const drift = 1000 - (Date.now() - t);
        if (drift > 0) await sleep(drift);
      }
    }),
  );
  const elapsed = (Date.now() - t0) / 1000;
  const rate = Math.round(latencies.length / elapsed);
  ok(`${N} phones polling 1/s for ${seconds}s — ${latencies.length} reads at ${rate} req/s — ${stats('poll latency', latencies)}`);
  if (errors.length) fail(`${errors.length} polls errored (e.g. ${errors[0]})`);
  if (pct(latencies, 0.95) > 2000) fail(`p95 poll latency ${pct(latencies, 0.95)}ms is too slow for a 1s poll interval`);
  else ok('polling keeps up comfortably at event headcount');
}

console.log(`\n${failures === 0 ? `PASSED — ${N} players, nothing dropped` : `${failures} PROBLEM(S)`}\n`);
if (failures) problems.forEach(p => console.log(` - ${p}`));
process.exit(failures ? 1 : 0);
