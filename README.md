# Half Hands Live

Jackbox-style energiser for the Rolls-Royce Civil Aerospace **MEA Half Hands** (Thu 1 Oct 2026, 10:40–11:15, ~100 people on Teams). The host shares one browser tab on Teams; everyone else plays from their phone. No app, no login.

**Three games, ~30 minutes:** Brainrot Decryptor (8 speed-quiz questions) → MEA Quiplash (3 rounds of anonymous punchlines + voting) → Red Flag / Green Flag (8 scenarios) → podium.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000 (dev)
npm run build && npm start   # production build — use this for rehearsals
```

| URL | What |
|---|---|
| `/` | Launcher (pick a room code, open host or player) |
| `/host?room=TRENT` | **Host screen** — share this on Teams. Space/Enter = next phase, T = +10s, M = mute |
| `/play?room=TRENT` | **Phone controller** — the QR code on the host screen points here |
| `/api/game/sync` | State endpoint (GET to read, POST to act) |

Room codes are 2–10 upper-case letters/digits; anything else falls back to `TRENT`.

## Configuration

`.env.local` (never committed):

```
DATABASE_URL=postgresql://...      # Neon Postgres. Omit for an in-memory store (single process only).
HOST_KEY=some-secret               # Optional. If set, the host screen asks for it once and stores it locally.
```

Game content and tuning live in one file: [`src/lib/content.ts`](src/lib/content.ts) — questions, prompts, scenarios, timers, and points. Each game plays the first N items of its pool (`GAME_CONFIG.quizQuestions` etc.), so reorder to choose what gets played.

## Scoring

| Game | Points |
|---|---|
| Brainrot | Correct = 500 + up to 250 speed bonus (decays over the 20s) **+ 250 "Fast Five" bonus for the first five correct answers**. Wrong = 0. |
| Quiplash | +100 for sending a punchline, +250 per vote received (capped at 2,500), +1,000 to the round winner. No speed element. |
| Red / Green | +100 for voting, +150 if you sided with the majority. No speed element. |

All points are awarded at the moment of the reveal, so phones never leak whether you were right before the big screen does.

## How sync works

- One Postgres row per room holds the whole game state as JSON.
- Every action (join, answer, vote…) is a read-modify-write. Actions that arrive while a write is in flight are **batched into the next write** — a burst of 100 taps is one DB round-trip, not 100.
- Writes are optimistic (`UPDATE … WHERE version = expected`); if another server instance won the race, the batch is re-applied on the fresh row. Nothing is ever lost, nothing holds a lock across the network.
- Phones and host poll once a second and sync to the **server's clock**, so timers tick in lockstep worldwide regardless of poll timing.
- Answer reaction times are server-timestamped; phones may claim up to 1.5s of network latency back, and no more.
- Every timed phase opens with a 4-second **GET READY** beat (taps are refused until it ends), and stays open for a 1.5-second grace after the display hits 0 so a tap at "1s" still lands.
- Timers expire on the server: if the host does nothing, the phase advances on its own. A host click that arrives after the phase has already moved on is ignored (phase token), so nobody can accidentally skip a reveal.

## Deploy (Vercel + Neon)

1. `vercel.json` pins functions to **London (lhr1)**, next to the Neon `eu-west-2` database (~2ms per write).
2. Set `DATABASE_URL` (and optionally `HOST_KEY`) in the Vercel project's environment variables.
3. Deploy. The QR code on the host screen automatically uses the deployed origin.

## Testing

```bash
npm run build                          # type-check + production build
node scripts/simulate.mjs 100          # 100 bots play a full game against a running server and assert every rule
node scripts/db-init.mjs               # create the rooms table (also done automatically on first request)
```
