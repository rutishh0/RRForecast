# Half Hands Live — working notes

See `README.md` for what this is, how to run it, scoring, and deployment.
**See `STATUS.md` for the current state: what is deployed, what is broken, and the prioritised next steps.** Start there.

This file is the rules of the codebase, for whoever (human or AI) edits it next.

## Layout

```
src/lib/content.ts      ALL game content + GAME_CONFIG (timers, points, how many items per game). Edit here first.
src/lib/gameLogic.ts    Pure rules: state machine, scoring at reveal, timeouts, player messages. No I/O.
src/lib/types.ts        GameState / Player / messages.
src/lib/useGameSync.ts  Client hook: polling, version guard, server-clock offset, smooth countdown.
src/lib/room.ts         Room-code normalisation (client-safe).
src/server/store.ts     Persistence: Neon Postgres (or in-memory fallback), per-room batching, optimistic writes.
src/app/api/game/sync   The only endpoint. GET reads (and applies timer expiry); POST applies host actions / player messages.
src/app/host/page.tsx   Host screen. src/components/host/*
src/app/play/page.tsx   Phone controller. src/components/player/*
scripts/simulate.mjs    Bot end-to-end assertion run. Run after ANY change to gameLogic or store.
scripts/loadtest.mjs    Event-scale test (150 players acting simultaneously) + payload-size assertions.
scripts/db-init.mjs     Creates the rooms table (also happens automatically on first request).
```

## Rules of the road

- **Scoring happens only at reveal** (`revealQuiz`, `revealQuiplash`, `revealFlag`). Never award points in a message handler — that is how the old vote-switch double-award and flag tap-spam exploits happened.
- **Timeouts and the host's Next share one code path** (`advance`). If you add a phase, add it there and in `applyTimeout`'s list of timed phases. A phase transition must call `resetRound` if the next phase accepts input.
- **`state.version` must increase on every mutation.** The client discards states with a lower version than it has already seen.
- **Do not read `state.timerSeconds` on the server** — it is derived on the way out (`withDerived`). Use `roundStartTime` + `timerTotal`.
- **Keep reducers re-runnable.** `store.ts` may apply a batch of mutators more than once on optimistic-write conflict.
- Player components that hold tap state must be mounted with a `key` tied to the question/prompt/scenario id (see `play/page.tsx`), so state never leaks between rounds.
- Content: wrong options must be *plausible misreadings*, short enough for a phone, and the Gen-Z line should use one or two slang terms, correctly. No name-dropping of people who aren't on the agenda. Keep it **decode-only** — never ask anyone to produce slang; that is what makes the game fun rather than humiliating for half the room.
- **Never name a live product in a joke** (the Trent 1000 durability question was pulled for this): the site has no login, carries RR branding, and a screenshot travels.
- The player payload must stay flat as headcount grows. Anything added to `GameState` is sent to 150 phones every second unless `projectForPlayer` trims it — and anything sent to a phone is readable by that phone, so it must not contain other people's answers or unrevealed authorship.
- Player-facing inputs must be **uncontrolled** (`defaultValue` + ref). A controlled input inside a component that re-renders every second from polling loses and duplicates characters as the user types.
- A phone that refreshes, locks or loses signal must come back as the **same player**. Minting a new record orphans their score and makes the leaderboard lie.

## Verify before claiming anything works

```bash
npx tsc --noEmit && npx eslint src && npm run build
node scripts/simulate.mjs 100      # needs the dev server running
```
Then actually open `/host?room=X` and `/play?room=X` in two tabs and play a round. Rehearse against `npm run build && npm start`, not `next dev` — hot-reload sockets dying under a phone page looks like a frozen app.

Note for automated browser testing: the desktop-app browser harness sends an empty key event for "space"; use Enter to test the host shortcut.

## Event facts

Thu 1 Oct 2026, 10:40–11:15 slot (planning for 30 min), ~100 people, ~80% remote on Teams + 15–20 in the Abu Dhabi office. Runs after Omar's "12 Weeks Until Christmas" and before Graduations & Closing. Simon (pub quiz, Tue) and Katie (Never Have I Ever, Wed) run the other energisers.
