# Half Hands Live — status, findings and next steps

**Last updated:** 22 Sept 2026 · **Event:** Thu 1 Oct 2026, 10:40–11:15 · **Expected:** 100–150 players

Read `README.md` for what this is and how to run it, and `CLAUDE.md` for the rules of the codebase. This file is the live picture: what works, what is broken, and what to do next.

---

## 1. Where things stand

**Deployed:** <https://www.internalrr.co.uk> (Vercel project `rr-forecast`, repo `rutishh0/RRForecast`, branch `main`).
Neon Postgres is connected and confirmed working (state survives instance recycling).

**Verified green on the live deployment:**
- 25-player end-to-end assertion suite (`scripts/simulate.mjs`) — all checks pass.
- 16 players × 5 simultaneous bursts — zero HTTP failures, zero lost answers.

**Verified green locally (built, not yet deployed):**
- 150-player load test (`scripts/loadtest.mjs`) — nothing dropped. Latencies: answers p50 611ms / p95 1.2s; polling p50 10ms / p95 1.1s at 113 req/s sustained.
- 20-player assertion suite, `tsc`, `eslint`, `npm run build` all clean.

**A full four-person live rehearsal was run on the deployed site** (host + three players, real clicks, distinct personas). It completed a whole session and produced the findings in section 3. The content was judged good; the session/identity handling was judged a blocker.

---

## 2. Work committed but NOT yet on production

Branch **`live-test-fixes`** holds two tested improvements that are *not* in production:

1. **Per-player projection** (`projectForPlayer` in `src/lib/gameLogic.ts`, served via `GET ?view=player&pid=…`).
   The full room state grows with headcount — at 150 players a mid-game state is ~170KB, and sending it to every phone every second means each handset parsing 170KB/s (battery, jank, stutter on weak 4G) *and* receiving everyone's answers plus every punchline's author before the reveal. The projection sends each phone only its own row, the thing on screen, and a couple of aggregates. Measured: **32.9KB → 1.9KB, and flat as headcount grows.** It also makes Quiplash ballots genuinely anonymous.
2. **Single-flight read coalescing** (`RoomWorker.refresh`) so an expired cache doesn't turn 150 simultaneous polls into 150 identical queries.

**To ship:** merge `live-test-fixes` into `main`, or cherry-pick. Re-run the suite + load test against the deployment afterwards.

---

## 3. Findings from the live four-person rehearsal

Personas: **Nadia** (host, Abu Dhabi), **Callum** (27, Derby, slang-native), **Fatima** (38, Muscat, careful reader on hotel 4G), **Geoff** (58, Bristol, joined late, not a phone person).

### 3a. One root cause produced most of the chaos

**Rejoining minted a brand-new player instead of resuming the existing one.** Everything below is downstream of it:

- Callum existed **twice** (4,368 and 6,311). His points were split across two records; combined he had 10,679, which beat Fatima's 10,201 — **so the rehearsal crowned the wrong winner.**
- Geoff had a ghost record on 0 plus his real one.
- The host screen said **"5 JOINED"** for three humans, and the final standings listed five names.
- Nadia's **"Answered N / M"** counter could therefore never reach 3/3. That was her only pacing signal, so she revealed questions early — which is why players experienced "my correct answer scored zero".
- Callum was offered **his own pre-edit punchline** to vote on: his old record's submission stayed in the pool under a different player id, so self-exclusion didn't catch it.

### 3b. The name field corrupts itself and then can't be edited

Hit 2 of 3 players independently. Typing at normal speed spliced the value: `GeofGeoff - Bristolf - Bristol`, `FatiFatima - Muscatma – Muscat` (caret resets to index 4 mid-typing). Afterwards the field was effectively append-only — ~60 backspaces changed nothing; select-all-then-type inserted instead of replacing.

**Cause:** it's a *controlled* React input (`value={name}`) inside a component that re-renders every second from polling. Keystrokes race the re-render.
**Fix:** make it **uncontrolled** (`defaultValue` + a ref read on submit), so external re-renders can never fight the user's typing. Also poll more slowly while the join form is open.

### 3c. Everything fails silently

Across all four reports, `read_console_messages(onlyErrors)` returned **no errors at all**, in a ~40-minute session containing all of the above. Missed answers, dropped edits and identity swaps produced no toast, no banner, nothing. Players can't distinguish "I was too slow" from "the app lost my tap".

### 3d. Timers are too tight

Three of eight questions lost at least one of three players to the clock; Red/Green's 15s window closed with only 1–2 of 3 voting. A slang line plus four multi-line options is a lot of reading on a phone.
**Agreed fix:** quiz 20s → **30s**, flags 15s → **20s**. The generous base score (500 of a max 1,000) means giving people time costs nothing competitively. Budget still fits 30 minutes (~22 min of content).

### 3e. Host-screen defects (Nadia)

| # | Issue | Severity |
|---|---|---|
| 1 | No per-player remove — the only control is "Remove everyone", so a ghost can't be cleared mid-show | must-fix |
| 2 | Timer froze on screen while the real deadline ran on, then auto-revealed at "Answered 2 / 4" | must-fix |
| 3 | No **pause** control anywhere; `+10s` didn't prevent the auto-reveal | must-fix |
| 4 | "GET READY" overlay rendered *through* the live slide for the first few seconds of every transition | must-fix (already fixed locally — overlay is now fully opaque; needs deploying) |
| 5 | Quiplash author reveal clipped when punchlines wrap to two lines; scrolling hid the header and the NEXT button | must-fix |
| 6 | Champion's name/score on the podium is dim teal under the densest confetti — least legible thing on the most photographed screen | must-fix |
| 7 | Phase button in the grey bar stops responding once the page is scrolled (Enter still works) | should-fix |
| 8 | Red/Green split bar disagreed with its own percentages for ~10s after reveal | should-fix |
| 9 | "100% OF THE ROOM" announced off a single vote | should-fix |
| 10 | Active nav chip renders label invisible against its fill | should-fix |
| 11 | Most buttons have no accessible name | nice-to-have |

### 3f. Player-side usability

- **Quiz answer text may not be part of the tap target** (Geoff lost a correct answer tapping the wording rather than the coloured letter block). The text *is* inside the `<button>`, so this may be a harness artifact — **verify by hand before changing anything.**
- Small print (`Correct = 500 + speed bonus…`, `Authors get +250 per vote`) is the smallest text on screen and went unread.
- The `Not you? Switch player` escape hatch is a thin underlined link; should be a proper button.
- Switching player silently discards the avatar choice.
- The lobby is a void while waiting — add a heartbeat so it doesn't look disconnected.
- Phone "FINAL STANDINGS" shows only your own rank; remote players can't see the top 3 they're squinting at on the shared screen.
- The reveal card shows only `THE ANSWER / C — …`. It never names or glosses the slang phrase, so Geoff got five right and still couldn't define "say less". **Put the explanation on the phone.**

### 3g. Copy and content corrections

- **`Authors get +250 per vote` is wrong/incomplete.** Actual: +100 for entering, +250 per vote, +1,000 for winning the round. Fatima reverse-engineered this and flagged it.
- **`It stays anonymous until the reveal`** reads as reassurance but means the opposite — your name *is* published moments later. Say so **before** they type.
- **Abu Dhabi toggle** is ambiguous for anyone neither in Abu Dhabi nor at home. Suggested: *"Are you physically in the Abu Dhabi office today?"* with explicit yes/no.
- **Red/Green scenario 6 had the time maths backwards.** The Gulf is *ahead* of the UK, so "11pm because it's still afternoon in Derby" is impossible. Replace with *"Booking a 6pm Derby call that lands at 9pm in Muscat."*
- **The Trent 1000 question is a reputational risk.** Flagged independently by Geoff and Fatima: durability is a live, public, customer-sensitive topic, and the site needs no login. Move the joke off the product (e.g. the spares pipeline).
- **Q5 gloss is wrong:** "lowkey a lot" means quietly *excessive*, not "ambitious".
- **Q3 is loose:** "pure cinema" alone can mean chaotic spectacle; only "no notes" forces the positive reading. Fix the explanation to say which half carries the meaning.
- **Quiplash round 3** ("worst thing to say to an airline CEO") rewards exactly the lines you'd least want screenshotted with a real employee's name under them. Either drop it or keep authorship anonymous.
- **Quiplash round 2** names a real colleague (Omar) and publishes whatever the room writes next to his session. Ask him first, or make the prompt about a thing rather than a person.
- **Fast Five** gave every player the bonus at 3 players; at 150 only five get it. Make it proportional (~first 10%, min 5).
- All eight Red/Green scenarios came back red. Seed one or two obvious greens for a change of energy.

### 3h. What the players liked (don't lose this)

- 7 of 8 quiz lines "sound like a real person" (Callum, the slang-native). "Say less" with the AOG framing was called the best line in the set.
- The design rewards **comprehension, not vocabulary** — Geoff came second without knowing the slang, because the surrounding sentence carries the meaning and the wrong options are plausible literal readings. Keep it decode-only; never ask anyone to *produce* slang.
- Red/Green is the crowd-pleaser and produced a genuine Bristol-vs-Gulf disagreement (the 6am flight). Keep scenarios 2, 6 and 7.
- The lobby screen, the `LOCKED IN` confirmation, the GET READY countdown and the scoring model were all praised.
- Scoring is genuinely fair to slow readers: speed is worth only 38–150 points of a ~750–1,000 correct answer.

### 3i. Investigated and dismissed

- **"The URL loses `?room=`"** (reported by all three players). Not reproducible: `internalrr.co.uk/play?room=MEA` 307s to `www.…/play?room=MEA` with the query intact. A browser-pane display artifact.
- **"Taps in the last 5 seconds are silently discarded."** A stopwatch test against the live API accepted taps at 5s, 1s and **0.9s after the display hit zero**, and rejected only at 2.5s past. The agents' perceived timings included several seconds of tool round-trip. The real cause of lost answers was the host revealing early (3a).
- **Host "Space doesn't advance."** The browser automation harness sends an empty key event for space; a real keyboard works. Enter now does the same thing and both are advertised.

---

## 4. Fixed earlier in this cycle (already on production)

**Write-race failures under real serverless concurrency** — commit `95038ca`. A dozen players answering at once produced intermittent 500s (`could not commit after 6 attempts`) and silently dropped answers. Locally there is one process, so per-room batching absorbed every burst into a single write and no contention existed; on Vercel several instances compete for the row, and the retries had no backoff, so all six attempts collided in lockstep and burned out in 211ms. Fixed with a single-statement compare-and-swap that returns fresh state on a lost race, randomised growing backoff over 20 attempts, a 40ms batching window, and one client-side retry on 5xx.

Earlier rounds also fixed: seeded fake players and fake punchlines, the vote screen locking after a timer expiry, vote-switch double-awards, flag tap-spam point farming, the score spoiler before reveal, only-two-punchlines-shown, the host click race that skipped voting, and ~20 copy/layout items.

---

## 5. Next steps, in priority order

1. **Resume on rejoin.** In `JOIN_GAME`, reattach by remembered id *or* by matching name before creating a player. Return a `resumed` flag so the phone can say "welcome back". (Caveat to note: two people typing an identical name would share a record — the "name + city" format makes this unlikely, and the alternative is a lying leaderboard.)
2. **Uncontrolled name input** in `PlayerLobby` (+ slower polling while the join form is open).
3. **Per-player remove** on the host: `REMOVE_PLAYER` host action plus a small × on each lobby chip. Also strips that player's submissions and votes.
4. **Host pause control**, and fix the frozen-timer / auto-reveal-anyway behaviour.
5. **Timers:** `quizSeconds` 30, `flagSeconds` 20 in `src/lib/content.ts`.
6. **Merge `live-test-fixes`** (projection + single-flight) into `main`.
7. Content and copy corrections from 3g.
8. Host layout: Quiplash reveal clipping, podium champion contrast, split-bar settle, scrolled-button responsiveness.
9. Player: explanation on the phone reveal, top-3 on the final card, bigger scoring print, proper Switch-player button, lobby heartbeat.
10. Surface failures to the user — a visible "that didn't send, try again" instead of silence.
11. **Then re-verify:** `tsc` + `eslint` + `npm run build`, `scripts/simulate.mjs 25 <url>`, `scripts/loadtest.mjs 150 <url>` against the deployment, and one more four-person rehearsal.

### Also worth deciding before the day

- **Access control.** Geoff's point: the site needs no login, carries RR branding and internal jokes on a real domain. `HOST_KEY` protects the host controls if set, but anyone with the URL can join. Consider whether that's acceptable, or set `HOST_KEY` at minimum.
- **Vercel dashboard:** Framework Preset is still **Vite** from the previous project and must be **Next.js**; confirm `DATABASE_URL` is the Neon one (the old app used the same variable name for a different database); confirm Deployment Protection doesn't put a Vercel login in front of production.
- **Rotate the Neon password** — it was shared in chat during setup.
- The room code is cosmetic-but-real: `?room=` works and is normalised; pick the code in advance and put it on the invite.

---

## 6. Testing commands

```bash
npx tsc --noEmit && npx eslint src && npm run build   # always, before anything
node scripts/simulate.mjs 25 https://www.internalrr.co.uk LIVESIM   # correctness, end to end
node scripts/loadtest.mjs 150 https://www.internalrr.co.uk LOAD     # event scale
```

Rehearse against `npm run build && npm start`, never `next dev` — a dying hot-reload socket under a phone page looks exactly like a frozen app, and cost a tester four minutes in an earlier round.

**Do not run the load test while a rehearsal is in progress** — it competes for the same instances and will produce phantom bugs in the rehearsal's report.
